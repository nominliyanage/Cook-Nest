import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface MealNotification {
    id: string;
    mealId: string;
    title: string;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    scheduledTime: Date;
    notificationId?: string;
}

class NotificationService {
    private static instance: NotificationService;
    private isInitialized = false;

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async initialize(): Promise<boolean> {
        if (this.isInitialized) return true;

        try {
            // Check if device supports notifications
            if (!Device.isDevice) {
                console.log("Notifications only work on physical devices");
                return false;
            }

            // Request permissions
            const { status: existingStatus } =
                await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== "granted") {
                console.log("Notification permissions not granted");
                return false;
            }

            // Configure notification channel for Android
            if (Platform.OS === "android") {
                await Notifications.setNotificationChannelAsync("meal-reminders", {
                    name: "Meal Reminders",
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF231F7C",
                    sound: "default",
                    description: "Notifications for scheduled meal reminders",
                });
            }

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error("Error initializing notifications:", error);
            return false;
        }
    }

    async scheduleMealNotification(meal: {
        id: string;
        title: string;
        name: string;
        mealType: "breakfast" | "lunch" | "dinner" | "snack";
        plannedDate: string;
        reminderTime?: string; // Time like "08:00", "12:30", etc.
    }): Promise<string | null> {
        try {
            await this.initialize();

            // Default reminder times based on meal type
            const defaultTimes = {
                breakfast: "08:00",
                lunch: "12:00",
                dinner: "18:00",
                snack: "15:00",
            };

            const reminderTime = meal.reminderTime || defaultTimes[meal.mealType];
            const [hours, minutes] = reminderTime.split(":").map(Number);

            // Create notification date
            const notificationDate = new Date(meal.plannedDate);
            notificationDate.setHours(hours, minutes, 0, 0);

            // Don't schedule past notifications
            if (notificationDate < new Date()) {
                console.log("Cannot schedule notification for past time");
                return null;
            }

            const mealEmojis = {
                breakfast: "🍳",
                lunch: "🍽️",
                dinner: "🍝",
                snack: "🍎",
            };

            const notificationContent: Notifications.NotificationContentInput = {
                title: `${mealEmojis[meal.mealType]} Meal Reminder`,
                body: `Time for ${meal.mealType}: ${meal.title || meal.name}`,
                data: {
                    mealId: meal.id,
                    mealType: meal.mealType,
                    screen: "meal-detail",
                },
                sound: "default",
                priority: Notifications.AndroidNotificationPriority.HIGH,
                categoryIdentifier: "meal-reminder",
            };

            const trigger: Notifications.NotificationTriggerInput = {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: notificationDate,
            };

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: notificationContent,
                trigger,
            });

            // Store notification info
            await this.storeMealNotification({
                id: `${meal.id}_${Date.now()}`,
                mealId: meal.id,
                title: meal.title || meal.name,
                mealType: meal.mealType,
                scheduledTime: notificationDate,
                notificationId,
            });

            console.log(
                `Scheduled notification for ${meal.mealType} at ${notificationDate}`
            );
            return notificationId;
        } catch (error) {
            console.error("Error scheduling meal notification:", error);
            return null;
        }
    }

    async cancelMealNotification(mealId: string): Promise<void> {
        try {
            const notifications = await this.getMealNotifications();
            const mealNotifications = notifications.filter(
                (n) => n.mealId === mealId
            );

            for (const notification of mealNotifications) {
                if (notification.notificationId) {
                    await Notifications.cancelScheduledNotificationAsync(
                        notification.notificationId
                    );
                }
            }

            // Remove from storage
            const updatedNotifications = notifications.filter(
                (n) => n.mealId !== mealId
            );
            await AsyncStorage.setItem(
                "meal_notifications",
                JSON.stringify(updatedNotifications)
            );

            console.log(`Cancelled notifications for meal: ${mealId}`);
        } catch (error) {
            console.error("Error cancelling meal notification:", error);
        }
    }

    async updateMealNotification(meal: {
        id: string;
        title: string;
        name: string;
        mealType: "breakfast" | "lunch" | "dinner" | "snack";
        plannedDate: string;
        reminderTime?: string;
    }): Promise<string | null> {
        // Cancel existing notifications for this meal
        await this.cancelMealNotification(meal.id);

        // Schedule new notification
        return await this.scheduleMealNotification(meal);
    }

    async scheduleDailyMealReminders(
        meals: Array<{
            id: string;
            title: string;
            name: string;
            mealType: "breakfast" | "lunch" | "dinner" | "snack";
            plannedDate: string;
            reminderTime?: string;
        }>
    ): Promise<void> {
        for (const meal of meals) {
            await this.scheduleMealNotification(meal);
        }
    }

    async getScheduledNotifications(): Promise<
        Notifications.NotificationRequest[]
    > {
        return await Notifications.getAllScheduledNotificationsAsync();
    }

    async cancelAllMealNotifications(): Promise<void> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            await AsyncStorage.removeItem("meal_notifications");
            console.log("Cancelled all meal notifications");
        } catch (error) {
            console.error("Error cancelling all notifications:", error);
        }
    }

    // Notification response handling
    setupNotificationResponseListener(): Notifications.Subscription {
        return Notifications.addNotificationResponseReceivedListener((response) => {
            const { mealId, screen } = response.notification.request.content.data;

            // Handle navigation based on notification data
            console.log("Notification tapped:", { mealId, screen });

            // You can implement navigation logic here
            // For example: navigate to meal detail screen
        });
    }

    private async storeMealNotification(
        notification: MealNotification
    ): Promise<void> {
        try {
            const notifications = await this.getMealNotifications();
            notifications.push(notification);
            await AsyncStorage.setItem(
                "meal_notifications",
                JSON.stringify(notifications)
            );
        } catch (error) {
            console.error("Error storing meal notification:", error);
        }
    }

    private async getMealNotifications(): Promise<MealNotification[]> {
        try {
            const stored = await AsyncStorage.getItem("meal_notifications");
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Error getting meal notifications:", error);
            return [];
        }
    }

    // Helper method to format notification time
    formatNotificationTime(time: string): string {
        const [hours, minutes] = time.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    }

    // Get default notification times for meal types
    getDefaultNotificationTimes(): Record<string, string> {
        return {
            breakfast: "08:00",
            lunch: "12:00",
            dinner: "18:00",
            snack: "15:00",
        };
    }

    // Schedule daily reminders to plan meals
    async scheduleMealPlanningReminders(): Promise<void> {
        try {
            await this.initialize();

            // Get default times
            const defaultTimes = this.getDefaultNotificationTimes();

            // Get notification settings
            const storedSettings = await AsyncStorage.getItem(
                "notification_settings"
            );
            const settings = storedSettings
                ? JSON.parse(storedSettings)
                : { enabled: true };

            if (!settings.enabled) {
                console.log("Notifications are disabled in settings");
                return;
            }

            // Cancel any existing planning reminders
            await this.cancelMealPlanningReminders();

            // Schedule reminders for each meal type (30 minutes before the default meal time)
            const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

            for (const mealType of mealTypes) {
                // Check if this meal type notification is enabled
                const mealTypeKey = `${mealType}Enabled` as keyof typeof settings;
                if (settings[mealTypeKey] === false) {
                    console.log(`${mealType} notifications are disabled`);
                    continue;
                }

                // Get the time for this meal type
                const timeKey = `${mealType}Time` as keyof typeof settings;
                const timeString = settings[timeKey] || defaultTimes[mealType];
                const [hours, minutes] = timeString.split(":").map(Number);

                // Create date for tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(hours, minutes, 0, 0);

                // Set the notification 30 minutes before meal time
                const reminderTime = new Date(tomorrow);
                reminderTime.setMinutes(reminderTime.getMinutes() - 30);

                // Emojis for different meal types
                const mealEmojis = {
                    breakfast: "🍳",
                    lunch: "🍽️",
                    dinner: "🍝",
                    snack: "🍎",
                };

                // Schedule the notification
                const content: Notifications.NotificationContentInput = {
                    title: `${mealEmojis[mealType]} Plan Your ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
                    body: `Time to plan your ${mealType} for tomorrow! Tap to open Meal Mate and add a meal.`,
                    data: {
                        screen: "plan",
                        mealType: mealType,
                    },
                    sound: "default",
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                };

                const trigger: Notifications.NotificationTriggerInput = {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: reminderTime,
                };

                const notificationId = await Notifications.scheduleNotificationAsync({
                    content,
                    trigger,
                });

                console.log(
                    `Scheduled ${mealType} planning reminder for ${reminderTime.toLocaleString()}`
                );

                // Store notification ID for later management
                await this.storeMealPlanningReminder(mealType, notificationId);
            }
        } catch (error) {
            console.error("Error scheduling meal planning reminders:", error);
        }
    }

    // Cancel all meal planning reminders
    async cancelMealPlanningReminders(): Promise<void> {
        try {
            const reminders = await this.getMealPlanningReminders();

            for (const [mealType, notificationId] of Object.entries(reminders)) {
                if (notificationId) {
                    await Notifications.cancelScheduledNotificationAsync(notificationId);
                    console.log(`Cancelled ${mealType} planning reminder`);
                }
            }

            // Clear stored reminders
            await AsyncStorage.removeItem("meal_planning_reminders");
        } catch (error) {
            console.error("Error cancelling meal planning reminders:", error);
        }
    }

    // Store meal planning reminder IDs
    private async storeMealPlanningReminder(
        mealType: string,
        notificationId: string
    ): Promise<void> {
        try {
            const reminders = await this.getMealPlanningReminders();
            reminders[mealType] = notificationId;
            await AsyncStorage.setItem(
                "meal_planning_reminders",
                JSON.stringify(reminders)
            );
        } catch (error) {
            console.error("Error storing meal planning reminder:", error);
        }
    }

    // Get stored meal planning reminders
    private async getMealPlanningReminders(): Promise<Record<string, string>> {
        try {
            const stored = await AsyncStorage.getItem("meal_planning_reminders");
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error("Error getting meal planning reminders:", error);
            return {};
        }
    }

    // Test sending a meal planning reminder
    async sendTestMealPlanningReminder(mealType: string): Promise<void> {
        try {
            await this.initialize();

            const mealEmojis = {
                breakfast: "🍳",
                lunch: "🍽️",
                dinner: "🍝",
                snack: "🍎",
            };

            // Create notification content
            const content: Notifications.NotificationContentInput = {
                title: `${mealEmojis[mealType as keyof typeof mealEmojis] || "🍽️"} Plan Your ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
                body: `Time to plan your ${mealType}! Tap to open Meal Mate and add a meal.`,
                data: {
                    screen: "plan",
                    mealType: mealType,
                },
                sound: "default",
                priority: Notifications.AndroidNotificationPriority.HIGH,
            };

            // Send immediate notification
            await Notifications.scheduleNotificationAsync({
                content,
                trigger: null, // null trigger means send immediately
            });

            console.log(`Sent test ${mealType} planning reminder`);
        } catch (error) {
            console.error("Error sending test meal planning reminder:", error);
        }
    }
}

export default NotificationService.getInstance();

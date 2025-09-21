import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Switch,
    TouchableOpacity,
    Alert,
    ScrollView,
    StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import NotificationService from "../services/notificationService";

interface NotificationSettings {
    enabled: boolean;
    breakfast: { enabled: boolean; time: string };
    lunch: { enabled: boolean; time: string };
    dinner: { enabled: boolean; time: string };
    snack: { enabled: boolean; time: string };
    planningReminders: boolean; // Added for meal planning reminders
}

export default function NotificationSettingsScreen() {
    const { colors } = useTheme();
    const [settings, setSettings] = useState<NotificationSettings>({
        enabled: true,
        breakfast: { enabled: true, time: "08:00" },
        lunch: { enabled: true, time: "12:00" },
        dinner: { enabled: true, time: "18:00" },
        snack: { enabled: false, time: "15:00" },
        planningReminders: true, // Default to enabled
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
        initializeNotifications();
    }, []);

    const initializeNotifications = async () => {
        const initialized = await NotificationService.initialize();
        if (!initialized) {
            Alert.alert(
                "Notifications Disabled",
                "Please enable notifications in your device settings to receive meal reminders.",
                [{ text: "OK" }]
            );
        }
    };

    const loadSettings = async () => {
        try {
            const stored = await AsyncStorage.getItem("notification_settings");
            if (stored) {
                setSettings(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Error loading notification settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async (newSettings: NotificationSettings) => {
        try {
            await AsyncStorage.setItem(
                "notification_settings",
                JSON.stringify(newSettings)
            );
            setSettings(newSettings);
        } catch (error) {
            console.error("Error saving notification settings:", error);
        }
    };

    const toggleNotifications = async (enabled: boolean) => {
        if (!enabled) {
            // Cancel all notifications when disabled
            await NotificationService.cancelAllMealNotifications();
            await NotificationService.cancelMealPlanningReminders();
        }

        await saveSettings({ ...settings, enabled });
    };

    const toggleMealType = async (
        mealType: keyof Pick<
            NotificationSettings,
            "breakfast" | "lunch" | "dinner" | "snack"
        >,
        enabled: boolean
    ) => {
        const newSettings = {
            ...settings,
            [mealType]: { ...settings[mealType], enabled },
        };
        await saveSettings(newSettings);
    };

    const updateMealTime = (
        mealType: keyof Pick<
            NotificationSettings,
            "breakfast" | "lunch" | "dinner" | "snack"
        >,
        time: string
    ) => {
        Alert.prompt(
            "Set Reminder Time",
            `Enter time for ${mealType} reminders (HH:MM)`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save",
                    onPress: async (inputTime: string | undefined) => {
                        if (
                            inputTime &&
                            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(inputTime)
                        ) {
                            const newSettings = {
                                ...settings,
                                [mealType]: { ...settings[mealType], time: inputTime },
                            };
                            await saveSettings(newSettings);
                        } else {
                            Alert.alert(
                                "Invalid Time",
                                "Please enter a valid time in HH:MM format"
                            );
                        }
                    },
                },
            ],
            "plain-text",
            time
        );
    };

    const testNotification = async () => {
        try {
            await NotificationService.scheduleMealNotification({
                id: "test",
                title: "Test Meal",
                name: "Test Meal",
                mealType: "lunch",
                plannedDate: new Date().toISOString(),
                reminderTime: new Date(Date.now() + 5000).toTimeString().slice(0, 5), // 5 seconds from now
            });
            Alert.alert(
                "Test Notification",
                "A test notification will appear in 5 seconds!"
            );
        } catch (error) {
            Alert.alert("Error", "Failed to schedule test notification");
        }
    };

    const testPlanningReminder = async () => {
        try {
            // Test a planning reminder for a random meal type
            const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
            const randomMealType =
                mealTypes[Math.floor(Math.random() * mealTypes.length)];

            await NotificationService.sendTestMealPlanningReminder(randomMealType);

            Alert.alert(
                "Test Planning Reminder",
                `A test ${randomMealType} planning reminder will appear in a few seconds!`
            );
        } catch (error) {
            Alert.alert("Error", "Failed to send test planning reminder");
        }
    };

    const togglePlanningReminders = async (enabled: boolean) => {
        if (!enabled) {
            // Cancel planning reminders when disabled
            await NotificationService.cancelMealPlanningReminders();
        } else {
            // Schedule planning reminders when enabled
            await NotificationService.scheduleMealPlanningReminders();
        }

        await saveSettings({ ...settings, planningReminders: enabled });
    };

    const mealTypeIcons = {
        breakfast: "free-breakfast",
        lunch: "restaurant",
        dinner: "dinner-dining",
        snack: "fastfood",
    };

    const mealTypeLabels = {
        breakfast: "Breakfast",
        lunch: "Lunch",
        dinner: "Dinner",
        snack: "Snacks",
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <MaterialIcons
                        name="notifications"
                        size={32}
                        color={colors.primary}
                    />
                    <Text style={[styles.title, { color: colors.text }]}>
                        Meal Notifications
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Get reminded when it's time to eat
                    </Text>
                </View>

                {/* Master Toggle */}
                <View
                    style={[
                        styles.settingCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                >
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>
                                Enable Notifications
                            </Text>
                            <Text
                                style={[
                                    styles.settingDescription,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                Receive meal reminders on this device
                            </Text>
                        </View>
                        <Switch
                            value={settings.enabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: colors.border, true: colors.primary + "40" }}
                            thumbColor={
                                settings.enabled ? colors.primary : colors.textSecondary
                            }
                        />
                    </View>
                </View>

                {/* Meal Type Settings */}
                {settings.enabled && (
                    <View
                        style={[
                            styles.settingCard,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                    >
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                            Meal Reminders
                        </Text>

                        {Object.entries(settings).map(([key, value]) => {
                            if (key === "enabled" || typeof value !== "object") return null;

                            const mealType = key as keyof Pick<
                                NotificationSettings,
                                "breakfast" | "lunch" | "dinner" | "snack"
                            >;

                            return (
                                <View key={mealType} style={styles.mealTypeRow}>
                                    <View style={styles.mealTypeInfo}>
                                        <View style={styles.mealTypeHeader}>
                                            <MaterialIcons
                                                name={mealTypeIcons[mealType] as any}
                                                size={24}
                                                color={colors.primary}
                                            />
                                            <Text
                                                style={[styles.mealTypeTitle, { color: colors.text }]}
                                            >
                                                {mealTypeLabels[mealType]}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => updateMealTime(mealType, value.time)}
                                            style={styles.timeButton}
                                        >
                                            <Text
                                                style={[styles.timeText, { color: colors.primary }]}
                                            >
                                                {NotificationService.formatNotificationTime(value.time)}
                                            </Text>
                                            <MaterialIcons
                                                name="edit"
                                                size={16}
                                                color={colors.primary}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <Switch
                                        value={value.enabled}
                                        onValueChange={(enabled) =>
                                            toggleMealType(mealType, enabled)
                                        }
                                        trackColor={{
                                            false: colors.border,
                                            true: colors.primary + "40",
                                        }}
                                        thumbColor={
                                            value.enabled ? colors.primary : colors.textSecondary
                                        }
                                    />
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Meal Planning Reminders */}
                {settings.enabled && (
                    <View
                        style={[
                            styles.settingCard,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                    >
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>
                                    Meal Planning Reminders
                                </Text>
                                <Text
                                    style={[
                                        styles.settingDescription,
                                        { color: colors.textSecondary },
                                    ]}
                                >
                                    Get reminded to plan your meals before mealtime
                                </Text>
                            </View>
                            <Switch
                                value={settings.planningReminders}
                                onValueChange={togglePlanningReminders}
                                trackColor={{
                                    false: colors.border,
                                    true: colors.primary + "40",
                                }}
                                thumbColor={
                                    settings.planningReminders
                                        ? colors.primary
                                        : colors.textSecondary
                                }
                            />
                        </View>

                        {settings.planningReminders && (
                            <View
                                style={{
                                    marginTop: 15,
                                    padding: 12,
                                    backgroundColor: colors.primary + "10",
                                    borderRadius: 8,
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <MaterialIcons
                                    name="schedule"
                                    size={20}
                                    color={colors.primary}
                                />
                                <Text
                                    style={{
                                        marginLeft: 10,
                                        fontSize: 14,
                                        color: colors.textSecondary,
                                        flex: 1,
                                    }}
                                >
                                    You'll receive reminders 30 minutes before each meal time to
                                    plan your meals
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Test Notification */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 20,
                    }}
                >
                    <TouchableOpacity
                        style={[
                            styles.testButton,
                            { backgroundColor: colors.primary, flex: 1, marginRight: 8 },
                        ]}
                        onPress={testNotification}
                    >
                        <MaterialIcons
                            name="notifications-active"
                            size={20}
                            color="white"
                        />
                        <Text style={styles.testButtonText}>Test Meal Reminder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.testButton,
                            { backgroundColor: colors.primary, flex: 1, marginLeft: 8 },
                        ]}
                        onPress={testPlanningReminder}
                    >
                        <MaterialIcons name="schedule" size={20} color="white" />
                        <Text style={styles.testButtonText}>Test Planning Reminder</Text>
                    </TouchableOpacity>
                </View>

                {/* Info Card */}
                <View
                    style={[
                        styles.infoCard,
                        {
                            backgroundColor: colors.primary + "10",
                            borderColor: colors.primary + "30",
                        },
                    ]}
                >
                    <MaterialIcons name="info" size={24} color={colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={[styles.infoTitle, { color: colors.primary }]}>
                            How it works
                        </Text>
                        <Text style={[styles.infoText, { color: colors.text }]}>
                            • Notifications are sent at the times you set{"\n"}• Only enabled
                            meal types will send reminders{"\n"}• You can test notifications
                            using the button above{"\n"}• Notifications work even when the app
                            is closed
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    loadingText: {
        textAlign: "center",
        marginTop: 50,
        fontSize: 16,
    },
    header: {
        alignItems: "center",
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginTop: 10,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 5,
        textAlign: "center",
    },
    settingCard: {
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
    },
    settingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    settingInfo: {
        flex: 1,
        marginRight: 15,
    },
    settingTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    settingDescription: {
        fontSize: 14,
        marginTop: 4,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 20,
    },
    mealTypeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.1)",
    },
    mealTypeInfo: {
        flex: 1,
    },
    mealTypeHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    mealTypeTitle: {
        fontSize: 16,
        fontWeight: "500",
        marginLeft: 10,
    },
    timeButton: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 34,
    },
    timeText: {
        fontSize: 14,
        marginRight: 5,
    },
    testButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    testButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 10,
    },
    infoCard: {
        flexDirection: "row",
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
    },
    infoContent: {
        flex: 1,
        marginLeft: 15,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
    },
});

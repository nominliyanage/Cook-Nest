import { View, SafeAreaView, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationService from "@/services/notificationService";
import { scheduleNotificationsForPlannedMeals } from "@/services/mealService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FooterNav from "@/components/FooterNav";

const DashboardLayout = () => {
    const { user, loading } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading]);

    // Initialize notifications when user is logged in
    useEffect(() => {
        const initializeNotifications = async () => {
            if (user) {
                // Initialize notification service
                await NotificationService.initialize();

                // Set up notification response listener
                const subscription =
                    NotificationService.setupNotificationResponseListener();

                // Schedule notifications for existing planned meals
                await scheduleNotificationsForPlannedMeals(user.uid);

                // Schedule meal planning reminders
                try {
                    const storedSettings = await AsyncStorage.getItem(
                        "notification_settings"
                    );
                    const settings = storedSettings
                        ? JSON.parse(storedSettings)
                        : { enabled: true, planningReminders: true };

                    if (settings.enabled && settings.planningReminders) {
                        await NotificationService.scheduleMealPlanningReminders();
                        console.log("Scheduled meal planning reminders on app start");
                    }
                } catch (error) {
                    console.error("Error scheduling meal planning reminders:", error);
                }

                return () => subscription.remove();
            }
        };

        initializeNotifications();
    }, [user]);

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: { display: "none" }, // Hide the default tab bar
                }}
            >
                <Tabs.Screen name="home" options={{ href: "/(dashboard)/home" }} />
                <Tabs.Screen name="meals" options={{ href: "/(dashboard)/meals" }} />
                <Tabs.Screen
                    name="fresh-discovery"
                    options={{ href: "/(dashboard)/fresh-discovery" }}
                />
                <Tabs.Screen
                    name="favourites"
                    options={{ href: "/(dashboard)/favourites" }}
                />
                <Tabs.Screen name="profile" options={{ href: "/(dashboard)/profile" }} />

                {/* Hide these extra screens from navigation */}
                <Tabs.Screen name="settings" options={{ href: null }} />
                <Tabs.Screen name="notifications" options={{ href: null }} />
                <Tabs.Screen name="plan" options={{ href: null }} />
                <Tabs.Screen name="qr-generator" options={{ href: null }} />
            </Tabs>

            {/* Use our custom FooterNav instead */}
            <FooterNav />
        </SafeAreaView>
    );
};

export default DashboardLayout;

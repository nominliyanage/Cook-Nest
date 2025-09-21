import { View, SafeAreaView, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationService from "@/services/notificationService";
import { scheduleNotificationsForPlannedMeals } from "@/services/mealService";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textSecondary,
                    tabBarStyle: {
                        backgroundColor: colors.card,
                        borderTopColor: colors.border,
                        borderTopWidth: 1,
                        paddingTop: 8,
                        paddingBottom: 8,
                        height: 70,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: "600",
                        marginTop: 4,
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: "Home",
                        tabBarIcon: ({ focused, size, color }) => (
                            <MaterialIcons
                                name={focused ? "home" : "home"}
                                size={size}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="meals"
                    options={{
                        title: "Meals",
                        tabBarIcon: ({ focused, size, color }) => (
                            <MaterialIcons
                                name={focused ? "restaurant-menu" : "restaurant-menu"}
                                size={size}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="favourites"
                    options={{
                        title: "Favorites",
                        tabBarIcon: ({ focused, size, color }) => (
                            <MaterialIcons
                                name={focused ? "favorite" : "favorite-border"}
                                size={size}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="plan"
                    options={{
                        title: "Planner",
                        tabBarIcon: ({ focused, size, color }) => (
                            <MaterialIcons
                                name={focused ? "calendar-today" : "calendar-today"}
                                size={size}
                                color={color}
                            />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Profile",
                        tabBarIcon: ({ focused, size, color }) => (
                            <MaterialIcons
                                name={focused ? "person" : "person-outline"}
                                size={size}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: "Settings",
                        tabBarIcon: ({ focused, size, color }) => (
                            <MaterialIcons
                                name={focused ? "settings" : "settings"}
                                size={size}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="notifications"
                    options={{
                        href: null, // Hide from tab bar, accessible via navigation
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
};

export default DashboardLayout;

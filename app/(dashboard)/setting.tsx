import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { getUserProfile } from "../../services/userService";

export default function SettingsScreen() {
    const { colors, isDark, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (user) {
                try {
                    const profile = await getUserProfile(user.uid);
                    setUserProfile(profile);
                } catch (error) {
                    console.error("Error loading profile:", error);
                }
            }
        };
        loadProfile();
    }, [user]);

    const handleLogout = () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: async () => {
                    try {
                        await signOut();
                        router.replace("/login");
                    } catch (error) {
                        Alert.alert("Error", "Failed to sign out");
                    }
                },
            },
        ]);
    };

    const openURL = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert("Error", "Failed to open link");
        }
    };

    const SettingsSection = ({
                                 title,
                                 children,
                             }: {
        title: string;
        children: React.ReactNode;
    }) => (
        <View style={{ marginBottom: 24 }}>
            <Text
                style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 12,
                    paddingHorizontal: 16,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                }}
            >
                {title}
            </Text>
            <View
                style={{
                    backgroundColor: colors.card,
                    marginHorizontal: 16,
                    borderRadius: 12,
                    overflow: "hidden",
                }}
            >
                {children}
            </View>
        </View>
    );

    const SettingsItem = ({
                              icon,
                              title,
                              subtitle,
                              onPress,
                              rightElement,
                              showChevron = true,
                              isLast = false,
                          }: any) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: colors.border,
            }}
            disabled={!onPress}
        >
            <View
                style={{
                    backgroundColor: colors.primary,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 16,
                }}
            >
                <MaterialIcons name={icon} size={20} color="white" />
            </View>

            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: "500",
                        color: colors.text,
                        marginBottom: subtitle ? 2 : 0,
                    }}
                >
                    {title}
                </Text>
                {subtitle && (
                    <Text
                        style={{
                            fontSize: 14,
                            color: colors.textSecondary,
                        }}
                    >
                        {subtitle}
                    </Text>
                )}
            </View>

            {rightElement ||
                (showChevron && onPress && (
                    <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color={colors.textSecondary}
                    />
                ))}
        </TouchableOpacity>
    );

    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View
                style={{
                    padding: 16,
                    paddingTop: 24,
                    alignItems: "center",
                }}
            >
                <View
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: colors.primary,
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 16,
                    }}
                >
                    {userProfile?.profileImage ? (
                        // TODO: Add Image component when available
                        <MaterialIcons name="person" size={40} color="white" />
                    ) : (
                        <MaterialIcons name="person" size={40} color="white" />
                    )}
                </View>

                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: colors.text,
                        marginBottom: 4,
                    }}
                >
                    {userProfile?.firstName && userProfile?.lastName
                        ? `${userProfile.firstName} ${userProfile.lastName}`
                        : "User"}
                </Text>

                <Text
                    style={{
                        fontSize: 16,
                        color: colors.textSecondary,
                    }}
                >
                    {user?.email}
                </Text>
            </View>

            {/* Account Section */}
            <SettingsSection title="Account">
                <SettingsItem
                    icon="person"
                    title="Edit Profile"
                    subtitle="Update your personal information"
                    onPress={() => router.push("/profile")}
                />
                <SettingsItem
                    icon="security"
                    title="Privacy & Security"
                    subtitle="Manage your account security"
                    onPress={() =>
                        Alert.alert("Coming Soon", "This feature will be available soon")
                    }
                    isLast
                />
            </SettingsSection>

            {/* App Settings */}
            <SettingsSection title="App Settings">
                <SettingsItem
                    icon="palette"
                    title="Dark Mode"
                    subtitle={`Currently using ${isDark ? "dark" : "light"} theme`}
                    onPress={toggleTheme}
                    rightElement={
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={isDark ? "white" : colors.textSecondary}
                        />
                    }
                    showChevron={false}
                />
                <SettingsItem
                    icon="notifications"
                    title="Notifications"
                    subtitle="Manage meal reminders and updates"
                    onPress={() => router.push("/notifications" as any)}
                />
                <SettingsItem
                    icon="language"
                    title="Language"
                    subtitle="English"
                    onPress={() =>
                        Alert.alert("Coming Soon", "This feature will be available soon")
                    }
                    isLast
                />
            </SettingsSection>

            {/* Data & Storage */}
            <SettingsSection title="Data & Storage">
                <SettingsItem
                    icon="backup"
                    title="Backup & Sync"
                    subtitle="Your data is automatically backed up"
                    onPress={() =>
                        Alert.alert(
                            "Backup Status",
                            "Your meal data is safely stored in the cloud"
                        )
                    }
                />
                <SettingsItem
                    icon="storage"
                    title="Storage Usage"
                    subtitle="Manage your meal photos and data"
                    onPress={() =>
                        Alert.alert("Coming Soon", "This feature will be available soon")
                    }
                />
                <SettingsItem
                    icon="download"
                    title="Export Data"
                    subtitle="Download your meal data"
                    onPress={() =>
                        Alert.alert("Coming Soon", "This feature will be available soon")
                    }
                    isLast
                />
            </SettingsSection>

            {/* Support */}
            <SettingsSection title="Support">
                <SettingsItem
                    icon="help"
                    title="Help & FAQ"
                    subtitle="Get answers to common questions"
                    onPress={() =>
                        Alert.alert(
                            "Help",
                            "For support, please contact us at support@mealmate.com"
                        )
                    }
                />
                <SettingsItem
                    icon="feedback"
                    title="Send Feedback"
                    subtitle="Help us improve MealMate"
                    onPress={() =>
                        Alert.alert(
                            "Feedback",
                            "Thank you for using MealMate! Please send your feedback to feedback@mealmate.com"
                        )
                    }
                />
                <SettingsItem
                    icon="star"
                    title="Rate the App"
                    subtitle="Share your experience"
                    onPress={() =>
                        Alert.alert(
                            "Rate MealMate",
                            "Thank you for your support! Please rate us on the app store."
                        )
                    }
                />
                <SettingsItem
                    icon="info"
                    title="About MealMate"
                    subtitle="Version 1.0.0"
                    onPress={() =>
                        Alert.alert(
                            "About MealMate",
                            "MealMate v1.0.0\n\nYour personal meal planning companion.\n\nDeveloped with ❤️ for food lovers."
                        )
                    }
                    isLast
                />
            </SettingsSection>

            {/* Sign Out */}
            <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
                <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                        backgroundColor: colors.error,
                        paddingVertical: 16,
                        paddingHorizontal: 24,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <MaterialIcons name="logout" size={20} color="white" />
                    <Text
                        style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "600",
                            marginLeft: 8,
                        }}
                    >
                        Sign Out
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View
                style={{
                    padding: 16,
                    alignItems: "center",
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    marginTop: 16,
                }}
            >
                <Text
                    style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        textAlign: "center",
                        marginBottom: 8,
                    }}
                >
                    MealMate - Your Personal Meal Planning Companion
                </Text>
                <Text
                    style={{
                        color: colors.textSecondary,
                        fontSize: 10,
                        textAlign: "center",
                    }}
                >
                    Made with ❤️ for food enthusiasts
                </Text>
            </View>
        </ScrollView>
    );
}

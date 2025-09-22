import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import {
    getUserProfile,
    updateUserProfile,
    createOrUpdateUserProfile,
    UserProfile,
} from "@/services/userService";

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const { colors, toggleTheme, isDark } = useTheme();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form fields
    const [displayName, setDisplayName] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (user?.uid && user?.email) {
            setIsLoading(true);
            try {
                let userProfile = await getUserProfile(user.uid);

                // If profile doesn't exist, create a basic one
                if (!userProfile && user.email) {
                    await createOrUpdateUserProfile(user.uid, user.email, {
                        displayName: user.email.split("@")[0], // Use email prefix as default display name
                    });
                    userProfile = await getUserProfile(user.uid);
                }

                if (userProfile) {
                    setProfile(userProfile);
                    setDisplayName(userProfile.displayName || "");
                    setProfileImage(userProfile.profileImage || "");
                    setPhone(userProfile.phone || "");
                    setBio(userProfile.bio || "");
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSave = async () => {
        if (!user?.uid) return;

        setIsSaving(true);
        try {
            await updateUserProfile(user.uid, {
                displayName,
                profileImage,
                phone,
                bio,
            });

            await loadProfile();
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully! ✨");
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImagePicker = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const handleLogout = () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: async () => {
                    try {
                        await signOut();
                        router.replace("/(auth)/login");
                    } catch (error) {
                        Alert.alert("Error", "Failed to sign out");
                    }
                },
            },
        ]);
    };

    if (isLoading) {
        return (
            <SafeAreaView
                style={[styles.loadingContainer, { backgroundColor: colors.background }]}
            >
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading your fresh profile...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Header */}
            <LinearGradient
                colors={colors.gradient.primary}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: colors.surface }]}>
                        Profile 👤
                    </Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setIsEditing(!isEditing)}
                    >
                        <MaterialIcons
                            name={isEditing ? "close" : "edit"}
                            size={24}
                            color={colors.surface}
                        />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Image Section */}
                <View
                    style={[styles.imageSection, { backgroundColor: colors.surface }]}
                >
                    <TouchableOpacity
                        style={styles.imageContainer}
                        onPress={isEditing ? handleImagePicker : undefined}
                    >
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <LinearGradient
                                colors={colors.gradient.accent}
                                style={styles.placeholderImage}
                            >
                                <MaterialIcons name="person" size={60} color={colors.surface} />
                            </LinearGradient>
                        )}
                        {isEditing && (
                            <View
                                style={[styles.editImageOverlay, { backgroundColor: colors.primary }]}
                            >
                                <MaterialIcons name="camera-alt" size={24} color={colors.surface} />
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={[styles.emailText, { color: colors.textMuted }]}>
                        {user?.email}
                    </Text>
                </View>

                {/* Profile Fields */}
                <View
                    style={[styles.fieldsSection, { backgroundColor: colors.surface }]}
                >
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Profile Information
                    </Text>

                    {/* Display Name */}
                    <View style={styles.fieldContainer}>
                        <Text
                            style={[styles.fieldLabel, { color: colors.textSecondary }]}
                        >
                            Display Name
                        </Text>
                        {isEditing ? (
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: colors.backgroundSecondary, color: colors.text },
                                ]}
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Your display name"
                                placeholderTextColor={colors.textMuted}
                            />
                        ) : (
                            <Text style={[styles.fieldValue, { color: colors.text }]}>
                                {displayName || "Not set"}
                            </Text>
                        )}
                    </View>

                    {/* Phone */}
                    <View style={styles.fieldContainer}>
                        <Text
                            style={[styles.fieldLabel, { color: colors.textSecondary }]}
                        >
                            Phone Number
                        </Text>
                        {isEditing ? (
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: colors.backgroundSecondary, color: colors.text },
                                ]}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Your phone number"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text style={[styles.fieldValue, { color: colors.text }]}>
                                {phone || "Not set"}
                            </Text>
                        )}
                    </View>

                    {/* Bio */}
                    <View style={styles.fieldContainer}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                            Bio
                        </Text>
                        {isEditing ? (
                            <TextInput
                                style={[
                                    styles.textArea,
                                    { backgroundColor: colors.backgroundSecondary, color: colors.text },
                                ]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={3}
                            />
                        ) : (
                            <Text style={[styles.fieldValue, { color: colors.text }]}>
                                {bio || "No bio yet"}
                            </Text>
                        )}
                    </View>

                    {isEditing && (
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color={colors.surface} />
                            ) : (
                                <>
                                    <MaterialIcons name="check" size={20} color={colors.surface} />
                                    <Text
                                        style={[styles.saveButtonText, { color: colors.surface }]}
                                    >
                                        Save Changes
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Settings Section */}
                <View
                    style={[styles.settingsSection, { backgroundColor: colors.surface }]}
                >
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Settings
                    </Text>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={toggleTheme}
                    >
                        <MaterialIcons
                            name={isDark ? "light-mode" : "dark-mode"}
                            size={24}
                            color={colors.primary}
                        />
                        <Text style={[styles.settingText, { color: colors.text }]}>
                            {isDark ? "Light Mode" : "Dark Mode"}
                        </Text>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => router.push("/(dashboard)/notifications")}
                    >
                        <MaterialIcons name="notifications" size={24} color={colors.primary} />
                        <Text style={[styles.settingText, { color: colors.text }]}>
                            Notifications
                        </Text>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.error }]}
                    onPress={handleLogout}
                >
                    <MaterialIcons name="logout" size={24} color={colors.surface} />
                    <Text style={[styles.logoutText, { color: colors.surface }]}>
                        Sign Out
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        marginTop: 16,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
    },
    imageSection: {
        alignItems: "center",
        padding: 30,
        margin: 16,
        borderRadius: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    imageContainer: {
        position: "relative",
        marginBottom: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    placeholderImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
    },
    editImageOverlay: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
    },
    emailText: {
        fontSize: 16,
        textAlign: "center",
    },
    fieldsSection: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    fieldValue: {
        fontSize: 16,
        paddingVertical: 8,
    },
    input: {
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
    },
    textArea: {
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        textAlignVertical: "top",
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    settingsSection: {
        margin: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    settingText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
        marginLeft: 16,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        margin: 20,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
});

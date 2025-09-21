import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Button,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
    getUserProfile,
    updateUserProfile,
    createOrUpdateUserProfile,
    UserProfile,
} from "@/services/userService";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
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

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required", "Please allow access to your photos.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!user?.uid || !user?.email) return;

        setIsSaving(true);
        try {
            await createOrUpdateUserProfile(user.uid, user.email, {
                displayName,
                profileImage,
                phone,
                bio,
            });
            await loadProfile(); // Reload to get updated data
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };
    const handleCancel = () => {
        // Reset form fields to original values
        setDisplayName(profile?.displayName || "");
        setProfileImage(profile?.profileImage || "");
        setPhone(profile?.phone || "");
        setBio(profile?.bio || "");
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" />
                <Text>Loading profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, padding: 20 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
                <TouchableOpacity onPress={isEditing ? pickImage : undefined}>
                    {profileImage ? (
                        <Image
                            source={{ uri: profileImage }}
                            style={{
                                width: 120,
                                height: 120,
                                borderRadius: 60,
                                marginBottom: 10,
                            }}
                        />
                    ) : (
                        <View
                            style={{
                                width: 120,
                                height: 120,
                                borderRadius: 60,
                                backgroundColor: "#e0e0e0",
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: 10,
                            }}
                        >
                            <Text style={{ color: "#666" }}>No Photo</Text>
                        </View>
                    )}
                    {isEditing && (
                        <Text style={{ textAlign: "center", color: "#007AFF" }}>
                            Tap to change photo
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
                    Display Name
                </Text>
                {isEditing ? (
                    <TextInput
                        value={displayName}
                        onChangeText={setDisplayName}
                        style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            padding: 10,
                            borderRadius: 8,
                            fontSize: 16,
                        }}
                        placeholder="Enter display name"
                    />
                ) : (
                    <Text
                        style={{
                            fontSize: 16,
                            padding: 10,
                            backgroundColor: "#f5f5f5",
                            borderRadius: 8,
                        }}
                    >
                        {profile?.displayName || "Not set"}
                    </Text>
                )}
            </View>

            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
                    Email
                </Text>
                <Text
                    style={{
                        fontSize: 16,
                        padding: 10,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 8,
                        color: "#666",
                    }}
                >
                    {user?.email}
                </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
                    Phone
                </Text>
                {isEditing ? (
                    <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            padding: 10,
                            borderRadius: 8,
                            fontSize: 16,
                        }}
                        placeholder="Enter phone number"
                    />
                ) : (
                    <Text
                        style={{
                            fontSize: 16,
                            padding: 10,
                            backgroundColor: "#f5f5f5",
                            borderRadius: 8,
                        }}
                    >
                        {profile?.phone || "Not set"}
                    </Text>
                )}
            </View>

            <View style={{ marginBottom: 30 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
                    Bio
                </Text>
                {isEditing ? (
                    <TextInput
                        value={bio}
                        onChangeText={setBio}
                        style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            padding: 10,
                            borderRadius: 8,
                            fontSize: 16,
                            height: 100,
                            textAlignVertical: "top",
                        }}
                        placeholder="Tell us about yourself"
                        multiline
                    />
                ) : (
                    <Text
                        style={{
                            fontSize: 16,
                            padding: 10,
                            backgroundColor: "#f5f5f5",
                            borderRadius: 8,
                            minHeight: 100,
                        }}
                    >
                        {profile?.bio || "No bio added"}
                    </Text>
                )}
            </View>

            {isEditing ? (
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 20,
                    }}
                >
                    <TouchableOpacity
                        onPress={handleCancel}
                        style={{
                            backgroundColor: "#ccc",
                            padding: 15,
                            borderRadius: 8,
                            flex: 1,
                            marginRight: 10,
                        }}
                        disabled={isSaving}
                    >
                        <Text style={{ textAlign: "center", fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSave}
                        style={{
                            backgroundColor: "#007AFF",
                            padding: 15,
                            borderRadius: 8,
                            flex: 1,
                            marginLeft: 10,
                        }}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text
                                style={{ textAlign: "center", fontSize: 16, color: "white" }}
                            >
                                Save
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={{
                        backgroundColor: "#007AFF",
                        padding: 15,
                        borderRadius: 8,
                        marginBottom: 20,
                    }}
                >
                    <Text style={{ textAlign: "center", fontSize: 16, color: "white" }}>
                        Edit Profile
                    </Text>
                </TouchableOpacity>
            )}

            <Button title="Logout" onPress={signOut} color="#FF3B30" />
        </ScrollView>
    );
}

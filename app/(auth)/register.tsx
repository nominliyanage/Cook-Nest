import { register } from "@/services/authService";
import { createUserProfile } from "@/services/userService";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const Register = () => {
    const router = useRouter();
    const [email, setEmail] = React.useState<string>("");
    const [password, setPassword] = React.useState<string>("");
    const [confirmPassword, setConfirmPassword] = React.useState<string>("");
    const [displayName, setDisplayName] = React.useState<string>("");
    const [profileImage, setProfileImage] = React.useState<string>("");
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    // Image picker handler
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

    const handleRegister = async () => {
        // Handle registration logic here
        if (!email || !password || !confirmPassword || !displayName) {
            alert("Please fill in all required fields");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await register(email, password);
            const user = userCredential.user;

            // Create user profile
            await createUserProfile({
                uid: user.uid,
                email: user.email || email,
                displayName,
                profileImage: profileImage || "",
                createdAt: new Date().toISOString(),
            });

            router.replace("/home");
        } catch (err) {
            alert("Registration Failed");
            console.error("Registration Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 w-full justify-center align-items-center p-4">
            <Text className="text-4xl text-center">Register</Text>
            <Text className="text-lg text-center mb-4">Create a new account</Text>

            <TouchableOpacity
                className="bg-gray-200 p-4 rounded-lg shadow-lg mb-4 w-full items-center"
                onPress={pickImage}
            >
                {profileImage ? (
                    <Image
                        source={{ uri: profileImage }}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            marginBottom: 8,
                        }}
                    />
                ) : (
                    <View
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            backgroundColor: "#ccc",
                            justifyContent: "center",
                            alignItems: "center",
                            marginBottom: 8,
                        }}
                    >
                        <Text>Add Photo</Text>
                    </View>
                )}
                <Text className="text-center">
                    {profileImage ? "Change Photo" : "Select Profile Photo"}
                </Text>
            </TouchableOpacity>

            <TextInput
                placeholder="Display Name *"
                placeholderTextColor="#999"
                value={displayName}
                onChangeText={setDisplayName}
                style={{
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    marginBottom: 16,
                    width: "100%",
                    fontSize: 16,
                    backgroundColor: "#fff",
                }}
            />
            <TextInput
                placeholder="Email *"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    marginBottom: 16,
                    width: "100%",
                    fontSize: 16,
                    backgroundColor: "#fff",
                }}
            />
            <TextInput
                placeholder="Password *"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    marginBottom: 16,
                    width: "100%",
                    fontSize: 16,
                    backgroundColor: "#fff",
                }}
            />
            <TextInput
                placeholder="Confirm Password *"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={{
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    marginBottom: 16,
                    width: "100%",
                    fontSize: 16,
                    backgroundColor: "#fff",
                }}
            />
            <TouchableOpacity
                className="bg-blue-500 p-4 rounded-lg shadow-lg mt-4 w-full"
                onPress={handleRegister}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Text className="text-lg text-center text-white">Register</Text>
                )}
            </TouchableOpacity>

            <Text className="text-center mt-4">Already have an account?</Text>
            <Pressable
                className="bg-green-500 p-4 rounded-lg shadow-lg w-full mt-2"
                onPress={() => router.push("/login")}
            >
                <Text className="text-lg text-white text-center">Go to Login</Text>
            </Pressable>
        </View>
    );
};

export default Register;

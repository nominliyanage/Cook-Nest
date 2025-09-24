import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { login } from "@/services/authService";

const Login = () => {
    const router = useRouter();
    const { colors } = useTheme();
    const [email, setEmail] = React.useState<string>("");
    const [password, setPassword] = React.useState<string>("");
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [showPassword, setShowPassword] = React.useState<boolean>(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            await login(email, password);
            router.replace("/home");
        } catch (err) {
            Alert.alert(
                "Login Failed",
                "Please check your credentials and try again"
            );
            console.error("Login Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        paddingHorizontal: 24,
                        paddingVertical: 48,
                    }}
                >
                    {/* App Logo/Icon */}
                    <View
                        style={{
                            alignItems: "center",
                            marginBottom: 48,
                        }}
                    >
                        <View
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                backgroundColor: colors.primary,
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: 24,
                                shadowColor: colors.text,
                                shadowOpacity: 0.2,
                                shadowOffset: { width: 0, height: 4 },
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            <MaterialIcons name="restaurant-menu" size={50} color="white" />
                        </View>

                        <Text
                            style={{
                                fontSize: 32,
                                fontWeight: "bold",
                                color: colors.text,
                                textAlign: "center",
                                marginBottom: 8,
                            }}
                        >
                            Welcome Back
                        </Text>
                        <Text
                            style={{
                                fontSize: 16,
                                color: colors.textSecondary,
                                textAlign: "center",
                            }}
                        >
                            Sign in to continue your culinary journey
                        </Text>
                    </View>

                    {/* Email Input */}
                    <View style={{ marginBottom: 16 }}>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: colors.text,
                                marginBottom: 8,
                            }}
                        >
                            Email Address
                        </Text>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: colors.card,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                                paddingHorizontal: 16,
                                paddingVertical: 4,
                            }}
                        >
                            <MaterialIcons
                                name="email"
                                size={20}
                                color={colors.textSecondary}
                            />
                            <TextInput
                                placeholder="Enter your email"
                                placeholderTextColor={colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                style={{
                                    flex: 1,
                                    paddingHorizontal: 12,
                                    paddingVertical: 16,
                                    fontSize: 16,
                                    color: colors.text,
                                }}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={{ marginBottom: 32 }}>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: colors.text,
                                marginBottom: 8,
                            }}
                        >
                            Password
                        </Text>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: colors.card,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                                paddingHorizontal: 16,
                                paddingVertical: 4,
                            }}
                        >
                            <MaterialIcons
                                name="lock"
                                size={20}
                                color={colors.textSecondary}
                            />
                            <TextInput
                                placeholder="Enter your password"
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                style={{
                                    flex: 1,
                                    paddingHorizontal: 12,
                                    paddingVertical: 16,
                                    fontSize: 16,
                                    color: colors.text,
                                }}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={{ padding: 4 }}
                            >
                                <MaterialIcons
                                    name={showPassword ? "visibility" : "visibility-off"}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={isLoading}
                        style={{
                            backgroundColor: colors.primary,
                            paddingVertical: 16,
                            borderRadius: 12,
                            marginBottom: 16,
                            shadowColor: colors.primary,
                            shadowOpacity: 0.3,
                            shadowOffset: { width: 0, height: 4 },
                            shadowRadius: 8,
                            elevation: 4,
                            opacity: isLoading ? 0.7 : 1,
                        }}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: "600",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                Sign In
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginVertical: 24,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                height: 1,
                                backgroundColor: colors.border,
                            }}
                        />
                        <Text
                            style={{
                                paddingHorizontal: 16,
                                color: colors.textSecondary,
                                fontSize: 14,
                            }}
                        >
                            New to CookNest?
                        </Text>
                        <View
                            style={{
                                flex: 1,
                                height: 1,
                                backgroundColor: colors.border,
                            }}
                        />
                    </View>

                    {/* Register Button */}
                    <TouchableOpacity
                        onPress={() => router.push("/register")}
                        style={{
                            borderWidth: 2,
                            borderColor: colors.primary,
                            paddingVertical: 16,
                            borderRadius: 12,
                            backgroundColor: "transparent",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "600",
                                color: colors.primary,
                                textAlign: "center",
                            }}
                        >
                            Create Account
                        </Text>
                    </TouchableOpacity>

                    {/* Footer */}
                    <View
                        style={{
                            marginTop: 48,
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 12,
                                color: colors.textSecondary,
                                textAlign: "center",
                            }}
                        >
                            By continuing, you agree to our Terms of Service and Privacy
                            Policy
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default Login;

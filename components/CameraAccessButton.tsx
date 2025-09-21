import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";

interface CameraAccessButtonProps {
    title?: string;
    subtitle?: string;
    onCameraAccess?: (imageUri: string) => void;
}

export default function CameraAccessButton({
                                               title = "Access Camera",
                                               subtitle = "Take photos or scan QR codes",
                                               onCameraAccess,
                                           }: CameraAccessButtonProps) {
    const { colors } = useTheme();
    const router = useRouter();

    const handlePress = () => {
        router.push("/camera" as any);
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                marginVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
            }}
        >
            <View
                style={{
                    backgroundColor: colors.primary + "20",
                    borderRadius: 8,
                    padding: 8,
                    marginRight: 12,
                }}
            >
                <MaterialIcons name="camera-alt" size={24} color={colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        color: colors.text,
                        fontWeight: "600",
                        fontSize: 16,
                    }}
                >
                    {title}
                </Text>
                <Text
                    style={{
                        color: colors.textSecondary,
                        fontSize: 14,
                        marginTop: 2,
                    }}
                >
                    {subtitle}
                </Text>
            </View>

            <MaterialIcons
                name="chevron-right"
                size={20}
                color={colors.textSecondary}
            />
        </TouchableOpacity>
    );
}

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import IntegratedCamera from "./IntegratedCamera";

interface QuickCameraActionProps {
    onImageCaptured?: (imageUri: string) => void;
    onQRScanned?: (data: string) => void;
}

export default function QuickCameraAction({
                                              onImageCaptured,
                                              onQRScanned,
                                          }: QuickCameraActionProps) {
    const [showCamera, setShowCamera] = useState(false);
    const [cameraMode, setCameraMode] = useState<"photo" | "qr" | "both">("both");
    const [isProcessing, setIsProcessing] = useState(false); // Add processing state
    const { colors } = useTheme();
    const router = useRouter();

    const handleCameraAction = () => {
        Alert.alert("Camera Options", "What would you like to do?", [
            {
                text: "Take Photo for Meal",
                onPress: () => {
                    setCameraMode("photo");
                    setShowCamera(true);
                },
            },
            {
                text: "Scan QR Code",
                onPress: () => {
                    setCameraMode("qr");
                    setShowCamera(true);
                },
            },
            {
                text: "Camera & Scanner",
                onPress: () => {
                    setCameraMode("both");
                    setShowCamera(true);
                },
            },
            {
                text: "Cancel",
                style: "cancel",
            },
        ]);
    };

    const handleImageCaptured = (imageUri: string) => {
        setShowCamera(false);
        if (onImageCaptured) {
            onImageCaptured(imageUri);
        } else {
            // Default behavior: navigate to meal creation with image
            router.push({
                pathname: "/(dashboard)/meals/new",
                params: { imageUri },
            } as any);
        }
    };

    const handleQRScanned = (data: string) => {
        // Prevent multiple processing of the same QR code
        if (isProcessing) {
            console.log("Already processing a QR code, ignoring");
            return;
        }

        setShowCamera(false);

        if (onQRScanned) {
            onQRScanned(data);
        } else {
            // Try to parse QR data as a recipe
            try {
                const parsedData = JSON.parse(data);

                // Check if this is a recipe QR code
                if (parsedData.type === "recipe" && parsedData.meal) {
                    setIsProcessing(true); // Set processing flag

                    console.log(
                        "Recipe QR code detected in QuickCameraAction:",
                        parsedData.meal.title
                    );

                    Alert.alert(
                        "Recipe Found!",
                        `Would you like to add "${parsedData.meal.title}" to your meals?`,
                        [
                            {
                                text: "Cancel",
                                style: "cancel",
                                onPress: () => setIsProcessing(false), // Reset processing flag on cancel
                            },
                            {
                                text: "Add Recipe",
                                onPress: () => {
                                    try {
                                        // Ensure clean data
                                        const cleanData = JSON.parse(
                                            JSON.stringify(parsedData.meal)
                                        );
                                        // Remove any circular references or complex objects
                                        if (
                                            cleanData.image &&
                                            typeof cleanData.image !== "string"
                                        ) {
                                            delete cleanData.image;
                                        }

                                        // Create a unique identifier for this scan
                                        const scanId = Date.now().toString();
                                        const encodedData = encodeURIComponent(
                                            JSON.stringify(cleanData)
                                        );

                                        console.log(
                                            "QuickCameraAction: Navigating to meal form with QR data"
                                        );

                                        // Use router.push instead of replace to ensure consistent behavior with RecipeQRScanner
                                        router.push({
                                            pathname: "/(dashboard)/meals/new",
                                            params: {
                                                scanId: scanId,
                                                prefilledData: encodedData,
                                                refresh: Date.now().toString(), // Add refresh parameter to force component reset
                                            },
                                        } as any);

                                        // Reset processing flag after successful navigation
                                        setTimeout(() => {
                                            setIsProcessing(false);
                                        }, 1000);
                                    } catch (error) {
                                        console.error(
                                            "QuickCameraAction: Error navigating with recipe data:",
                                            error
                                        );

                                        // Try one more approach as a fallback
                                        try {
                                            console.log("Attempting fallback navigation approach");
                                            const scanId = Date.now().toString();
                                            const cleanData = JSON.parse(
                                                JSON.stringify(parsedData.meal)
                                            );
                                            router.push("/(dashboard)/meals/new");

                                            // After a brief delay, try to navigate again with the data
                                            setTimeout(() => {
                                                router.push({
                                                    pathname: "/(dashboard)/meals/[id]",
                                                    params: {
                                                        id: "new",
                                                        scanId: scanId,
                                                        prefilledData: encodeURIComponent(
                                                            JSON.stringify(cleanData)
                                                        ),
                                                        refresh: Date.now().toString(),
                                                    },
                                                } as any);

                                                // Reset processing flag after fallback navigation
                                                setTimeout(() => {
                                                    setIsProcessing(false);
                                                }, 500);
                                            }, 500);
                                        } catch (fallbackError) {
                                            console.error(
                                                "Even fallback navigation failed:",
                                                fallbackError
                                            );

                                            // Reset processing flag on error
                                            setIsProcessing(false);

                                            Alert.alert(
                                                "Navigation Error",
                                                "Could not navigate to the meal form. Please try scanning again or go to the Meals screen first.",
                                                [
                                                    {
                                                        text: "Go to Meals",
                                                        onPress: () => router.push("/(dashboard)/meals"),
                                                    },
                                                    { text: "Cancel", style: "cancel" },
                                                ]
                                            );
                                        }
                                    }
                                },
                            },
                        ]
                    );
                    return;
                }
            } catch (error) {
                console.log("Not a valid JSON QR code:", error);
                // Reset processing flag if not a recipe QR code
                setIsProcessing(false);
            }

            // Default behavior for non-recipe QR codes
            Alert.alert("QR Code Scanned", data);
        }
    };

    return (
        <View>
            <TouchableOpacity
                onPress={handleCameraAction}
                style={{
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    padding: 16,
                    marginVertical: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                }}
            >
                <View
                    style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: 8,
                        padding: 8,
                        marginRight: 12,
                    }}
                >
                    <MaterialIcons name="camera-alt" size={24} color="white" />
                </View>

                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            color: "white",
                            fontWeight: "600",
                            fontSize: 16,
                        }}
                    >
                        Quick Camera
                    </Text>
                    <Text
                        style={{
                            color: "rgba(255,255,255,0.8)",
                            fontSize: 14,
                            marginTop: 2,
                        }}
                    >
                        Take photos or scan QR codes
                    </Text>
                </View>

                <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color="rgba(255,255,255,0.8)"
                />
            </TouchableOpacity>

            <IntegratedCamera
                visible={showCamera}
                onClose={() => setShowCamera(false)}
                onImageCaptured={handleImageCaptured}
                onImageSelected={handleImageCaptured}
                onQRScanned={handleQRScanned}
                mode={cameraMode}
                title={
                    cameraMode === "photo"
                        ? "Capture Meal Photo"
                        : cameraMode === "qr"
                            ? "Scan QR Code"
                            : "Camera & Scanner"
                }
            />
        </View>
    );
}

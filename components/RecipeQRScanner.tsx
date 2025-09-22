import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "expo-router";
import IntegratedCamera from "./IntegratedCamera";

interface RecipeQRScannerProps {
    onRecipeScanned?: (recipeData: any) => void;
}

export default function RecipeQRScanner({
                                            onRecipeScanned,
                                        }: RecipeQRScannerProps) {
    const [showScanner, setShowScanner] = useState(false);
    const { colors } = useTheme();
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false); // Add a flag to prevent multiple navigation attempts

    const handleQRScanned = (data: string) => {
        // Prevent multiple scan handling
        if (isNavigating) {
            console.log("Already navigating, ignoring new QR scan");
            return;
        }

        setShowScanner(false);

        try {
            // Try to parse as JSON for recipe data
            let recipeData;
            try {
                recipeData = JSON.parse(data);
            } catch (parseError) {
                console.log("Failed to parse QR data as JSON:", parseError);
                // Not valid JSON, handle as plain text/URL
                handleNonRecipeQR(data);
                return;
            }

            if (recipeData.type === "recipe" && recipeData.meal) {
                // Handle recipe QR code
                console.log("Recipe QR code detected:", recipeData.meal.title);

                // Set navigating flag to prevent multiple navigations
                setIsNavigating(true);

                Alert.alert(
                    "Recipe Found!",
                    `Would you like to add "${recipeData.meal.title}" to your meals?`,
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => setIsNavigating(false),
                        },
                        {
                            text: "Add Recipe",
                            onPress: () => {
                                if (onRecipeScanned) {
                                    // Pass the already parsed data
                                    onRecipeScanned(recipeData.meal);
                                    setIsNavigating(false);
                                } else {
                                    // Try different navigation approaches to resolve the issue
                                    try {
                                        // First, ensure clean data
                                        const cleanData = JSON.parse(
                                            JSON.stringify(recipeData.meal)
                                        );
                                        // Remove any circular references or complex objects
                                        if (
                                            cleanData.image &&
                                            typeof cleanData.image !== "string"
                                        ) {
                                            delete cleanData.image;
                                        }

                                        // Create a unique identifier for this scan to prevent loops
                                        const scanId = Date.now().toString();
                                        const encodedData = encodeURIComponent(
                                            JSON.stringify(cleanData)
                                        );

                                        // Use consistent navigation pattern with push and params object
                                        console.log(
                                            "RecipeQRScanner: Navigating to meal form with QR data"
                                        );

                                        // Use router.push with params object - same pattern as in QuickCameraAction
                                        router.push({
                                            pathname: "/(dashboard)/meals/new",
                                            params: {
                                                scanId: scanId,
                                                prefilledData: encodedData,
                                                refresh: Date.now().toString(), // Add refresh parameter to force component reset
                                            },
                                        } as any);

                                        // Reset the navigation flag after a delay
                                        setTimeout(() => {
                                            setIsNavigating(false);
                                        }, 500);
                                    } catch (error) {
                                        console.error("Error navigating with recipe data:", error);
                                        setIsNavigating(false);

                                        // Try one more approach as a fallback
                                        try {
                                            console.log(
                                                "RecipeQRScanner: Attempting fallback navigation"
                                            );

                                            // Simple navigation to meals first, then attempt to navigate to the form
                                            router.push("/(dashboard)/meals");

                                            // After a brief delay, navigate to the form with the data
                                            setTimeout(() => {
                                                try {
                                                    const scanId = Date.now().toString();
                                                    const cleanData = JSON.parse(
                                                        JSON.stringify(recipeData.meal)
                                                    );

                                                    router.push({
                                                        pathname: "/(dashboard)/meals/new",
                                                        params: {
                                                            scanId: scanId,
                                                            prefilledData: encodeURIComponent(
                                                                JSON.stringify(cleanData)
                                                            ),
                                                            refresh: Date.now().toString(),
                                                        },
                                                    } as any);
                                                } catch (e) {
                                                    console.error(
                                                        "RecipeQRScanner: Even delayed navigation failed:",
                                                        e
                                                    );
                                                }
                                            }, 500);
                                        } catch (fallbackError) {
                                            console.error(
                                                "RecipeQRScanner: All navigation attempts failed:",
                                                fallbackError
                                            );

                                            // Show a more detailed error message
                                            Alert.alert(
                                                "Navigation Error",
                                                "Could not navigate to the meal form. Please try going to the Meals screen first.",
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
                                }
                            },
                        },
                    ]
                );
            } else {
                // Not a recipe QR code, handle as regular QR
                handleNonRecipeQR(data);
            }
        } catch (error) {
            console.error("Error in QR handling:", error);
            setIsNavigating(false);
            handleNonRecipeQR(data);
        }
    };

    const handleNonRecipeQR = (data: string) => {
        if (data.startsWith("http://") || data.startsWith("https://")) {
            Alert.alert("Website Link", `Open this link? ${data}`, [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Open",
                    onPress: () => {
                        // Handle URL opening
                        console.log("Opening URL:", data);
                    },
                },
            ]);
        } else {
            Alert.alert("QR Code", `Scanned: ${data}`);
        }
    };

    return (
        <View>
            <TouchableOpacity
                onPress={() => {
                    if (!isNavigating) {
                        setShowScanner(true);
                    }
                }}
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
                    <MaterialIcons
                        name="qr-code-scanner"
                        size={24}
                        color={colors.primary}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            color: colors.text,
                            fontWeight: "600",
                            fontSize: 16,
                        }}
                    >
                        Scan Recipe QR
                    </Text>
                    <Text
                        style={{
                            color: colors.textSecondary,
                            fontSize: 14,
                            marginTop: 2,
                        }}
                    >
                        Import recipes from QR codes
                    </Text>
                </View>

                <MaterialIcons name="qr-code" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <IntegratedCamera
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onQRScanned={handleQRScanned}
                mode="qr"
                title="Scan Recipe QR Code"
            />
        </View>
    );
}

import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    Modal,
    Dimensions,
    StatusBar,
    Linking,
} from "react-native";
import {
    CameraView,
    CameraType,
    useCameraPermissions,
    BarcodeScanningResult,
} from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

interface IntegratedCameraProps {
    visible: boolean;
    onClose: () => void;
    onImageCaptured?: (imageUri: string) => void;
    onImageSelected?: (imageUri: string) => void;
    onQRScanned?: (data: string) => void;
    mode?: "photo" | "qr" | "both";
    title?: string;
}

export default function IntegratedCamera({
                                             visible,
                                             onClose,
                                             onImageCaptured,
                                             onImageSelected,
                                             onQRScanned,
                                             mode = "both",
                                             title = "Camera",
                                         }: IntegratedCameraProps) {
    const [facing, setFacing] = useState<CameraType>("back");
    const [permission, requestPermission] = useCameraPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] =
        MediaLibrary.usePermissions();
    const [isScanning, setIsScanning] = useState(mode === "qr");
    const [scannedData, setScannedData] = useState<string>("");
    const cameraRef = useRef<CameraView>(null);
    const { colors } = useTheme();

    useEffect(() => {
        if (visible) {
            requestPermissions();
            // Reset scanner mode based on props
            setIsScanning(mode === "qr");
        }
    }, [visible, mode]);

    const requestPermissions = async () => {
        if (!permission?.granted) {
            await requestPermission();
        }
        if (!mediaLibraryPermission?.granted) {
            await requestMediaLibraryPermission();
        }
    };

    const toggleCameraFacing = () => {
        setFacing((current) => (current === "back" ? "front" : "back"));
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                    skipProcessing: false,
                });

                if (photo) {
                    // Save to gallery if permission granted
                    if (mediaLibraryPermission?.granted) {
                        await MediaLibrary.saveToLibraryAsync(photo.uri);
                    }

                    // Callback with captured image
                    if (onImageCaptured) {
                        onImageCaptured(photo.uri);
                    }

                    // Close the camera
                    onClose();

                    Alert.alert("Success", "Photo captured and saved!");
                }
            } catch (error) {
                console.error("Error taking picture:", error);
                Alert.alert("Error", "Failed to take picture");
            }
        }
    };

    const openGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                if (onImageSelected) {
                    onImageSelected(result.assets[0].uri);
                }
                onClose();
            }
        } catch (error) {
            console.error("Error opening gallery:", error);
            Alert.alert("Error", "Failed to open gallery");
        }
    };

    const toggleScanning = () => {
        if (mode === "both") {
            setIsScanning(!isScanning);
            setScannedData("");
        }
    };

    const handleBarcodeScanned = ({ type, data }: BarcodeScanningResult) => {
        // Check if we've already scanned this barcode in this session
        if (data === scannedData) {
            console.log("Duplicate QR scan, ignoring");
            return;
        }

        setScannedData(data);

        if (onQRScanned) {
            // Always close camera first to prevent visual issues
            onClose();

            // Then trigger the callback - with a slight delay to ensure UI is ready
            setTimeout(() => {
                onQRScanned(data);
            }, 300);
        } else {
            // Default behavior - try to handle recipe QR codes or URLs
            try {
                // Check if it's a recipe QR code by trying to parse JSON
                const parsedData = JSON.parse(data);
                if (parsedData.type === "recipe" && parsedData.meal) {
                    // It's a recipe QR code - handle accordingly
                    onClose();
                    Alert.alert(
                        "Recipe QR Detected",
                        `Recipe "${parsedData.meal.title || parsedData.meal.name}" detected. Would you like to view it?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "View Recipe",
                                onPress: () => {
                                    // Implementation would depend on your app's navigation structure
                                    console.log("Recipe QR detected in default handler");
                                },
                            },
                        ]
                    );
                    return;
                }
            } catch (e) {
                // Not a JSON or recipe QR code, continue with URL handling
                console.log("Not a recipe QR code, checking if URL");
            }

            // URL handling
            onClose();
            Alert.alert("QR Code Scanned", `Type: ${type}\nData: ${data}`, [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Open Link",
                    onPress: () => {
                        if (data.startsWith("http://") || data.startsWith("https://")) {
                            Linking.openURL(data);
                        } else {
                            Alert.alert(
                                "Invalid URL",
                                "The scanned data is not a valid web URL"
                            );
                        }
                    },
                },
            ]);
        }
    };

    if (!permission) {
        return (
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <View
                    style={[styles.container, { backgroundColor: colors.background }]}
                >
                    <Text style={[styles.message, { color: colors.text }]}>
                        Loading camera...
                    </Text>
                </View>
            </Modal>
        );
    }

    if (!permission.granted) {
        return (
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <View
                    style={[styles.container, { backgroundColor: colors.background }]}
                >
                    <Text style={[styles.message, { color: colors.text }]}>
                        We need your permission to show the camera
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.permissionButton,
                            { backgroundColor: colors.primary },
                        ]}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: colors.border }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
        >
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="black" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                        <MaterialIcons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isScanning ? "QR Code Scanner" : title}
                    </Text>
                    {mode === "both" && (
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={toggleScanning}
                        >
                            <MaterialIcons
                                name={isScanning ? "camera-alt" : "qr-code-scanner"}
                                size={24}
                                color="white"
                            />
                        </TouchableOpacity>
                    )}
                    {mode !== "both" && <View style={styles.headerButton} />}
                </View>

                {/* Camera View */}
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                    barcodeScannerSettings={{
                        barcodeTypes: isScanning ? ["qr"] : [],
                    }}
                    onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
                >
                    {/* QR Scanning Overlay */}
                    {isScanning && (
                        <View style={styles.scanningOverlay}>
                            {/* Top Dark Area */}
                            <View style={styles.overlayTop} />

                            {/* Middle Row with scanning frame */}
                            <View style={styles.overlayMiddle}>
                                <View style={styles.overlaySide} />
                                <View style={styles.scanningFrame}>
                                    <View style={[styles.corner, styles.topLeft]} />
                                    <View style={[styles.corner, styles.topRight]} />
                                    <View style={[styles.corner, styles.bottomLeft]} />
                                    <View style={[styles.corner, styles.bottomRight]} />

                                    {/* Scanning line animation placeholder */}
                                    <View style={styles.scanningLine} />
                                </View>
                                <View style={styles.overlaySide} />
                            </View>

                            {/* Bottom Dark Area with text */}
                            <View style={styles.overlayBottom}>
                                <Text style={styles.scanningText}>
                                    Position QR code within the frame
                                </Text>
                                {scannedData ? (
                                    <Text style={styles.scannedDataText}>
                                        Scanned: {scannedData}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    )}

                    {/* Camera Controls */}
                    <View style={styles.controlsContainer}>
                        {/* Top Controls */}
                        <View style={styles.topControls}>
                            <TouchableOpacity
                                style={styles.controlButton}
                                onPress={toggleCameraFacing}
                            >
                                <MaterialIcons name="flip-camera-ios" size={32} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Controls */}
                        <View style={styles.bottomControls}>
                            <TouchableOpacity
                                style={styles.galleryButton}
                                onPress={openGallery}
                            >
                                <MaterialIcons name="photo-library" size={28} color="white" />
                            </TouchableOpacity>

                            {!isScanning && (
                                <TouchableOpacity
                                    style={styles.captureButton}
                                    onPress={takePicture}
                                >
                                    <View style={styles.captureButtonInner} />
                                </TouchableOpacity>
                            )}

                            {mode === "both" && (
                                <TouchableOpacity
                                    style={styles.modeButton}
                                    onPress={toggleScanning}
                                >
                                    <MaterialIcons
                                        name={isScanning ? "camera-alt" : "qr-code-scanner"}
                                        size={28}
                                        color="white"
                                    />
                                </TouchableOpacity>
                            )}
                            {mode !== "both" && <View style={styles.modeButton} />}
                        </View>
                    </View>
                </CameraView>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>
                        {isScanning
                            ? "Point camera at QR code to scan"
                            : "Tap to capture • Tap gallery for existing photos • Use flip to switch camera"}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    message: {
        textAlign: "center" as const,
        paddingBottom: 10,
        fontSize: 16,
    },
    permissionButton: {
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 20,
        marginVertical: 10,
    },
    permissionButtonText: {
        color: "white",
        textAlign: "center" as const,
        fontWeight: "600" as const,
    },
    cancelButton: {
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 20,
        borderWidth: 1,
    },
    cancelButtonText: {
        textAlign: "center" as const,
        fontWeight: "600" as const,
    },
    header: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: "rgba(0,0,0,0.7)",
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerButton: {
        padding: 8,
        width: 40,
        height: 40,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    headerTitle: {
        color: "white",
        fontSize: 18,
        fontWeight: "600" as const,
    },
    camera: {
        flex: 1,
    },
    controlsContainer: {
        flex: 1,
        flexDirection: "column" as const,
        justifyContent: "space-between" as const,
        paddingTop: 100,
        paddingBottom: 80,
    },
    topControls: {
        alignItems: "flex-end" as const,
        paddingRight: 20,
    },
    bottomControls: {
        flexDirection: "row" as const,
        justifyContent: "space-around" as const,
        alignItems: "center" as const,
        paddingHorizontal: 40,
    },
    controlButton: {
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 30,
        padding: 12,
    },
    galleryButton: {
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 25,
        padding: 12,
        width: 50,
        height: 50,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "white",
        justifyContent: "center" as const,
        alignItems: "center" as const,
        borderWidth: 4,
        borderColor: "rgba(255,255,255,0.5)",
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "white",
    },
    modeButton: {
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 25,
        padding: 12,
        width: 50,
        height: 50,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    instructionsContainer: {
        position: "absolute" as const,
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.7)",
        borderRadius: 8,
        padding: 12,
    },
    instructionsText: {
        color: "white",
        textAlign: "center" as const,
        fontSize: 14,
    },
    // QR Code Scanning Styles
    scanningOverlay: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        backgroundColor: "rgba(0,0,0,0.5)",
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scanningFrame: {
        width: Math.min(width * 0.7, 280),
        height: Math.min(width * 0.7, 280),
        position: "relative" as const,
        alignSelf: "center" as const,
    },
    corner: {
        position: "absolute" as const,
        width: 30,
        height: 30,
        borderColor: "white",
        borderWidth: 3,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    scanningText: {
        color: "white",
        fontSize: 16,
        textAlign: "center" as const,
        marginTop: 20,
    },
    scannedDataText: {
        color: "yellow",
        fontSize: 14,
        textAlign: "center" as const,
        marginTop: 10,
        paddingHorizontal: 20,
    },
    // Enhanced QR Scanning Overlay
    overlayTop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
    },
    overlayMiddle: {
        flexDirection: "row" as const,
        height: Math.min(width * 0.7, 280),
    },
    overlaySide: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "flex-start" as const,
        alignItems: "center" as const,
        paddingTop: 20,
    },
    scanningLine: {
        position: "absolute" as const,
        top: Math.min(width * 0.7, 280) / 2,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: "#00ff00",
        opacity: 0.8,
    },
};

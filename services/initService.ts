import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, PermissionsAndroid } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

// Initialize all services needed by the app
export const initializeServices = async () => {
    console.log("Initializing services...");

    try {
        // Test AsyncStorage
        await testAsyncStorage();

        // Initialize notifications
        await initializeNotifications();

        // Initialize media permissions
        await initializeMediaPermissions();

        console.log("All services initialized successfully");
        return true;
    } catch (error) {
        console.error("Error initializing services:", error);
        return false;
    }
};

// Test if AsyncStorage is working
const testAsyncStorage = async () => {
    try {
        const testKey = "TEST_ASYNC_STORAGE";
        const testValue = "working";

        // Try writing to AsyncStorage
        await AsyncStorage.setItem(testKey, testValue);

        // Try reading from AsyncStorage
        const readValue = await AsyncStorage.getItem(testKey);

        if (readValue !== testValue) {
            throw new Error("AsyncStorage test failed: value mismatch");
        }

        // Clean up
        await AsyncStorage.removeItem(testKey);
        console.log("AsyncStorage is working properly");
        return true;
    } catch (error) {
        console.error("AsyncStorage test failed:", error);
        throw new Error("AsyncStorage initialization failed");
    }
};

// Initialize notifications
const initializeNotifications = async () => {
    try {
        // Check if device supports notifications
        if (!Device.isDevice) {
            console.log("Notifications only work on physical devices");
            return false;
        }

        // Request permissions
        const { status: existingStatus } =
            await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            console.log("Notification permissions not granted");
            return false;
        }

        // Configure notification channel for Android
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("meal-reminders", {
                name: "Meal Reminders",
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
                sound: "default",
                description: "Notifications for scheduled meal reminders",
            });
        }

        console.log("Notifications initialized successfully");
        return true;
    } catch (error) {
        console.error("Error initializing notifications:", error);
        return false;
    }
};

// Initialize media permissions
const initializeMediaPermissions = async () => {
    try {
        // Camera permissions
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        console.log("Camera permission status:", cameraPermission.status);

        // Media library permissions
        const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
        console.log(
            "Media library permission status:",
            mediaLibraryPermission.status
        );

        // Additional Android permissions
        if (Platform.OS === "android") {
            const androidPermissions = [
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.CAMERA,
            ];

            for (const permission of androidPermissions) {
                try {
                    const granted = await PermissionsAndroid.request(permission);
                    console.log(`Android permission ${permission}:`, granted);
                } catch (err) {
                    console.warn(
                        `Error requesting Android permission ${permission}:`,
                        err
                    );
                }
            }
        }

        console.log("Media permissions initialized");
        return true;
    } catch (error) {
        console.error("Error initializing media permissions:", error);
        return false;
    }
};

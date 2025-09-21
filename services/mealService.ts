import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";

import { Meal } from "@/types/meal";
import NotificationService from "./notificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const mealColRef = collection(db, "meals");

export const createMeal = async (meal: Meal) => {
  try {
    // Handle image upload
    let imageUrl = meal.image;
    if (imageUrl && imageUrl.startsWith("file://")) {
      const uploadedUrl = await uploadImageToCloudinary(imageUrl);
      // If upload fails, keep the original file:// URL as a fallback
      imageUrl = uploadedUrl || imageUrl;
    }

    // Ensure favorite field is set to false by default
    const mealData = {
      ...meal,
      image: imageUrl,
      favorite: meal.favorite || false,
      createdAt: new Date().toISOString(),
    };

    // Add to Firestore
    const docRef = await addDoc(mealColRef, mealData);
    const mealId = docRef.id;

    // Schedule notification if meal is planned and notifications are enabled
    if (meal.isPlanned && meal.plannedDate) {
      try {
        await scheduleNotificationForMeal({
          id: mealId,
          ...mealData,
        } as Meal & { id: string });
      } catch (notifError) {
        console.error("Error scheduling notification:", notifError);
        // Continue even if notification scheduling fails
      }
    }

    return mealId;
  } catch (error) {
    console.error("Error creating meal:", error);
    throw error; // Re-throw to allow caller to handle
  }
};

export const uploadImageToCloudinary = async (imageUri: string) => {
  try {
    // Validate the image URI
    if (!imageUri || typeof imageUri !== "string") {
      console.error("Invalid image URI:", imageUri);
      return null;
    }

    // Create form data for upload
    const data = new FormData();
    data.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);
    data.append("upload_preset", "my_preset"); // Replace with your preset

    // Set timeout for the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Attempt the upload
      const res = await fetch(
          "https://api.cloudinary.com/v1_1/dfwzzxgja/image/upload",
          {
            method: "POST",
            body: data,
            signal: controller.signal,
          }
      );

      // Clear the timeout
      clearTimeout(timeoutId);

      // Check if the response is OK
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Cloudinary upload failed:", errorText);
        return null;
      }

      // Parse the response
      const result = await res.json();

      // Validate the result
      if (!result || !result.secure_url) {
        console.error("Invalid response from Cloudinary:", result);
        return null;
      }

      return result.secure_url;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        console.error("Image upload timed out");
      } else {
        console.error("Error uploading to Cloudinary:", fetchError);
      }
      return null;
    }
  } catch (error) {
    console.error("Error in uploadImageToCloudinary:", error);
    return null;
  }
};

export const getMeals = async (userId: string) => {
  const q = query(mealColRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Meal) }));
};

export const getMealById = async (id: string) => {
  const docRef = doc(db, "meals", id);
  const mealSnap = await getDoc(docRef);
  if (mealSnap.exists()) {
    return { id: mealSnap.id, ...mealSnap.data() };
  }
  return null;
};

export const updateMeal = async (id: string, meal: Partial<Meal>) => {
  const docRef = doc(db, "meals", id);
  await updateDoc(docRef, meal);

  // Handle notification updates
  if (meal.isPlanned !== undefined || meal.plannedDate || meal.mealType) {
    // Get the full meal data
    const fullMeal = (await getMealById(id)) as (Meal & { id: string }) | null;
    if (fullMeal) {
      if (fullMeal.isPlanned && fullMeal.plannedDate) {
        // Update notification
        await NotificationService.updateMealNotification({
          id: fullMeal.id,
          title: fullMeal.title || "",
          name: fullMeal.name || "",
          mealType: fullMeal.mealType || "lunch",
          plannedDate: fullMeal.plannedDate,
        });
      } else {
        // Cancel notification if meal is no longer planned
        await cancelNotificationForMeal(id);
      }
    }
  }
};

export const deleteMeal = async (id: string) => {
  // Cancel any scheduled notifications for this meal
  await cancelNotificationForMeal(id);

  const docRef = doc(db, "meals", id);
  await deleteDoc(docRef);
};

export const fetchMockRecipes = async () => {
  const res = await fetch(
      "https://www.themealdb.com/api/json/v1/1/search.php?f=a"
  );
  const data = await res.json();
  return data.meals;
};

// Get planned meals for a specific date range
export const getPlannedMeals = async (
    userId: string,
    startDate?: string,
    endDate?: string
) => {
  const q = query(
      mealColRef,
      where("userId", "==", userId),
      where("isPlanned", "==", true)
  );
  const snapshot = await getDocs(q);
  let meals = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Meal),
  }));

  // Filter by date range if provided
  if (startDate && endDate) {
    meals = meals.filter((meal) => {
      if (!meal.plannedDate) return false;
      const mealDate = meal.plannedDate.split("T")[0];
      return mealDate >= startDate && mealDate <= endDate;
    });
  }

  return meals;
};

// Get meals by meal type for a specific date
export const getMealsByTypeAndDate = async (
    userId: string,
    mealType: string,
    date: string
) => {
  const q = query(
      mealColRef,
      where("userId", "==", userId),
      where("mealType", "==", mealType),
      where("plannedDate", ">=", date + "T00:00:00.000Z"),
      where("plannedDate", "<=", date + "T23:59:59.999Z")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Meal) }));
};

// Toggle favorite status of a meal
export const toggleMealFavorite = async (mealId: string) => {
  console.log("Toggling favorite for meal ID:", mealId);
  const mealDocRef = doc(db, "meals", mealId);
  const mealDoc = await getDoc(mealDocRef);

  if (mealDoc.exists()) {
    const mealData = mealDoc.data();
    const currentFavorite = mealData.favorite || false;
    const newFavoriteStatus = !currentFavorite;

    console.log("Current favorite status:", currentFavorite);
    console.log("Setting favorite to:", newFavoriteStatus);

    await updateDoc(mealDocRef, { favorite: newFavoriteStatus });

    console.log("Successfully updated favorite status");
    return newFavoriteStatus;
  } else {
    console.log("Meal document not found for ID:", mealId);
  }
  return false;
};

// Get favorite meals for a user
export const getFavoriteMeals = async (userId: string) => {
  const q = query(
      mealColRef,
      where("userId", "==", userId),
      where("favorite", "==", true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Meal) }));
};

// Migration function to ensure all meals have a favorite field
export const ensureFavoriteField = async (userId: string) => {
  console.log("Checking and updating meals without favorite field...");
  const q = query(mealColRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);

  const updatePromises = snapshot.docs.map(async (docRef) => {
    const data = docRef.data();
    if (data.favorite === undefined) {
      console.log("Updating meal without favorite field:", docRef.id);
      await updateDoc(doc(db, "meals", docRef.id), { favorite: false });
    }
  });

  await Promise.all(updatePromises);
  console.log("Finished updating meals with favorite field");
};

// Notification-related functions
export const scheduleNotificationForMeal = async (
    meal: Meal & { id: string }
) => {
  try {
    // Check if notifications are enabled
    const settings = await getNotificationSettings();
    if (!settings.enabled) return;

    // Check if this meal type has notifications enabled
    const mealTypeSettings = settings[meal.mealType as keyof typeof settings];
    if (
        !mealTypeSettings ||
        typeof mealTypeSettings !== "object" ||
        !mealTypeSettings.enabled
    ) {
      return;
    }

    await NotificationService.scheduleMealNotification({
      id: meal.id,
      title: meal.title || "",
      name: meal.name || "",
      mealType: meal.mealType || "lunch",
      plannedDate: meal.plannedDate || "",
      reminderTime: mealTypeSettings.time,
    });
  } catch (error) {
    console.error("Error scheduling notification for meal:", error);
  }
};

export const cancelNotificationForMeal = async (mealId: string) => {
  try {
    await NotificationService.cancelMealNotification(mealId);
  } catch (error) {
    console.error("Error cancelling notification for meal:", error);
  }
};

const getNotificationSettings = async () => {
  try {
    const stored = await AsyncStorage.getItem("notification_settings");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error getting notification settings:", error);
  }

  // Return default settings
  return {
    enabled: true,
    breakfast: { enabled: true, time: "08:00" },
    lunch: { enabled: true, time: "12:00" },
    dinner: { enabled: true, time: "18:00" },
    snack: { enabled: false, time: "15:00" },
  };
};

// Schedule notifications for all planned meals
export const scheduleNotificationsForPlannedMeals = async (userId: string) => {
  try {
    const plannedMeals = await getPlannedMeals(userId);
    for (const meal of plannedMeals) {
      await scheduleNotificationForMeal(meal as Meal & { id: string });
    }
  } catch (error) {
    console.error("Error scheduling notifications for planned meals:", error);
  }
};

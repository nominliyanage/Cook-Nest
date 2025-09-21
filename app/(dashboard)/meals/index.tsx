import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import MealCard from "@/components/MealCard";
import RecipeQRScanner from "@/components/RecipeQRScanner";
import React, { useEffect, useState } from "react";
import {
  getMeals,
  deleteMeal,
  toggleMealFavorite,
} from "@/services/mealService";
import { mealColRef } from "@/services/mealService";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Meal } from "@/types/meal";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import { onSnapshot, query, where } from "firebase/firestore";

const MealsScreen = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const { hideLoader, showLoader } = useLoader();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Query meals for the current user only
    const userMealsQuery = query(mealColRef, where("userId", "==", user.uid));

    const unsubcribe = onSnapshot(
        userMealsQuery,
        (snapshot: { docs: any[] }) => {
          const mealList = snapshot.docs.map((mealRef) => ({
            id: mealRef.id,
            ...mealRef.data(),
          })) as Meal[];
          setMeals(mealList);
        },
        (err) => {
          console.error(err);
        }
    );
    return () => unsubcribe();
  }, [user]);

  const handleFavoriteToggle = async (meal: Meal) => {
    if (!user) return;

    try {
      showLoader();
      await toggleMealFavorite(meal.id!);
      // The onSnapshot listener will automatically update the UI
    } catch (error) {
      Alert.alert("Error", "Failed to update favorite");
      console.error(error);
    } finally {
      hideLoader();
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this meal?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              showLoader();
              try {
                await deleteMeal(id);
                // The onSnapshot listener will automatically update the UI
              } catch (error) {
                Alert.alert("Error", "Failed to delete meal");
                console.error(error);
              } finally {
                hideLoader();
              }
            },
          },
        ]
    );
  };

  return (
      <View className="flex-1 w-full justify-center align-items-center">
        <Text className="text-center text-4xl">Meals screen</Text>
        <View className="absolute bottom-5 right-24 z-40">
          <Pressable
              className="bg-blue-500 rounded-full p-5 shadow-lg"
              onPress={() => {
                router.push("/(dashboard)/meals/new");
              }}
          >
            <MaterialIcons name="add" size={28} color={"#fff"} />
          </Pressable>
        </View>

        <View className="absolute bottom-5 right-5 z-40">
          <Pressable
              className="bg-green-500 rounded-full p-5 shadow-lg"
              onPress={() => {
                router.push({
                  pathname: "/(dashboard)/qr-generator",
                } as any);
              }}
          >
            <MaterialIcons name="qr-code" size={28} color={"#fff"} />
          </Pressable>
        </View>

        <ScrollView className="mt-4">
          {/* Recipe QR Scanner */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <RecipeQRScanner
                onRecipeScanned={(recipeData) => {
                  // Use a more reliable navigation approach
                  console.log("Recipe scanned from index, navigating...");
                  try {
                    // Generate a unique identifier to prevent loops
                    const scanId = Date.now().toString();
                    const encodedData = encodeURIComponent(
                        JSON.stringify(recipeData)
                    );

                    // Navigate directly with all parameters in a single call
                    router.replace(
                        `/(dashboard)/meals/new?scanId=${scanId}&prefilledData=${encodedData}`
                    );
                  } catch (error) {
                    console.error("Navigation error:", error);
                    Alert.alert(
                        "Navigation Issue",
                        "There was a problem navigating to the meal form."
                    );
                  }
                }}
            />
          </View>
          {meals.map((meal) => (
              <View
                  key={meal.id}
                  style={{ position: "relative", marginBottom: 16 }}
              >
                <MealCard
                    meal={meal}
                    onFavorite={() => handleFavoriteToggle(meal)}
                    onDelete={() => handleDelete(meal.id ?? "")}
                />
              </View>
          ))}
        </ScrollView>
      </View>
  );
};

export default MealsScreen;

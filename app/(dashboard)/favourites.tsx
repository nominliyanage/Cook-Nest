import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Alert,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import MealCard from "../../components/MealCard";
import {
    getMeals,
    toggleMealFavorite,
    deleteMeal,
    ensureFavoriteField,
    mealColRef,
} from "../../services/mealService";
import { Meal } from "../../types/meal";
import { onSnapshot, query, where } from "firebase/firestore";

export default function FavouritesScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [favoriteMeals, setFavoriteMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const handleFavoriteToggle = async (meal: Meal) => {
        if (!user) return;

        try {
            await toggleMealFavorite(meal.id!);
            // No need to manually refresh - real-time listener will update
        } catch (error) {
            Alert.alert("Error", "Failed to update favorite");
        }
    };

    const handleDeleteMeal = async (mealId: string) => {
        if (!user) return;

        try {
            await deleteMeal(mealId);
            // No need to manually refresh - real-time listener will update
        } catch (error) {
            Alert.alert("Error", "Failed to delete meal");
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // Ensure favorite field migration
        if (user) {
            try {
                await ensureFavoriteField(user.uid);
            } catch (error) {
                console.error("Migration error:", error);
            }
        }
        setRefreshing(false);
    };

    useEffect(() => {
        if (!user) return;

        let unsubscribe: (() => void) | null = null;

        const setupListener = async () => {
            try {
                setLoading(true);

                // Run migration first
                await ensureFavoriteField(user.uid);

                // Set up real-time listener for favorite meals only
                const favoriteMealsQuery = query(
                    mealColRef,
                    where("userId", "==", user.uid),
                    where("favorite", "==", true)
                );

                unsubscribe = onSnapshot(
                    favoriteMealsQuery,
                    (snapshot) => {
                        const favorites = snapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })) as Meal[];

                        console.log("Real-time favorites update:", favorites.length);
                        setFavoriteMeals(favorites);
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Favorites listener error:", error);
                        setLoading(false);
                    }
                );
            } catch (error) {
                console.error("Setup listener error:", error);
                setLoading(false);
            }
        };

        setupListener();

        // Cleanup listener on unmount
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user]);

    const EmptyState = () => (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 32,
                paddingTop: 100,
            }}
        >
            <MaterialIcons
                name="favorite-border"
                size={80}
                color={colors.textSecondary}
            />
            <Text
                style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: colors.text,
                    marginTop: 24,
                    marginBottom: 12,
                    textAlign: "center",
                }}
            >
                No Favorite Meals Yet
            </Text>
            <Text
                style={{
                    fontSize: 16,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 24,
                    marginBottom: 32,
                }}
            >
                Start adding meals to your favorites by tapping the heart icon on any
                meal card. Your favorite recipes will appear here for quick access.
            </Text>
            <TouchableOpacity
                onPress={() => router.push("/meals")}
                style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 24,
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <MaterialIcons name="restaurant" size={20} color="white" />
                <Text
                    style={{
                        color: "white",
                        fontWeight: "600",
                        marginLeft: 8,
                    }}
                >
                    Browse Meals
                </Text>
            </TouchableOpacity>
        </View>
    );

    const HeaderStats = () => (
        <View
            style={{
                backgroundColor: colors.card,
                marginHorizontal: 16,
                marginBottom: 16,
                borderRadius: 16,
                padding: 20,
                shadowColor: colors.text,
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
                elevation: 3,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <View>
                    <Text
                        style={{
                            fontSize: 28,
                            fontWeight: "bold",
                            color: colors.text,
                            marginBottom: 4,
                        }}
                    >
                        {favoriteMeals.length}
                    </Text>
                    <Text
                        style={{
                            fontSize: 16,
                            color: colors.textSecondary,
                        }}
                    >
                        Favorite {favoriteMeals.length === 1 ? "Meal" : "Meals"}
                    </Text>
                </View>

                <View
                    style={{
                        backgroundColor: colors.primary + "20",
                        padding: 16,
                        borderRadius: 20,
                    }}
                >
                    <MaterialIcons name="favorite" size={32} color={colors.primary} />
                </View>
            </View>

            {favoriteMeals.length > 0 && (
                <View
                    style={{
                        flexDirection: "row",
                        marginTop: 16,
                        paddingTop: 16,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                    }}
                >
                    <View style={{ flex: 1, alignItems: "center" }}>
                        <Text
                            style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}
                        >
                            {favoriteMeals.filter((m) => m.mealType === "breakfast").length}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            Breakfast
                        </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: "center" }}>
                        <Text
                            style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}
                        >
                            {favoriteMeals.filter((m) => m.mealType === "lunch").length}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            Lunch
                        </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: "center" }}>
                        <Text
                            style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}
                        >
                            {favoriteMeals.filter((m) => m.mealType === "dinner").length}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            Dinner
                        </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: "center" }}>
                        <Text
                            style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}
                        >
                            {favoriteMeals.filter((m) => m.mealType === "snack").length}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            Snacks
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <MaterialIcons name="favorite" size={48} color={colors.primary} />
                <Text style={{ color: colors.text, marginTop: 16 }}>
                    Loading favorites...
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View
                style={{
                    paddingHorizontal: 16,
                    paddingTop: 24,
                    paddingBottom: 16,
                }}
            >
                <Text
                    style={{
                        fontSize: 28,
                        fontWeight: "bold",
                        color: colors.text,
                        marginBottom: 8,
                    }}
                >
                    Favorite Meals
                </Text>
                <Text
                    style={{
                        fontSize: 16,
                        color: colors.textSecondary,
                    }}
                >
                    Your handpicked collection of delicious recipes
                </Text>
            </View>

            {favoriteMeals.length === 0 ? (
                <EmptyState />
            ) : (
                <FlatList
                    data={favoriteMeals}
                    keyExtractor={(item) => item.id!}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    }
                    ListHeaderComponent={<HeaderStats />}
                    renderItem={({ item }) => (
                        <MealCard
                            meal={item}
                            onFavorite={() => handleFavoriteToggle(item)}
                            onDelete={() => handleDeleteMeal(item.id!)}
                        />
                    )}
                    contentContainerStyle={{
                        paddingBottom: 20,
                    }}
                />
            )}
        </View>
    );
}

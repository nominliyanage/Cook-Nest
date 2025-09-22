import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Alert,
    RefreshControl,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

    useEffect(() => {
        if (!user) return;

        const loadFavorites = async () => {
            try {
                // Ensure all meals have favorite field
                await ensureFavoriteField(user.uid);

                // Set up real-time listener for user's meals
                const userMealsQuery = query(mealColRef, where("userId", "==", user.uid));

                const unsubscribe = onSnapshot(userMealsQuery, (snapshot) => {
                    const allMeals = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Meal[];

                    // Filter only favorite meals
                    const favorites = allMeals.filter((meal) => meal.favorite === true);
                    setFavoriteMeals(favorites);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error setting up favorites listener:", error);
                setLoading(false);
            }
        };

        loadFavorites();
    }, [user]);

    const handleFavoriteToggle = async (meal: Meal) => {
        if (!user) return;

        try {
            await toggleMealFavorite(meal.id!);
        } catch (error) {
            Alert.alert("Error", "Failed to update favorite");
        }
    };

    const handleDeleteMeal = async (mealId: string) => {
        if (!user) return;

        Alert.alert(
            "Delete Favorite Recipe",
            "Are you sure you want to delete this favorite recipe?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteMeal(mealId);
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete meal");
                        }
                    },
                },
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        // The real-time listener will handle the refresh automatically
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={colors.gradient.secondary}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <MaterialIcons name="favorite" size={32} color={colors.surface} />
                    <Text style={[styles.headerTitle, { color: colors.surface }]}>
                        Favorite Recipes 💚
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.surface }]}>
                        Your loved fresh creations
                    </Text>
                </View>
            </LinearGradient>

            {/* Stats Card */}
            <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
                <View style={styles.statItem}>
                    <MaterialIcons name="favorite" size={24} color={colors.secondary} />
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                        {favoriteMeals.length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                        Favorite Recipes
                    </Text>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.loadingState}>
                        <MaterialIcons name="favorite" size={48} color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.text }]}>
                            Loading your favorite recipes...
                        </Text>
                    </View>
                ) : favoriteMeals.length > 0 ? (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Your Favorite Fresh Recipes ✨
                        </Text>
                        {favoriteMeals.map((meal) => (
                            <View key={meal.id} style={styles.mealCardContainer}>
                                <MealCard
                                    meal={meal}
                                    onToggleFavorite={() => handleFavoriteToggle(meal)}
                                    onDelete={() => handleDeleteMeal(meal.id!)}
                                    showActions={true}
                                />
                            </View>
                        ))}
                    </>
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="favorite-border" size={80} color={colors.textMuted} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            No Favorites Yet! 💚
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                            Start adding recipes to your favorites by tapping the heart icon on any recipe
                        </Text>

                        <TouchableOpacity
                            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
                            onPress={() => router.push("/(dashboard)/meals")}
                        >
                            <MaterialIcons name="explore" size={20} color={colors.surface} />
                            <Text style={[styles.exploreButtonText, { color: colors.surface }]}>
                                Explore Recipes
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.createButton, { backgroundColor: colors.secondary }]}
                            onPress={() => router.push("/(dashboard)/meals/new")}
                        >
                            <MaterialIcons name="add" size={20} color={colors.surface} />
                            <Text style={[styles.createButtonText, { color: colors.surface }]}>
                                Create New Recipe
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerContent: {
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 12,
        textAlign: "center",
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
        opacity: 0.9,
        textAlign: "center",
    },
    statsCard: {
        flexDirection: "row",
        justifyContent: "center",
        margin: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statItem: {
        alignItems: "center",
    },
    statNumber: {
        fontSize: 28,
        fontWeight: "bold",
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: "500",
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    loadingState: {
        alignItems: "center",
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        marginTop: 16,
        textAlign: "center",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginVertical: 16,
        paddingHorizontal: 4,
    },
    mealCardContainer: {
        marginBottom: 12,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 12,
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
    },
    exploreButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    exploreButtonText: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
});

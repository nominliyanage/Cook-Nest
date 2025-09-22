import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    StyleSheet,
    RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLoader } from "@/context/LoaderContext";
import MealCard from "@/components/MealCard";
import {
    getMeals,
    deleteMeal,
    toggleMealFavorite,
} from "@/services/mealService";
import { mealColRef } from "@/services/mealService";
import { Meal } from "@/types/meal";
import { onSnapshot, query, where } from "firebase/firestore";

const MealsScreen = () => {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const { hideLoader, showLoader } = useLoader();
    const { user } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();

    const filters = [
        { id: "all", name: "All Fresh", icon: "eco" },
        { id: "breakfast", name: "Morning", icon: "wb-sunny" },
        { id: "lunch", name: "Midday", icon: "lunch-dining" },
        { id: "dinner", name: "Evening", icon: "dinner-dining" },
        { id: "snack", name: "Snacks", icon: "local-cafe" },
    ];

    useEffect(() => {
        if (!user) return;

        const userMealsQuery = query(mealColRef, where("userId", "==", user.uid));

        const unsubscribe = onSnapshot(
            userMealsQuery,
            (snapshot) => {
                const mealList = snapshot.docs.map((mealRef) => ({
                    id: mealRef.id,
                    ...mealRef.data(),
                })) as Meal[];
                setMeals(mealList);
            },
            (err) => {
                console.error("Error fetching meals:", err);
            }
        );
        return () => unsubscribe();
    }, [user]);

    const filteredMeals = meals.filter((meal) => {
        if (selectedFilter === "all") return true;
        return meal.mealType === selectedFilter;
    });

    const handleFavoriteToggle = async (meal: Meal) => {
        if (!user) return;

        try {
            await toggleMealFavorite(meal.id!);
        } catch (error) {
            Alert.alert("Error", "Failed to update favorite");
            console.error(error);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Recipe",
            "Are you sure you want to delete this fresh recipe?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteMeal(id);
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete recipe");
                            console.error(error);
                        }
                    },
                },
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // The onSnapshot listener will handle the refresh
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={colors.gradient.primary}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={[styles.headerTitle, { color: colors.surface }]}>
                    Fresh Recipes 🌱
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.surface }]}>
                    Your collection of delicious creations
                </Text>
            </LinearGradient>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContainer}
            >
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter.id}
                        style={[
                            styles.filterTab,
                            {
                                backgroundColor:
                                    selectedFilter === filter.id
                                        ? colors.primary
                                        : colors.surface,
                                borderColor: colors.border,
                            },
                        ]}
                        onPress={() => setSelectedFilter(filter.id)}
                    >
                        <MaterialIcons
                            name={filter.icon as any}
                            size={18}
                            color={
                                selectedFilter === filter.id
                                    ? colors.surface
                                    : colors.primary
                            }
                        />
                        <Text
                            style={[
                                styles.filterText,
                                {
                                    color:
                                        selectedFilter === filter.id
                                            ? colors.surface
                                            : colors.text,
                                },
                            ]}
                        >
                            {filter.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Results Count */}
            <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: colors.text }]}>
                    {filteredMeals.length} Fresh Recipe
                    {filteredMeals.length !== 1 ? "s" : ""}
                </Text>
            </View>

            {/* Meals List */}
            <ScrollView
                style={styles.mealsContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {filteredMeals.length > 0 ? (
                    filteredMeals.map((meal) => (
                        <MealCard
                            key={meal.id}
                            meal={meal}
                            onToggleFavorite={() => handleFavoriteToggle(meal)}
                            onDelete={() => handleDelete(meal.id!)}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="eco" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            No Fresh Recipes Yet
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                            Start creating your first delicious recipe
                        </Text>
                        <TouchableOpacity
                            style={[styles.createButton, { backgroundColor: colors.primary }]}
                            onPress={() => router.push("/(dashboard)/meals/new")}
                        >
                            <MaterialIcons name="add" size={20} color={colors.surface} />
                            <Text
                                style={[styles.createButtonText, { color: colors.surface }]}
                            >
                                Create Recipe
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Floating Add Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.secondary }]}
                onPress={() => router.push("/(dashboard)/meals/new")}
            >
                <MaterialIcons name="add" size={28} color={colors.surface} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
    },
    headerSubtitle: {
        fontSize: 16,
        textAlign: "center",
        marginTop: 4,
        opacity: 0.9,
    },
    filterScroll: {
        paddingLeft: 20,
        paddingTop: 16,
    },
    filterContainer: {
        paddingRight: 20,
    },
    filterTab: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 6,
    },
    resultsHeader: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    resultsCount: {
        fontSize: 18,
        fontWeight: "600",
    },
    mealsContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: "center",
        marginTop: 8,
        marginBottom: 24,
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    fab: {
        position: "absolute",
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
});

export default MealsScreen;

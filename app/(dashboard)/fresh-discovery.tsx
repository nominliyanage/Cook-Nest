import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    TextInput,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { getMeals } from "@/services/mealService";
import { Meal } from "@/types/meal";
import MealCard from "@/components/MealCard";

const { width } = Dimensions.get("window");

export default function FreshDiscoveryScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: "all", name: "All Fresh", icon: "eco" },
        { id: "breakfast", name: "Morning", icon: "wb-sunny" },
        { id: "lunch", name: "Midday", icon: "lunch-dining" },
        { id: "dinner", name: "Evening", icon: "dinner-dining" },
        { id: "snack", name: "Snacks", icon: "local-cafe" },
    ];

    useEffect(() => {
        loadMeals();
    }, [user]);

    useEffect(() => {
        filterMeals();
    }, [meals, searchQuery, selectedCategory]);

    const loadMeals = async () => {
        if (!user) return;

        try {
            const userMeals = await getMeals(user.uid);
            setMeals(userMeals);
        } catch (error) {
            console.error("Error loading meals:", error);
            Alert.alert("Error", "Failed to load fresh recipes");
        } finally {
            setLoading(false);
        }
    };

    const filterMeals = () => {
        let filtered = meals;

        if (selectedCategory !== "all") {
            filtered = filtered.filter((meal) => meal.mealType === selectedCategory);
        }

        if (searchQuery.trim()) {
            filtered = filtered.filter(
                (meal) =>
                    meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    meal.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredMeals(filtered);
    };

    const handleMealPress = (meal: Meal) => {
        router.push({
            pathname: "/meals/[id]",
            params: { id: meal.id },
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: "Fresh Discovery",
                    headerStyle: { backgroundColor: colors.primary },
                    headerTintColor: colors.surface,
                    headerTitleStyle: { fontWeight: "bold" },
                }}
            />

            {/* Header Gradient */}
            <LinearGradient
                colors={colors.gradient.primary}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <MaterialIcons name="eco" size={32} color={colors.surface} />
                    <Text style={[styles.headerTitle, { color: colors.surface }]}>
                        Discover Fresh Recipes
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.surface }]}>
                        Explore your fresh food collection 🍔
                    </Text>
                </View>
            </LinearGradient>

            {/* Search Bar */}
            <View
                style={[
                    styles.searchContainer,
                    { backgroundColor: colors.surface },
                ]}
            >
                <MaterialIcons name="search" size={24} color={colors.textMuted} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search fresh recipes..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <MaterialIcons name="clear" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Category Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContainer}
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryCard,
                            {
                                backgroundColor:
                                    selectedCategory === category.id
                                        ? colors.primary
                                        : colors.surface,
                                borderColor: colors.border,
                            },
                        ]}
                        onPress={() => setSelectedCategory(category.id)}
                    >
                        <MaterialIcons
                            name={category.icon as any}
                            size={20}
                            color={
                                selectedCategory === category.id
                                    ? colors.surface
                                    : colors.primary
                            }
                        />
                        <Text
                            style={[
                                styles.categoryText,
                                {
                                    color:
                                        selectedCategory === category.id
                                            ? colors.surface
                                            : colors.text,
                                },
                            ]}
                        >
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Results */}
            <ScrollView style={styles.resultsContainer}>
                <Text style={[styles.resultsTitle, { color: colors.text }]}>
                    {filteredMeals.length} Fresh Recipe
                    {filteredMeals.length !== 1 ? "s" : ""} Found 🌿
                </Text>

                {filteredMeals.map((meal) => (
                    <TouchableOpacity
                        key={meal.id}
                        onPress={() => handleMealPress(meal)}
                        style={styles.mealCardContainer}
                    >
                        <MealCard meal={meal} />
                    </TouchableOpacity>
                ))}

                {filteredMeals.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="eco" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            No fresh recipes found
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                            Try adjusting your search or create a new fresh recipe 🍔
                        </Text>
                        <TouchableOpacity
                            style={[styles.createButton, { backgroundColor: colors.primary }]}
                            onPress={() => router.push("/(dashboard)/meals/new")}
                        >
                            <MaterialIcons name="add" size={20} color={colors.surface} />
                            <Text style={[styles.createButtonText, { color: colors.surface }]}>
                                Create Fresh Recipe
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 30,
        paddingTop: 50,
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
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        margin: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
    },
    categoryScroll: {
        paddingLeft: 20,
    },
    categoryContainer: {
        paddingRight: 20,
    },
    categoryCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 6,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginVertical: 16,
    },
    mealCardContainer: {
        marginBottom: 12,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
        marginBottom: 24,
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
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

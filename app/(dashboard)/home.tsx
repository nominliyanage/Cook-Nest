import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import MealCard from "../../components/MealCard";
import QuickCameraAction from "../../components/QuickCameraAction";
import {
    getMeals,
    getPlannedMeals,
    toggleMealFavorite,
    deleteMeal,
    ensureFavoriteField,
} from "../../services/mealService";
import { getUserProfile } from "../../services/userService";
import { Meal } from "../../types/meal";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
    const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
    const [favoriteMeals, setFavoriteMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        if (!user) return;

        try {
            // Ensure all meals have favorite field (migration)
            await ensureFavoriteField(user.uid);

            // Load user profile
            const profile = await getUserProfile(user.uid);
            setUserProfile(profile);

            // Load meals data
            const [allMeals, plannedMeals] = await Promise.all([
                getMeals(user.uid),
                getPlannedMeals(user.uid),
            ]);

            // Get recent meals (last 5)
            const sortedMeals = allMeals.sort(
                (a, b) =>
                    new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
            );
            setRecentMeals(sortedMeals.slice(0, 5));

            // Get today's planned meals
            const today = new Date().toISOString().split("T")[0];
            const todaysPlanned = plannedMeals.filter(
                (meal) => meal.plannedDate && meal.plannedDate.startsWith(today)
            );
            setTodaysMeals(todaysPlanned);

            // Get favorite meals (first 3)
            const favorites = allMeals.filter((meal) => meal.favorite).slice(0, 3);
            setFavoriteMeals(favorites);
        } catch (error) {
            console.error("Error loading home data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleFavoriteToggle = async (meal: Meal) => {
        if (!user) return;

        try {
            await toggleMealFavorite(meal.id!);
            await loadData(); // Refresh data
        } catch (error) {
            Alert.alert("Error", "Failed to update favorite");
        }
    };

    const handleDeleteMeal = async (mealId: string) => {
        if (!user) return;

        try {
            await deleteMeal(mealId);
            await loadData(); // Refresh data
        } catch (error) {
            Alert.alert("Error", "Failed to delete meal");
        }
    };

    const handleImageCaptured = (imageUri: string) => {
        // Navigate to meal creation screen with the captured image
        router.push({
            pathname: "/(dashboard)/meals/new",
            params: { imageUri },
        });
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const QuickActionCard = ({
                                 title,
                                 subtitle,
                                 icon,
                                 onPress,
                                 gradient,
                             }: {
        title: string;
        subtitle: string;
        icon: string;
        onPress: () => void;
        gradient: string[];
    }) => (
        <TouchableOpacity
            style={{
                flex: 1,
                marginHorizontal: 6,
                borderRadius: 20,
                overflow: "hidden",
                elevation: 4,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            }}
            onPress={onPress}
        >
            <LinearGradient
                colors={gradient}
                style={{
                    padding: 20,
                    minHeight: 120,
                    justifyContent: "space-between",
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <MaterialIcons name={icon as any} size={32} color={colors.surface} />
                <View>
                    <Text
                        style={{
                            color: colors.surface,
                            fontSize: 16,
                            fontWeight: "bold",
                            marginBottom: 4,
                        }}
                    >
                        {title}
                    </Text>
                    <Text
                        style={{
                            color: colors.surface,
                            fontSize: 13,
                            opacity: 0.9,
                        }}
                    >
                        {subtitle}
                    </Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: colors.background,
                }}
            >
                <MaterialIcons name="restaurant" size={48} color={colors.primary} />
                <Text
                    style={{
                        color: colors.text,
                        fontSize: 18,
                        fontWeight: "600",
                        marginTop: 16,
                    }}
                >
                    Loading your fresh recipes...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Stunning Header with Fresh Green Gradient */}
            <LinearGradient
                colors={colors.gradient.primary}
                style={{
                    paddingHorizontal: 20,
                    paddingTop: 60,
                    paddingBottom: 30,
                    borderBottomLeftRadius: 32,
                    borderBottomRightRadius: 32,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 20,
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                color: colors.surface,
                                fontSize: 28,
                                fontWeight: "bold",
                            }}
                        >
                            {getGreeting()}
                        </Text>
                        <Text
                            style={{
                                color: colors.surface,
                                fontSize: 16,
                                opacity: 0.9,
                                marginTop: 4,
                            }}
                        >
                            {userProfile?.displayName || "Food Creator"} 👤
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: "rgba(255,255,255,0.2)",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        onPress={() => router.push("/(dashboard)/notification")}
                    >
                        <MaterialIcons name="notifications" size={24} color={colors.surface} />
                    </TouchableOpacity>
                </View>

                {/* Enhanced Stats Cards */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "rgba(255,255,255,0.15)",
                            padding: 16,
                            borderRadius: 16,
                            flex: 1,
                            marginRight: 8,
                            alignItems: "center",
                        }}
                    >
                        <MaterialIcons name="restaurant-menu" size={24} color={colors.surface} />
                        <Text
                            style={{
                                color: colors.surface,
                                fontSize: 20,
                                fontWeight: "bold",
                                marginTop: 8,
                            }}
                        >
                            {recentMeals.length}
                        </Text>
                        <Text
                            style={{
                                color: colors.surface,
                                fontSize: 12,
                                opacity: 0.8,
                            }}
                        >
                            Fresh Recipes
                        </Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: "rgba(255,255,255,0.15)",
                            padding: 16,
                            borderRadius: 16,
                            flex: 1,
                            marginLeft: 8,
                            alignItems: "center",
                        }}
                    >
                        <MaterialIcons name="favorite" size={24} color={colors.surface} />
                        <Text
                            style={{
                                color: colors.surface,
                                fontSize: 20,
                                fontWeight: "bold",
                                marginTop: 8,
                            }}
                        >
                            {favoriteMeals.length}
                        </Text>
                        <Text
                            style={{
                                color: colors.surface,
                                fontSize: 12,
                                opacity: 0.8,
                            }}
                        >
                            Loved Dishes
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Enhanced Quick Actions */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: 20,
                        fontWeight: "bold",
                        marginBottom: 16,
                    }}
                >
                    Quick Actions
                </Text>
                <View style={{ flexDirection: "row" }}>
                    <QuickActionCard
                        title="Create Recipe"
                        subtitle="Add your fresh new creation"
                        icon="add-circle"
                        gradient={colors.gradient.secondary}
                        onPress={() => router.push("/(dashboard)/meals/new")}
                    />
                    <QuickActionCard
                        title="Meal Planning"
                        subtitle="Plan your weekly fresh meals"
                        icon="event-note"
                        gradient={colors.gradient.accent}
                        onPress={() => router.push("/(dashboard)/plan")}
                    />
                </View>
            </View>

            {/* Enhanced Camera Action */}
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                <QuickCameraAction onImageCaptured={handleImageCaptured} />
            </View>

            {/* Beautiful Sections */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                {/* Today's Meals */}
                {todaysMeals.length > 0 && (
                    <View style={{ marginBottom: 32 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.text,
                                    fontSize: 20,
                                    fontWeight: "bold",
                                }}
                            >
                                Today's Fresh Menu 🌿
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/(dashboard)/plan")}
                            >
                                <Text
                                    style={{
                                        color: colors.primary,
                                        fontSize: 14,
                                        fontWeight: "600",
                                    }}
                                >
                                    View All
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {todaysMeals.map((meal, index) => (
                                <View
                                    key={meal.id}
                                    style={{
                                        marginRight: 16,
                                        width: width * 0.75,
                                    }}
                                >
                                    <MealCard
                                        meal={meal}
                                        onToggleFavorite={() => handleFavoriteToggle(meal)}
                                        onDelete={() => handleDeleteMeal(meal.id!)}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Recent Meals */}
                {recentMeals.length > 0 && (
                    <View style={{ marginBottom: 32 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.text,
                                    fontSize: 20,
                                    fontWeight: "bold",
                                }}
                            >
                                Recent Creations ✨
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/(dashboard)/meals")}
                            >
                                <Text
                                    style={{
                                        color: colors.primary,
                                        fontSize: 14,
                                        fontWeight: "600",
                                    }}
                                >
                                    View All
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {recentMeals.slice(0, 3).map((meal, index) => (
                            <View key={meal.id} style={{ marginBottom: 12 }}>
                                <MealCard
                                    meal={meal}
                                    onToggleFavorite={() => handleFavoriteToggle(meal)}
                                    onDelete={() => handleDeleteMeal(meal.id!)}
                                />
                            </View>
                        ))}
                    </View>
                )}

                {/* Favorite Meals */}
                {favoriteMeals.length > 0 && (
                    <View style={{ marginBottom: 100 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.text,
                                    fontSize: 20,
                                    fontWeight: "bold",
                                }}
                            >
                                Your Favorites 💚
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/(dashboard)/favourites")}
                            >
                                <Text
                                    style={{
                                        color: colors.primary,
                                        fontSize: 14,
                                        fontWeight: "600",
                                    }}
                                >
                                    View All
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {favoriteMeals.map((meal, index) => (
                                <View
                                    key={meal.id}
                                    style={{
                                        marginRight: 16,
                                        width: width * 0.75,
                                    }}
                                >
                                    <MealCard
                                        meal={meal}
                                        onToggleFavorite={() => handleFavoriteToggle(meal)}
                                        onDelete={() => handleDeleteMeal(meal.id!)}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Empty State */}
                {recentMeals.length === 0 && (
                    <View
                        style={{
                            alignItems: "center",
                            paddingVertical: 60,
                        }}
                    >
                        <MaterialIcons name="eco" size={64} color={colors.textMuted} />
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: 20,
                                fontWeight: "600",
                                marginTop: 16,
                                marginBottom: 8,
                            }}
                        >
                            Start Your Fresh Journey! 🌱
                        </Text>
                        <Text
                            style={{
                                color: colors.textMuted,
                                fontSize: 16,
                                textAlign: "center",
                                marginBottom: 24,
                                lineHeight: 24,
                            }}
                        >
                            Create your first recipe and begin your fresh food adventure
                        </Text>
                        <TouchableOpacity
                            style={{
                                backgroundColor: colors.primary,
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 16,
                                elevation: 2,
                                shadowColor: colors.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                            onPress={() => router.push("/(dashboard)/meals/new")}
                        >
                            <Text
                                style={{
                                    color: colors.surface,
                                    fontSize: 16,
                                    fontWeight: "600",
                                }}
                            >
                                Create First Recipe
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
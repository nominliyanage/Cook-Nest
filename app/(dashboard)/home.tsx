import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
                                 icon,
                                 title,
                                 subtitle,
                                 onPress,
                                 color = colors.primary,
                             }: any) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginRight: 12,
                minWidth: 140,
                shadowColor: colors.text,
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
                elevation: 3,
            }}
        >
            <View
                style={{
                    backgroundColor: color,
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <MaterialIcons name={icon} size={24} color="white" />
            </View>
            <Text
                style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 4,
                }}
            >
                {title}
            </Text>
            <Text
                style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                }}
            >
                {subtitle}
            </Text>
        </TouchableOpacity>
    );

    const StatCard = ({ icon, value, label, color = colors.primary }: any) => (
        <View
            style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                flex: 1,
                marginHorizontal: 4,
                alignItems: "center",
                shadowColor: colors.text,
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
                elevation: 3,
            }}
        >
            <MaterialIcons name={icon} size={24} color={color} />
            <Text
                style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                    marginVertical: 4,
                }}
            >
                {value}
            </Text>
            <Text
                style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    textAlign: "center",
                }}
            >
                {label}
            </Text>
        </View>
    );

    const SectionHeader = ({
                               title,
                               onViewAll,
                           }: {
        title: string;
        onViewAll?: () => void;
    }) => (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                paddingHorizontal: 16,
            }}
        >
            <Text
                style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                }}
            >
                {title}
            </Text>
            {onViewAll && (
                <TouchableOpacity onPress={onViewAll}>
                    <Text
                        style={{
                            color: colors.primary,
                            fontWeight: "600",
                        }}
                    >
                        View All
                    </Text>
                </TouchableOpacity>
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
                <MaterialIcons
                    name="restaurant-menu"
                    size={48}
                    color={colors.primary}
                />
                <Text style={{ color: colors.text, marginTop: 16 }}>
                    Loading your meals...
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
            {/* Header */}
            <View style={{ padding: 16, paddingTop: 24 }}>
                <Text
                    style={{
                        fontSize: 28,
                        fontWeight: "bold",
                        color: colors.text,
                        marginBottom: 4,
                    }}
                >
                    {getGreeting()}!
                </Text>
                <Text
                    style={{
                        fontSize: 16,
                        color: colors.textSecondary,
                    }}
                >
                    {userProfile?.firstName ? `${userProfile.firstName}` : "Welcome back"}
                </Text>
            </View>

            {/* Stats Row */}
            <View
                style={{
                    flexDirection: "row",
                    paddingHorizontal: 12,
                    marginBottom: 24,
                }}
            >
                <StatCard
                    icon="restaurant"
                    value={recentMeals.length}
                    label="Total Meals"
                    color={colors.primary}
                />
                <StatCard
                    icon="today"
                    value={todaysMeals.length}
                    label="Today's Plan"
                    color="#FF6B6B"
                />
                <StatCard
                    icon="favorite"
                    value={favoriteMeals.length}
                    label="Favorites"
                    color="#FFB347"
                />
            </View>

            {/* Quick Actions */}
            <View style={{ marginBottom: 24 }}>
                <Text
                    style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        color: colors.text,
                        paddingHorizontal: 16,
                        marginBottom: 16,
                    }}
                >
                    Quick Actions
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: 16 }}
                >
                    <QuickActionCard
                        icon="add"
                        title="Add Meal"
                        subtitle="Create new recipe"
                        onPress={() => router.push("/meals")}
                        color={colors.primary}
                    />
                    <QuickActionCard
                        icon="calendar-today"
                        title="Plan Meals"
                        subtitle="Schedule your week"
                        onPress={() => router.push("/plan")}
                        color="#FF6B6B"
                    />
                    <QuickActionCard
                        icon="favorite"
                        title="Favorites"
                        subtitle="View saved meals"
                        onPress={() => router.push("/favourites")}
                        color="#FFB347"
                    />
                    <View style={{ marginRight: 16 }}>
                        <QuickCameraAction />
                    </View>
                    <QuickActionCard
                        icon="person"
                        title="Profile"
                        subtitle="Edit your info"
                        onPress={() => router.push("/profile")}
                        color="#4ECDC4"
                    />
                </ScrollView>
            </View>

            {/* Today's Meals */}
            {todaysMeals.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                    <SectionHeader
                        title="Today's Meals"
                        onViewAll={() => router.push("/plan")}
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: 8 }}
                    >
                        {todaysMeals.map((meal) => (
                            <View key={meal.id} style={{ width: 280 }}>
                                <MealCard
                                    meal={meal}
                                    onFavorite={() => handleFavoriteToggle(meal)}
                                    onDelete={() => handleDeleteMeal(meal.id!)}
                                    showActions={false}
                                />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Favorite Meals */}
            {favoriteMeals.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                    <SectionHeader
                        title="Your Favorites"
                        onViewAll={() => router.push("/favourites")}
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: 8 }}
                    >
                        {favoriteMeals.map((meal) => (
                            <View key={meal.id} style={{ width: 280 }}>
                                <MealCard
                                    meal={meal}
                                    onFavorite={() => handleFavoriteToggle(meal)}
                                    onDelete={() => handleDeleteMeal(meal.id!)}
                                    showActions={false}
                                />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Recent Meals */}
            {recentMeals.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                    <SectionHeader
                        title="Recent Meals"
                        onViewAll={() => router.push("/meals")}
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: 8 }}
                    >
                        {recentMeals.map((meal) => (
                            <View key={meal.id} style={{ width: 280 }}>
                                <MealCard
                                    meal={meal}
                                    onFavorite={() => handleFavoriteToggle(meal)}
                                    onDelete={() => handleDeleteMeal(meal.id!)}
                                    showActions={false}
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
                        padding: 32,
                        alignItems: "center",
                        marginTop: 32,
                    }}
                >
                    <MaterialIcons
                        name="restaurant-menu"
                        size={64}
                        color={colors.textSecondary}
                    />
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: "600",
                            color: colors.text,
                            marginTop: 16,
                            marginBottom: 8,
                        }}
                    >
                        No Meals Yet
                    </Text>
                    <Text
                        style={{
                            color: colors.textSecondary,
                            textAlign: "center",
                            marginBottom: 24,
                        }}
                    >
                        Start by adding your first meal recipe to begin your culinary
                        journey!
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
                        <MaterialIcons name="add" size={20} color="white" />
                        <Text
                            style={{
                                color: "white",
                                fontWeight: "600",
                                marginLeft: 8,
                            }}
                        >
                            Add Your First Meal
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom padding */}
            <View style={{ height: 24 }} />
        </ScrollView>
    );
}

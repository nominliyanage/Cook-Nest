import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
    getMeals,
    getPlannedMeals,
    createMeal,
    deleteMeal,
} from "../../services/mealService";
import { Meal } from "../../types/meal";
import { useRouter } from "expo-router";
import MealCard from "../../components/MealCard";

export default function PlanScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [availableMeals, setAvailableMeals] = useState<Meal[]>([]);
    const [plannedMeals, setPlannedMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showMealSelector, setShowMealSelector] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [selectedMealType, setSelectedMealType] = useState<
        "breakfast" | "lunch" | "dinner" | "snack"
    >("breakfast");

    // Function to refresh data when date changes
    const refreshDataForDate = (date: string) => {
        console.log("Refreshing data for date:", date);
        setSelectedDate(date);
        // Load data specifically for this date
        if (user) {
            // Reload the entire data to ensure we have the latest
            loadData();
        }
    };

    const loadData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const [meals, planned] = await Promise.all([
                getMeals(user.uid),
                getPlannedMeals(user.uid),
            ]);

            setAvailableMeals(meals);
            setPlannedMeals(planned);

            // Filter and display meals for the currently selected date
            const mealsForCurrentDate = planned.filter(
                (m) => m.plannedDate && m.plannedDate.startsWith(selectedDate)
            );

            console.log(
                "Loaded planned meals for date:",
                selectedDate,
                "Count:",
                mealsForCurrentDate.length,
                "Meals:",
                mealsForCurrentDate.map((m) => ({
                    title: m.title,
                    plannedDate: m.plannedDate,
                    mealType: m.mealType,
                }))
            );
        } catch (error) {
            console.error("Error loading meal planning data:", error);
            Alert.alert("Error", "Failed to load meal planning data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const planMeal = async (meal: Meal) => {
        if (!user) return;

        // Show confirmation dialog
        Alert.alert(
            "Plan Meal",
            `Plan "${meal.title}" for ${selectedMealType} on ${new Date(selectedDate).toLocaleDateString()}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Plan Meal",
                    onPress: async () => {
                        setShowMealSelector(false); // Close modal immediately after confirming
                        try {
                            console.log(
                                "Planning meal for date:",
                                selectedDate,
                                "meal type:",
                                selectedMealType
                            );

                            // Create planned meal data
                            const plannedMealData: Meal = {
                                ...meal,
                                id: undefined, // This will create a new document
                                plannedDate: selectedDate + "T12:00:00.000Z",
                                mealType: selectedMealType,
                                isPlanned: true,
                                date: selectedDate + "T12:00:00.000Z", // Use selected date instead of today
                                userId: user.uid,
                            };

                            console.log("Planned meal data:", {
                                plannedDate: plannedMealData.plannedDate,
                                date: plannedMealData.date,
                                mealType: plannedMealData.mealType,
                            });

                            await createMeal(plannedMealData);
                            await loadData();
                            Alert.alert(
                                "Success",
                                `Meal planned for ${selectedMealType} on ${new Date(selectedDate).toLocaleDateString()}!`
                            );
                        } catch (error) {
                            Alert.alert("Error", "Failed to plan meal");
                            console.error(error);
                        }
                    },
                },
            ]
        );
    };

    const removePlannedMeal = async (plannedMealId: string) => {
        if (!user) return;

        try {
            await deleteMeal(plannedMealId);
            await loadData();
        } catch (error) {
            Alert.alert("Error", "Failed to remove planned meal");
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    useEffect(() => {
        loadData();
    }, [user]);

    // Add effect to update data when selectedDate changes
    useEffect(() => {
        if (user && !loading) {
            console.log("Selected date changed to:", selectedDate);
            // Re-filter meals for the selected date
            const mealsForSelectedDate = plannedMeals.filter(
                (meal) => meal.plannedDate && meal.plannedDate.startsWith(selectedDate)
            );
            console.log(
                `Found ${mealsForSelectedDate.length} meals for ${selectedDate}`
            );
        }
    }, [selectedDate]);

    const getWeekDates = () => {
        const today = new Date();
        const week = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            week.push({
                date: date.toISOString().split("T")[0],
                dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
                dayNumber: date.getDate(),
                isToday: i === 0,
            });
        }
        return week;
    };

    const getMealsForDate = (date: string) => {
        return plannedMeals.filter(
            (meal) => meal.plannedDate && meal.plannedDate.startsWith(date)
        );
    };

    const getMealsForDateAndType = (date: string, mealType: string) => {
        console.log("Filtering meals for date:", date, "type:", mealType);
        const filtered = plannedMeals.filter((meal) => {
            const matches =
                meal.plannedDate &&
                meal.plannedDate.startsWith(date) &&
                meal.mealType === mealType;
            if (matches) {
                console.log(
                    "Found matching meal:",
                    meal.title,
                    "plannedDate:",
                    meal.plannedDate
                );
            }
            return matches;
        });
        console.log("Total meals found:", filtered.length);
        return filtered;
    };

    const mealTypes = [
        { key: "breakfast", name: "Breakfast", icon: "free-breakfast" },
        { key: "lunch", name: "Lunch", icon: "lunch-dining" },
        { key: "dinner", name: "Dinner", icon: "dinner-dining" },
        { key: "snack", name: "Snack", icon: "cookie" },
    ];

    const WeekCalendar = () => (
        <View style={{ marginBottom: 20 }}>
            <Text
                style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                    marginBottom: 16,
                    paddingHorizontal: 16,
                }}
            >
                Weekly Meal Plan
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", paddingLeft: 16 }}>
                    {getWeekDates().map((day) => (
                        <TouchableOpacity
                            key={day.date}
                            onPress={() => refreshDataForDate(day.date)}
                            style={{
                                backgroundColor:
                                    day.date === selectedDate ? colors.primary : colors.card,
                                borderRadius: 16,
                                padding: 16,
                                marginRight: 12,
                                minWidth: 80,
                                alignItems: "center",
                                borderWidth: day.isToday ? 2 : 0,
                                borderColor: colors.primary + "50",
                            }}
                        >
                            <Text
                                style={{
                                    color: day.date === selectedDate ? "white" : colors.text,
                                    fontSize: 12,
                                    fontWeight: "600",
                                    marginBottom: 4,
                                }}
                            >
                                {day.dayName}
                            </Text>
                            <Text
                                style={{
                                    color: day.date === selectedDate ? "white" : colors.text,
                                    fontSize: 18,
                                    fontWeight: "bold",
                                }}
                            >
                                {day.dayNumber}
                            </Text>
                            <View
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor:
                                        getMealsForDate(day.date).length > 0
                                            ? day.date === selectedDate
                                                ? "white"
                                                : colors.primary
                                            : "transparent",
                                    marginTop: 4,
                                }}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    const MealPlanSection = ({ mealType, icon, name }: any) => {
        const mealsForType = getMealsForDateAndType(selectedDate, mealType);

        return (
            <View
                style={{
                    backgroundColor: colors.card,
                    marginHorizontal: 16,
                    marginBottom: 16,
                    borderRadius: 16,
                    padding: 16,
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <MaterialIcons name={icon} size={24} color={colors.primary} />
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "bold",
                                color: colors.text,
                                marginLeft: 8,
                            }}
                        >
                            {name}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setSelectedMealType(mealType);
                            setShowMealSelector(true);
                        }}
                        style={{
                            backgroundColor: colors.primary,
                            borderRadius: 20,
                            padding: 8,
                        }}
                    >
                        <MaterialIcons name="add" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {mealsForType.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {mealsForType.map((meal) => (
                            <View key={meal.id} style={{ width: 250, marginRight: 12 }}>
                                <MealCard
                                    meal={meal}
                                    onDelete={() => removePlannedMeal(meal.id!)}
                                    showActions={false}
                                />
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <View
                        style={{
                            padding: 20,
                            alignItems: "center",
                            borderStyle: "dashed",
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 12,
                        }}
                    >
                        <MaterialIcons
                            name="restaurant"
                            size={32}
                            color={colors.textSecondary}
                        />
                        <Text
                            style={{
                                color: colors.textSecondary,
                                marginTop: 8,
                                textAlign: "center",
                            }}
                        >
                            No {name.toLowerCase()} planned for this day
                        </Text>
                        <Text
                            style={{
                                color: colors.textSecondary,
                                fontSize: 12,
                                marginTop: 4,
                            }}
                        >
                            Tap + to add a meal
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const MealSelectorModal = () => (
        <Modal
            visible={showMealSelector}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: "bold",
                            color: colors.text,
                        }}
                    >
                        Select a Meal to Plan
                    </Text>
                    <TouchableOpacity onPress={() => setShowMealSelector(false)}>
                        <MaterialIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                        backgroundColor: colors.card,
                    }}
                >
                    <MaterialIcons name="event" size={20} color={colors.primary} />
                    <Text
                        style={{
                            marginLeft: 8,
                            color: colors.text,
                            fontWeight: "600",
                        }}
                    >
                        Planning for {selectedDate} -{" "}
                        {selectedMealType.charAt(0).toUpperCase() +
                            selectedMealType.slice(1)}
                    </Text>
                </View>

                {availableMeals.length > 0 ? (
                    <FlatList
                        data={availableMeals}
                        keyExtractor={(item) => item.id!}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => planMeal(item)}
                                style={{ marginBottom: 8 }}
                            >
                                <MealCard meal={item} showActions={false} />
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ padding: 16 }}
                    />
                ) : (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            padding: 32,
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
                                fontWeight: "bold",
                                color: colors.text,
                                marginTop: 16,
                                marginBottom: 8,
                                textAlign: "center",
                            }}
                        >
                            No Meals Available
                        </Text>
                        <Text
                            style={{
                                color: colors.textSecondary,
                                textAlign: "center",
                                marginBottom: 24,
                            }}
                        >
                            Add some meals first to start planning your weekly menu
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setShowMealSelector(false);
                                router.push("/(dashboard)/meals/new");
                            }}
                            style={{
                                backgroundColor: colors.primary,
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 24,
                            }}
                        >
                            <Text style={{ color: "white", fontWeight: "600" }}>
                                Add Your First Meal
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
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
                <MaterialIcons name="calendar-today" size={48} color={colors.primary} />
                <Text style={{ color: colors.text, marginTop: 16 }}>
                    Loading meal planner...
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
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
                        Meal Planner
                    </Text>
                    <Text
                        style={{
                            fontSize: 16,
                            color: colors.textSecondary,
                        }}
                    >
                        Plan your meals for the week ahead
                    </Text>
                </View>

                <WeekCalendar />

                {/* Quick Actions */}
                <View
                    style={{
                        flexDirection: "row",
                        paddingHorizontal: 16,
                        marginBottom: 24,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => router.push("/(dashboard)/meals/new")}
                        style={{
                            backgroundColor: colors.primary,
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 24,
                            marginRight: 12,
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
                            Add New Meal
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push("/(dashboard)/meals")}
                        style={{
                            backgroundColor: colors.card,
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 24,
                            borderWidth: 1,
                            borderColor: colors.border,
                        }}
                    >
                        <MaterialIcons name="restaurant" size={20} color={colors.primary} />
                        <Text
                            style={{
                                color: colors.primary,
                                fontWeight: "600",
                                marginLeft: 8,
                            }}
                        >
                            View All Meals
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Meal Plan Sections */}
                {mealTypes.map((type) => (
                    <MealPlanSection
                        key={type.key}
                        mealType={type.key}
                        icon={type.icon}
                        name={type.name}
                    />
                ))}
            </ScrollView>

            <MealSelectorModal />
        </View>
    );
}

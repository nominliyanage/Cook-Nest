import React from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Meal } from "../types/meal";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "expo-router";

interface MealCardProps {
    meal: Meal;
    onFavorite?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;
    showActions?: boolean;
}

export default function MealCard({
                                     meal,
                                     onFavorite,
                                     onDelete,
                                     onEdit,
                                     showActions = true,
                                 }: MealCardProps) {
    const { colors } = useTheme();
    const router = useRouter();

    const handleEdit = () => {
        if (onEdit) {
            onEdit();
        } else if (meal.id) {
            // Add a timestamp parameter to force the router to treat it as a new navigation
            // and reset the form state
            router.push({
                pathname: "/(dashboard)/meals/[id]",
                params: { id: meal.id, refresh: Date.now().toString() },
            });
        }
    };

    const handleDelete = () => {
        Alert.alert("Delete Meal", "Are you sure you want to delete this meal?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
        ]);
    };

    const formatMealType = (type?: string) => {
        if (!type) return "";
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    return (
        <TouchableOpacity
            onPress={handleEdit}
            style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                shadowColor: colors.text,
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: 4,
                margin: 8,
                overflow: "hidden",
            }}
        >
            {meal.image ? (
                <Image
                    source={{ uri: meal.image }}
                    style={{
                        height: 180,
                        width: "100%",
                        backgroundColor: colors.border,
                    }}
                    resizeMode="cover"
                />
            ) : (
                <View
                    style={{
                        height: 180,
                        width: "100%",
                        backgroundColor: colors.border,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <MaterialIcons
                        name="restaurant"
                        size={48}
                        color={colors.textSecondary}
                    />
                    <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                        No Image
                    </Text>
                </View>
            )}

            <View style={{ padding: 16 }}>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontWeight: "bold",
                                fontSize: 18,
                                color: colors.text,
                                marginBottom: 4,
                            }}
                        >
                            {meal.title || meal.name}
                        </Text>
                        {meal.mealType && (
                            <View
                                style={{
                                    backgroundColor: colors.primary,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                    alignSelf: "flex-start",
                                    marginBottom: 8,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "white",
                                        fontSize: 12,
                                        fontWeight: "600",
                                    }}
                                >
                                    {formatMealType(meal.mealType)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {showActions && onFavorite && (
                        <TouchableOpacity
                            onPress={() => {
                                console.log(
                                    "Favorite button pressed for meal:",
                                    meal.id,
                                    "Current favorite status:",
                                    meal.favorite
                                );
                                onFavorite();
                            }}
                            style={{
                                padding: 8,
                                borderRadius: 20,
                                backgroundColor: meal.favorite ? colors.error : colors.border,
                            }}
                        >
                            <MaterialIcons
                                name={meal.favorite ? "favorite" : "favorite-border"}
                                size={24}
                                color={meal.favorite ? "white" : colors.textSecondary}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {meal.description && (
                    <Text
                        style={{
                            color: colors.textSecondary,
                            fontSize: 14,
                            lineHeight: 20,
                            marginBottom: 12,
                        }}
                    >
                        {meal.description.length > 100
                            ? meal.description.substring(0, 100) + "..."
                            : meal.description}
                    </Text>
                )}

                {/* Meal Details Row */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 12,
                    }}
                >
                    {meal.cookingTime && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <MaterialIcons
                                name="schedule"
                                size={16}
                                color={colors.textSecondary}
                            />
                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    fontSize: 12,
                                    marginLeft: 4,
                                }}
                            >
                                {meal.cookingTime} min
                            </Text>
                        </View>
                    )}
                    {meal.servings && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <MaterialIcons
                                name="people"
                                size={16}
                                color={colors.textSecondary}
                            />
                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    fontSize: 12,
                                    marginLeft: 4,
                                }}
                            >
                                {meal.servings} servings
                            </Text>
                        </View>
                    )}
                    {meal.calories && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <MaterialIcons
                                name="local-fire-department"
                                size={16}
                                color={colors.textSecondary}
                            />
                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    fontSize: 12,
                                    marginLeft: 4,
                                }}
                            >
                                {meal.calories} cal
                            </Text>
                        </View>
                    )}
                </View>

                {showActions && (onEdit || onDelete) && (
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: 8,
                        }}
                    >
                        <TouchableOpacity
                            onPress={handleEdit}
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: colors.primary,
                                paddingVertical: 8,
                                borderRadius: 8,
                                marginRight: 8,
                            }}
                        >
                            <MaterialIcons name="edit" size={16} color="white" />
                            <Text
                                style={{ color: "white", marginLeft: 4, fontWeight: "600" }}
                            >
                                Edit
                            </Text>
                        </TouchableOpacity>

                        {onDelete && (
                            <TouchableOpacity
                                onPress={handleDelete}
                                style={{
                                    flex: 1,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: colors.error,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    marginLeft: 8,
                                }}
                            >
                                <MaterialIcons name="delete" size={16} color="white" />
                                <Text
                                    style={{ color: "white", marginLeft: 4, fontWeight: "600" }}
                                >
                                    Delete
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

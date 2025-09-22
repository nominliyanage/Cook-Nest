import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    ScrollView,
    Switch,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { createMeal, getMealById, updateMeal } from "@/services/mealService";
import { Meal } from "@/types/meal";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import IntegratedCamera from "@/components/IntegratedCamera";

const MealFormScreen = () => {
    const params = useLocalSearchParams<{
        id?: string;
        imageUri?: string;
    }>();

    const { colors } = useTheme();
    const { user } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    const router = useRouter();

    const id = params.id;
    const imageUri = params.imageUri;

    const isNew = !id || id === "new";
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
    const [ingredients, setIngredients] = useState("");
    const [cookingTime, setCookingTime] = useState("");
    const [servings, setServings] = useState("");
    const [calories, setCalories] = useState("");
    const [favorite, setFavorite] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    const mealTypes = [
        {
            id: "breakfast",
            name: "Morning Fresh",
            icon: "wb-sunny",
        },
        {
            id: "lunch",
            name: "Midday Meal",
            icon: "lunch-dining",
        },
        {
            id: "dinner",
            name: "Evening Feast",
            icon: "dinner-dining",
        },
        {
            id: "snack",
            name: "Quick Bite",
            icon: "local-cafe",
        },
    ];

    useEffect(() => {
        const loadMealData = async () => {
            // Handle image from camera if provided
            if (imageUri) {
                setImage(imageUri as string);
            }

            // Load existing meal data for editing
            if (!isNew && id) {
                try {
                    showLoader();
                    const meal = await getMealById(id);
                    if (meal) {
                        const mealData = meal as Meal;
                        setName(mealData.name || "");
                        setDescription(mealData.description || "");
                        setImage(mealData.image || "");
                        setMealType(mealData.mealType || "breakfast");
                        setIngredients(
                            Array.isArray(mealData.ingredients)
                                ? mealData.ingredients.join(", ")
                                : mealData.ingredients || ""
                        );
                        setCookingTime(
                            typeof mealData.cookingTime === 'string'
                                ? mealData.cookingTime
                                : mealData.cookingTime?.toString() || ""
                        );
                        setServings(
                            typeof mealData.servings === 'string'
                                ? mealData.servings
                                : mealData.servings?.toString() || ""
                        );
                        setCalories(
                            typeof mealData.calories === 'string'
                                ? mealData.calories
                                : mealData.calories?.toString() || ""
                        );
                        setFavorite(mealData.favorite || false);
                    }
                } catch (error) {
                    console.error("Error loading meal:", error);
                } finally {
                    hideLoader();
                }
            }
        };

        loadMealData();
    }, [id, imageUri]);

    const handleImagePicker = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Please enter a recipe name");
            return;
        }

        try {
            showLoader();

            // Process ingredients - ensure it's an array for storage
            const ingredientsArray = ingredients.trim()
                ? ingredients.split(',').map(item => item.trim()).filter(item => item)
                : [];

            const mealData: Partial<Meal> = {
                name: name.trim(),
                description: description.trim(),
                image,
                mealType,
                ingredients: ingredientsArray,
                cookingTime: cookingTime.trim(),
                servings: servings.trim(),
                calories: calories.trim(),
                favorite,
                userId: user?.uid,
                date: new Date().toISOString(),
            };

            if (isNew) {
                await createMeal(mealData as Meal);
                Alert.alert("Success", "Fresh recipe created successfully! 🌱");
            } else {
                await updateMeal(id, mealData);
                Alert.alert("Success", "Recipe updated successfully! ✨");
            }

            router.back();
        } catch (error) {
            console.error("Error saving meal:", error);
            Alert.alert("Error", "Failed to save recipe");
        } finally {
            hideLoader();
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={colors.gradient.primary}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={colors.surface} />
                    </TouchableOpacity>

                    <Text style={[styles.headerTitle, { color: colors.surface }]}>
                        {isNew ? "Create Fresh Recipe 🌱" : "Edit Recipe ✨"}
                    </Text>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                    >
                        <MaterialIcons name="check" size={24} color={colors.surface} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Image Section */}
                <View style={[styles.imageSection, { backgroundColor: colors.surface }]}>
                    {image ? (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: image }} style={styles.recipeImage} />
                            <TouchableOpacity
                                style={[styles.changeImageButton, { backgroundColor: colors.primary }]}
                                onPress={handleImagePicker}
                            >
                                <MaterialIcons name="camera-alt" size={16} color={colors.surface} />
                                <Text style={[styles.changeImageText, { color: colors.surface }]}>
                                    Change Photo
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.addImageButton, { borderColor: colors.border }]}
                            onPress={handleImagePicker}
                        >
                            <MaterialIcons name="add-a-photo" size={48} color={colors.textMuted} />
                            <Text style={[styles.addImageText, { color: colors.textMuted }]}>
                                Add Recipe Photo
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Recipe Name */}
                <View style={[styles.inputSection, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Recipe Name *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                        placeholder="Enter your fresh recipe name..."
                        placeholderTextColor={colors.textMuted}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Meal Type Selection */}
                <View style={[styles.inputSection, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Meal Type</Text>
                    <View style={styles.mealTypeGrid}>
                        {mealTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.mealTypeCard,
                                    {
                                        backgroundColor: mealType === type.id ? colors.primary : colors.backgroundSecondary,
                                        borderColor: mealType === type.id ? colors.primary : colors.border,
                                    }
                                ]}
                                onPress={() => setMealType(type.id as any)}
                            >
                                <MaterialIcons
                                    name={type.icon as any}
                                    size={24}
                                    color={mealType === type.id ? colors.surface : colors.primary}
                                />
                                <Text
                                    style={[
                                        styles.mealTypeText,
                                        { color: mealType === type.id ? colors.surface : colors.text }
                                    ]}
                                >
                                    {type.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Description */}
                <View style={[styles.inputSection, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                        placeholder="Describe your delicious creation..."
                        placeholderTextColor={colors.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Ingredients */}
                <View style={[styles.inputSection, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Ingredients</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                        placeholder="List your fresh ingredients (separated by commas)..."
                        placeholderTextColor={colors.textMuted}
                        value={ingredients}
                        onChangeText={setIngredients}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {/* Recipe Details Grid */}
                <View style={[styles.inputSection, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Recipe Details</Text>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                Cooking Time
                            </Text>
                            <TextInput
                                style={[styles.detailInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                placeholder="30 min"
                                placeholderTextColor={colors.textMuted}
                                value={cookingTime}
                                onChangeText={setCookingTime}
                            />
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                Servings
                            </Text>
                            <TextInput
                                style={[styles.detailInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                placeholder="4"
                                placeholderTextColor={colors.textMuted}
                                value={servings}
                                onChangeText={setServings}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                Calories
                            </Text>
                            <TextInput
                                style={[styles.detailInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                                placeholder="250"
                                placeholderTextColor={colors.textMuted}
                                value={calories}
                                onChangeText={setCalories}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {/* Favorite Toggle */}
                <View style={[styles.inputSection, { backgroundColor: colors.surface }]}>
                    <View style={styles.favoriteRow}>
                        <View style={styles.favoriteInfo}>
                            <MaterialIcons name="favorite" size={24} color={colors.secondary} />
                            <Text style={[styles.favoriteLabel, { color: colors.text }]}>
                                Mark as Favorite
                            </Text>
                        </View>
                        <Switch
                            value={favorite}
                            onValueChange={setFavorite}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={favorite ? colors.primary : colors.textMuted}
                        />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButtonLarge, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                >
                    <MaterialIcons name="restaurant" size={24} color={colors.surface} />
                    <Text style={[styles.saveButtonText, { color: colors.surface }]}>
                        {isNew ? "Create Fresh Recipe" : "Update Recipe"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {showCamera && (
                <IntegratedCamera
                    visible={showCamera}
                    onClose={() => setShowCamera(false)}
                    onImageCaptured={(uri) => {
                        setImage(uri);
                        setShowCamera(false);
                    }}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
    },
    inputSection: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
    },
    input: {
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
    },
    textArea: {
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        textAlignVertical: "top",
    },
    imageSection: {
        margin: 16,
        borderRadius: 16,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    imageContainer: {
        position: "relative",
    },
    recipeImage: {
        width: "100%",
        height: 200,
    },
    changeImageButton: {
        position: "absolute",
        bottom: 16,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    changeImageText: {
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 4,
    },
    addImageButton: {
        height: 200,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderStyle: "dashed",
        margin: 20,
        borderRadius: 16,
    },
    addImageText: {
        fontSize: 16,
        fontWeight: "500",
        marginTop: 8,
    },
    mealTypeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    mealTypeCard: {
        width: "48%",
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: "center",
        marginBottom: 12,
    },
    mealTypeText: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 4,
        textAlign: "center",
    },
    detailsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailItem: {
        flex: 1,
        marginHorizontal: 4,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: "500",
        marginBottom: 8,
    },
    detailInput: {
        padding: 12,
        borderRadius: 8,
        fontSize: 14,
        textAlign: "center",
    },
    favoriteRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    favoriteInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    favoriteLabel: {
        fontSize: 16,
        fontWeight: "500",
        marginLeft: 8,
    },
    saveButtonLarge: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        margin: 20,
        padding: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 8,
    },
});

export default MealFormScreen;

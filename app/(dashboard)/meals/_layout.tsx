import React from "react";
import { Stack } from "expo-router";

const MealsLayout = () => {
    return (
        <Stack screenOptions={{ animation: "fade_from_bottom" }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="[id]" options={{ title: "Meal Details" }} />
            {/* Add more meal-related screens here if needed */}
        </Stack>
    );
};

export default MealsLayout;

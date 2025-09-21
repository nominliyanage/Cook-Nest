import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";

const tabs = [
    { label: "Home", route: "/(dashboard)/home" },
    { label: "Meals", route: "/(dashboard)/meals" },
    { label: "Favourites", route: "/(dashboard)/favourites" },
    { label: "Plan", route: "/(dashboard)/plan" },
    { label: "Profile", route: "/(dashboard)/profile" },
    { label: "Settings", route: "/(dashboard)/settings" },
];

const FooterNav = () => {
    const router = useRouter();
    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-around",
                borderTopWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#fff",
                paddingVertical: 12,
            }}
        >
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.label}
                    onPress={() => router.push(tab.route as any)}
                    style={{ alignItems: "center", flex: 1 }}
                >
                    <Text style={{ fontSize: 14 }}>{tab.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default FooterNav;

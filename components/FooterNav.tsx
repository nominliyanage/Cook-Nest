import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "../context/ThemeContext";

const tabs = [
    {
        label: "Home",
        route: "/(dashboard)/home",
        icon: "cottage",
        activeIcon: "cottage",
    },
    {
        label: "Recipes",
        route: "/(dashboard)/meals",
        icon: "menu-book",
        activeIcon: "menu-book",
    },
    {
        label: "Discover",
        route: "/(dashboard)/fresh-discovery",
        icon: "explore",
        activeIcon: "explore",
    },
    {
        label: "Favorites",
        route: "/(dashboard)/favourites",
        icon: "bookmarks",
        activeIcon: "bookmarks",
    },
    {
        label: "Profile",
        route: "/(dashboard)/profile",
        icon: "account-circle",
        activeIcon: "account-circle",
    },
];

const FooterNav = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { colors } = useTheme();

    const isActiveTab = (route: string) => {
        return pathname === route || pathname.startsWith(route);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {/* Stunning Gradient Border */}
            <LinearGradient
                colors={colors.gradient.primary}
                style={styles.gradientBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />

            <View style={styles.tabContainer}>
                {tabs.map((tab, index) => {
                    const isActive = isActiveTab(tab.route);
                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.tab}
                            onPress={() => router.push(tab.route as any)}
                        >
                            {isActive && (
                                <LinearGradient
                                    colors={colors.gradient.accent}
                                    style={styles.activeBackground}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}

                            <MaterialIcons
                                name={
                                    isActive ? (tab.activeIcon as any) : (tab.icon as any)
                                }
                                size={24}
                                color={
                                    isActive ? colors.surface : colors.textMuted
                                }
                                style={styles.icon}
                            />

                            <Text
                                style={[
                                    styles.label,
                                    {
                                        color: isActive
                                            ? colors.surface
                                            : colors.textMuted,
                                        fontWeight: isActive ? "600" : "400",
                                    },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "relative",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 12,
        elevation: 8,
    },
    gradientBorder: {
        height: 3,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    tabContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        paddingBottom: 16,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
    },
    activeBackground: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16,
    },
    icon: {
        marginBottom: 4,
        zIndex: 1,
    },
    label: {
        fontSize: 11,
        textAlign: "center",
        zIndex: 1,
    },
});

export default FooterNav;

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Theme = "light" | "dark";

interface ThemeColors {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    background: string;
    backgroundSecondary: string;
    surface: string;
    surfaceSecondary: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    card: string;
    cardSecondary: string;
    success: string;
    warning: string;
    error: string;
    accent: string;
    accentLight: string;
    gradient: {
        primary: string[];
        secondary: string[];
        accent: string[];
        background: string[];
        card: string[];
    };
    shadow: string;
}

const lightTheme: ThemeColors = {
    primary: "#164ea3", // Fresh green - represents freshness/produce
    primaryLight: "#164ea3",
    primaryDark: "#164ea3",
    secondary: "#1688f9", // Vibrant tangerine - appetite/CTA
    secondaryLight: "#3c95fb",
    background: "#FFF7ED", // Soft cream background
    backgroundSecondary: "#FEF3E2",
    surface: "#FFFFFF", // Pure white for cards/panels
    surfaceSecondary: "#FFFBF5",
    text: "#0F172A", // Charcoal for primary text
    textSecondary: "#374151",
    textMuted: "#6B7280", // Gray for muted text
    border: "#E5E7EB",
    borderLight: "#F3F4F6",
    card: "#FFFFFF",
    cardSecondary: "#FFFBF5",
    success: "#114da4", // Same as primary for success notifications
    warning: "#0b9bf5",
    error: "#DC2626", // Error red
    accent: "rgba(5,49,145,0.5)", // Emerald accent
    accentLight: "rgba(5,49,145,0.5)",
    gradient: {
        primary: ["#124a9f", "rgba(10,57,161,0.5)", "rgba(54,118,252,0.5)"], // Fresh green gradients
        secondary: ["#124a9f", "rgba(10,57,161,0.5)", "rgba(54,118,252,0.5)"], // Tangerine gradients
        accent: ["#55a6e0", "#4596f3", "#427bd0"], // Emerald gradients
        background: ["#FFF7ED", "#FEF3E2", "#FDE68A"], // Warm cream gradients
        card: ["#FFFFFF", "#FFFBF5", "#FEF7ED"], // Clean white to cream
    },
    shadow: "rgba(15, 23, 42, 0.1)",
};

const darkTheme: ThemeColors = {
    primary: "#1653a3", // Lighter green for dark mode
    primaryLight: "#165da3",
    primaryDark: "#164ea3",
    secondary: "#3c9cfb", // Softer tangerine for dark
    secondaryLight: "#74ddfd",
    background: "#0F172A", // Dark charcoal
    backgroundSecondary: "#1E293B",
    surface: "#1E293B",
    surfaceSecondary: "#334155",
    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    border: "#475569",
    borderLight: "#334155",
    card: "#1E293B",
    cardSecondary: "#334155",
    success: "#2c80d3",
    warning: "#24a9fb",
    error: "#F87171",
    accent: "#4596f3",
    accentLight: "#427bd0",
    gradient: {
        primary: ["#1f59b0", "#5094f8", "#3576da"], // Dark mode green gradients
        secondary: ["#1f59b0", "#5094f8", "#3576da"], // Dark mode tangerine
        accent: ["#347ed3", "#1086b9", "#055e96"], // Dark emerald gradients
        background: ["#164b64", "#1E293B", "#334155"], // Dark backgrounds
        card: ["#1E293B", "#334155", "#475569"], // Dark card gradients
    },
    shadow: "rgba(0, 0, 0, 0.4)",
};

interface ThemeContextType {
    theme: Theme;
    colors: ThemeColors;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
                                                                     children,
                                                                 }) => {
    const [theme, setTheme] = useState<Theme>("light");

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem("theme");
            if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
                setTheme(savedTheme);
            }
        } catch (error) {
            console.error("Error loading theme:", error);
        }
    };

    const saveTheme = async (newTheme: Theme) => {
        try {
            await AsyncStorage.setItem("theme", newTheme);
        } catch (error) {
            console.error("Error saving theme:", error);
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        saveTheme(newTheme);
    };

    const colors = theme === "light" ? lightTheme : darkTheme;
    const isDark = theme === "dark";

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

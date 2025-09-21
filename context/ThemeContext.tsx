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
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    success: string;
    warning: string;
    error: string;
    accent: string;
}

const lightTheme: ThemeColors = {
    primary: "#007AFF",
    secondary: "#5856D6",
    background: "#F2F2F7",
    surface: "#FFFFFF",
    text: "#000000",
    textSecondary: "#6D6D70",
    border: "#E5E5EA",
    card: "#FFFFFF",
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
    accent: "#FF2D92",
};

const darkTheme: ThemeColors = {
    primary: "#0A84FF",
    secondary: "#5E5CE6",
    background: "#000000",
    surface: "#1C1C1E",
    text: "#FFFFFF",
    textSecondary: "#98989D",
    border: "#38383A",
    card: "#2C2C2E",
    success: "#30D158",
    warning: "#FF9F0A",
    error: "#FF453A",
    accent: "#FF375F",
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
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

import React, { createContext, useState } from "react";
export const MealContext = createContext();

export const MealProvider = ({ children }) => {
    const [meals, setMeals] = useState([]);
    const [favorites, setFavorites] = useState([]);

    return (
        <MealContext.Provider value={{ meals, setMeals, favorites, setFavorites }}>
            {children}
        </MealContext.Provider>
    );
};

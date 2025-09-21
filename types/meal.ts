export type Meal = {
  title: string;
  id?: string;
  name: string;
  description: string;
  image: string;
  date: string;
  favorite: boolean;
  userId: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  plannedDate?: string; // ISO date string for when the meal is planned
  ingredients?: string[];
  cookingTime?: number; // in minutes
  servings?: number;
  calories?: number;
  isPlanned?: boolean;
};

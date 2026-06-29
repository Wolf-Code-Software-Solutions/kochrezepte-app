export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

/** Difficulty levels for recipes */
export const Difficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export interface Ingredient {
  name: string;
  /** Menge (optional, z.B. "Salz nach Geschmack" hat keine) */
  amount?: string;
}

export interface RecipeDTO {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  steps: string[];
  /** Cooking time in minutes */
  cookingTimeInMinutes: number;
  difficulty: Difficulty;
  imageUrl?: string;
  userId: string;
}

export interface CreateRecipeDTO {
  title: string;
  description?: string;
  ingredients: Ingredient[];
  steps: string[];
  /** Cooking time in minutes */
  cookingTimeInMinutes: number;
  difficulty: Difficulty;
}

export interface UpdateRecipeDTO extends Partial<CreateRecipeDTO> {}

export interface UserDTO {
  id: string;
  email: string;
  name?: string;
}

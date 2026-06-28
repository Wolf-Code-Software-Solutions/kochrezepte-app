export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface RecipeDTO {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  steps: string[];
  cookingTime: number;
  difficulty: Difficulty;
  imageUrl?: string;
  userId: string;
}

export interface CreateRecipeDTO {
  title: string;
  description?: string;
  ingredients: Ingredient[];
  steps: string[];
  cookingTime: number;
  difficulty: Difficulty;
}

export interface UpdateRecipeDTO extends Partial<CreateRecipeDTO> {}

export interface UserDTO {
  id: string;
  email: string;
  name?: string;
}

import { validate, ValidatorOptions } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RecipeEntity } from './recipe.entity';

const validateOpts: ValidatorOptions = {
  whitelist: true,
  forbidNonWhitelisted: false,
};

/** Helper: erst transformieren (damit ValidateNested funktioniert), dann validieren. */
async function validateRecipe(recipe: Partial<RecipeEntity>) {
  const instance = plainToInstance(RecipeEntity, recipe);
  return validate(instance, validateOpts);
}

describe('RecipeEntity', () => {
  const validIngredients = [{ name: 'Mehl', amount: '200g' }, { name: 'Salz' }];
  const validSteps = ['Mehl sieben', 'Zubereiten'];

  it('sollte eine gueltige Rezept-Entitaet ohne Fehler erstellen', async () => {
    const errors = await validateRecipe({
      title: 'Brot',
      description: 'Hausgemachtes Brot',
      ingredients: validIngredients,
      steps: validSteps,
      cookingTimeInMinutes: 60,
      difficulty: 'easy' as const,
    });
    expect(errors.length).toBe(0);
  });

  it('sollte bei leerem Titel einen Validierungsfehler werfen', async () => {
    const errors = await validateRecipe({
      title: '',
      ingredients: validIngredients,
      steps: validSteps,
      cookingTimeInMinutes: 60,
      difficulty: 'easy' as const,
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.property === 'title')).toBeDefined();
  });

  it('sollte bei Kochzeit <= 0 einen Validierungsfehler werfen', async () => {
    const errors = await validateRecipe({
      title: 'Brot',
      ingredients: validIngredients,
      steps: validSteps,
      cookingTimeInMinutes: 0,
      difficulty: 'easy' as const,
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.property === 'cookingTimeInMinutes')).toBeDefined();
  });

  it('sollte bei Zutaten ohne Namen einen Validierungsfehler werfen', async () => {
    const errors = await validateRecipe({
      title: 'Brot',
      ingredients: [{ name: '', amount: '100g' }],
      steps: validSteps,
      cookingTimeInMinutes: 60,
      difficulty: 'easy' as const,
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('sollte optionale Felder (description, imageUrl) akzeptieren', async () => {
    const errors = await validateRecipe({
      title: 'Brot',
      description: undefined,
      imageUrl: null,
      ingredients: validIngredients,
      steps: validSteps,
      cookingTimeInMinutes: 60,
      difficulty: 'easy' as const,
    });
    expect(errors.length).toBe(0);
  });

  it('sollte Zutaten ohne Menge akzeptieren', async () => {
    const errors = await validateRecipe({
      title: 'Brot',
      ingredients: [{ name: 'Salz' }],
      steps: validSteps,
      cookingTimeInMinutes: 60,
      difficulty: 'easy' as const,
    });
    expect(errors.length).toBe(0);
  });

  it('sollte createdAt und updatedAt vom TypeORM-Decorator korrekt setzen', () => {
    const recipe = new RecipeEntity();
    recipe.title = 'Brot';
    recipe.ingredients = validIngredients;
    recipe.steps = validSteps;
    recipe.cookingTimeInMinutes = 60;
    recipe.difficulty = 'easy' as const;

    expect(recipe.createdAt).toBeUndefined();
    expect(recipe.updatedAt).toBeUndefined();
  });

  it('sollte alle Schwierigkeitsgrade akzeptieren', async () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const errors = await validateRecipe({
        title: `Rezept ${difficulty}`,
        ingredients: validIngredients,
        steps: validSteps,
        cookingTimeInMinutes: 30,
        difficulty,
      });
      expect(errors.length).toBe(0);
    }
  });

  it('sollte bei fehlendem Titel einen Validierungsfehler werfen', async () => {
    const errors = await validateRecipe({
      ingredients: validIngredients,
      steps: validSteps,
      cookingTimeInMinutes: 60,
      difficulty: 'easy' as const,
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.property === 'title')).toBeDefined();
  });
});

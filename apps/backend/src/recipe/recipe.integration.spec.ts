import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { validate } from 'class-validator';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { RecipeModule } from './recipe.module';
import { RecipeEntity } from './recipe.entity';
import { UserEntity } from '../user/user.entity';

describe('RecipeEntity (DB Integration)', () => {
  let dataSource: DataSource;
  let recipeRepo: Repository<RecipeEntity>;
  let userRepo: Repository<UserEntity>;
  const originalDatabasePath = process.env.DATABASE_PATH;

  beforeEach(async () => {
    // In-Memory DB fuer isolierte Tests
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, UserModule, RecipeModule],
    }).compile();

    dataSource = moduleFixture.get(DataSource);
    recipeRepo = dataSource.getRepository(RecipeEntity);
    userRepo = dataSource.getRepository(UserEntity);

    // SQLite braucht explizites Aktivieren von Foreign Keys fuer CASCADE
    await dataSource.query('PRAGMA foreign_keys = ON');
  });

  afterEach(async () => {
    // Cleanup DB connection
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }

    if (originalDatabasePath === undefined) {
      delete process.env.DATABASE_PATH;
    } else {
      process.env.DATABASE_PATH = originalDatabasePath;
    }
  });

  it('sollte die Rezept-Tabelle mit allen Spalten erstellen', async () => {
    const user = new UserEntity();
    user.email = 'test@koch.de';
    user.passwordHash = '$2b$10$fakedhash';
    user.name = 'Test User';
    await userRepo.save(user);

    const recipe = new RecipeEntity();
    recipe.title = 'Spaghetti';
    recipe.description = 'Italienisches Klassiker';
    recipe.ingredients = [
      { name: 'Spaghetti', amount: '500g' },
      { name: 'Salz' },
    ];
    recipe.steps = ['Wasser kochen', 'Nudeln kochen', 'Soesse machen'];
    recipe.cookingTimeInMinutes = 30;
    recipe.difficulty = 'easy';
    recipe.imageUrl = 'https://example.com/spaghetti.jpg';
    recipe.userId = user.id;

    const saved = await recipeRepo.save(recipe);
    expect(saved.id).toBeDefined();
    expect(saved.title).toBe('Spaghetti');
    expect(saved.cookingTimeInMinutes).toBe(30);
    expect(saved.difficulty).toBe('easy');
    expect(saved.imageUrl).toBe('https://example.com/spaghetti.jpg');
    expect(saved.userId).toBe(user.id);
    expect(saved.createdAt).toBeDefined();
    expect(saved.updatedAt).toBeDefined();
  });

  it('sollte den Titel als Pflichtfeld via Validierung erzwingen', async () => {
    const user = new UserEntity();
    user.email = 'test2@koch.de';
    user.passwordHash = '$2b$10$fakedhash';
    user.name = 'Test User 2';
    await userRepo.save(user);

    // class-validator-Validierung fuer leeren Titel
    const recipe = new RecipeEntity();
    recipe.title = '';
    recipe.ingredients = [{ name: 'Mehl', amount: '100g' }];
    recipe.steps = ['Mischen'];
    recipe.cookingTimeInMinutes = 10;
    recipe.difficulty = 'easy';
    recipe.userId = user.id;

    const errors = await validate(recipe);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.property === 'title')).toBeDefined();
  });

  it('sollte die Many-to-One Relation zum User korrekt auflösen', async () => {
    // User erstellen und speichern
    const user = new UserEntity();
    user.email = 'relation@koch.de';
    user.passwordHash = '$2b$10$fakedhash';
    user.name = 'Relation-User';
    await userRepo.save(user);

    // Rezept mit Relation zum User speichern
    const recipe = new RecipeEntity();
    recipe.title = 'Kuchen';
    recipe.ingredients = [{ name: 'Zucker', amount: '200g' }];
    recipe.steps = ['Backen'];
    recipe.cookingTimeInMinutes = 45;
    recipe.difficulty = 'medium';
    recipe.userId = user.id;
    await recipeRepo.save(recipe);

    // Rezept mit Relation laden und prüfen
    const loaded = await recipeRepo.findOne({ where: { id: recipe.id }, relations: { user: true } });
    expect(loaded).not.toBeNull();
    expect(loaded?.userId).toBe(user.id);
  });

  it('sollte Zutaten als JSON speichern und lesen', async () => {
    const user = new UserEntity();
    user.email = 'json@koch.de';
    user.passwordHash = '$2b$10$fakedhash';
    user.name = 'JSON-User';
    await userRepo.save(user);

    const ingredients = [
      { name: 'Mehl', amount: '500g' },
      { name: 'Butter', amount: '200g' },
      { name: 'Eier', amount: '4 Stueck' },
      { name: 'Zucker' }, // Ohne Menge
    ];

    const recipe = new RecipeEntity();
    recipe.title = 'Kuchen';
    recipe.ingredients = ingredients;
    recipe.steps = ['Rueren', 'Backen'];
    recipe.cookingTimeInMinutes = 60;
    recipe.difficulty = 'medium';
    recipe.userId = user.id;

    const saved = await recipeRepo.save(recipe);
    expect(saved.ingredients).toEqual(ingredients);

    // Erneut laden und pruefen
    const loaded = await recipeRepo.findOne({ where: { id: saved.id } });
    expect(loaded?.ingredients).toEqual(ingredients);
  });

  it('sollte cookingTimeInMinutes > 0 via Validierung erzwingen', async () => {
    const recipe = new RecipeEntity();
    recipe.title = 'Rezept';
    recipe.ingredients = [{ name: 'Mehl', amount: '100g' }];
    recipe.steps = ['Kochen'];
    recipe.cookingTimeInMinutes = -5; // Negativ sollte fehlschlagen
    recipe.difficulty = 'easy';

    const errors = await validate(recipe);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.property === 'cookingTimeInMinutes')).toBeDefined();
  });

  it('sollte UUID als Primärschluessel verwenden', async () => {
    const user = new UserEntity();
    user.email = 'uuid@koch.de';
    user.passwordHash = '$2b$10$fakedhash';
    user.name = 'UUID-User';
    await userRepo.save(user);

    const recipe = new RecipeEntity();
    recipe.title = 'UUID-Rezept';
    recipe.ingredients = [{ name: 'Mehl' }];
    recipe.steps = ['Kochen'];
    recipe.cookingTimeInMinutes = 10;
    recipe.difficulty = 'easy';
    recipe.userId = user.id;

    const saved = await recipeRepo.save(recipe);

    // UUID-Format prüfen (8-4-4-4-12 Pattern)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(saved.id).toMatch(uuidRegex);
  });

  it('sollte createdAt und updatedAt automatisch setzen', async () => {
    const user = new UserEntity();
    user.email = 'ts@koch.de';
    user.passwordHash = '$2b$10$fakedhash';
    user.name = 'Timestamp-User';
    await userRepo.save(user);

    const recipe = new RecipeEntity();
    recipe.title = 'Timestamp-Rezept';
    recipe.ingredients = [{ name: 'Mehl' }];
    recipe.steps = ['Kochen'];
    recipe.cookingTimeInMinutes = 10;
    recipe.difficulty = 'easy';
    recipe.userId = user.id;

    const saved = await recipeRepo.save(recipe);
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
    expect(saved.updatedAt.getTime() - saved.createdAt.getTime()).toBeGreaterThanOrEqual(0);
  });
});

import { NestApplication, Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../src/database/database.module';

describe('Database (E2E)', () => {
  let app: NestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Die Datenbank wird über den DI-Container bezogen, nicht manuell erstellt.
    // So wird die tatsächliche DatabaseModule-Konfiguration inkl. ConfigService getestet.
    dataSource = app.get(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  it('should connect to SQLite and perform a read/write via the application context', async () => {
    // Schreibtest über den DataSource des Anwendungskontexts
    await dataSource.query(
      'CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)',
    );
    await dataSource.query("INSERT INTO test_table (name) VALUES ('test')");

    // Lesetest
    const rows = await dataSource.query('SELECT * FROM test_table');

    expect(rows.length).toBe(1);
    expect((rows[0] as any).name).toBe('test');

    // Aufräumen
    await dataSource.query('DROP TABLE IF EXISTS test_table');
  });

  it('should use the actual application database configuration', async () => {
    // Verifiziert, dass die Datenbank über den Anwendungskontext korrekt
    // initialisiert wurde (ConfigService + DatabaseModule)
    expect(app).toBeDefined();
    expect(dataSource).toBeDefined();
    expect(dataSource.isInitialized).toBe(true);
  });
});

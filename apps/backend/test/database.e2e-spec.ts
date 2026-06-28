import { DataSource } from 'typeorm';

describe('Database (E2E)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: true,
      logging: false,
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('should connect to SQLite in-memory and perform a read/write', async () => {
    // Schreibtest: Tabelle erstellen und Daten einfügen
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)
    `);
    await dataSource.query(`INSERT INTO test_table (name) VALUES ('test')`);

    // Lesetest
    const rows = await dataSource.query('SELECT * FROM test_table');

    expect(rows.length).toBe(1);
    expect((rows[0] as any).name).toBe('test');

    // Aufräumen
    await dataSource.query(`DROP TABLE IF EXISTS test_table`);
  });
});

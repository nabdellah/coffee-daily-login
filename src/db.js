import { DatabaseSync } from 'node:sqlite';

const dbPath = process.env.DATABASE_PATH ?? 'data.db';
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS daily_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    date      TEXT    NOT NULL,
    shop_name TEXT    NOT NULL,
    sales     REAL    NOT NULL,
    customers INTEGER NOT NULL
  )
`);

// Migrate existing databases that have the old 'sector' column name
const cols = db.prepare('PRAGMA table_info(daily_log)').all();
if (cols.some(c => c.name === 'sector')) {
  db.exec('ALTER TABLE daily_log RENAME COLUMN sector TO shop_name');
}

export default db;

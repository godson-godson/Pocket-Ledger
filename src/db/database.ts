import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'pocket_ledger.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Initializes the SQLite database and creates the transactions table with indexes.
 * Safe to call multiple times; uses an initialization lock to prevent duplicate setups.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      // Enable WAL mode for high performance concurrent reads and writes
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');

      // Create transactions table with integer amount_paise (never float)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          amount_paise INTEGER NOT NULL CHECK(amount_paise > 0),
          category_id TEXT NOT NULL,
          category_name TEXT NOT NULL,
          category_icon TEXT NOT NULL,
          title TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          note TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
        CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

        -- Create budgets table for weekly and monthly spending limits (both overall and per-category)
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY NOT NULL,
          period_type TEXT NOT NULL CHECK(period_type IN ('weekly', 'monthly')),
          period_start_date TEXT NOT NULL,
          category_id TEXT NOT NULL,
          amount_paise INTEGER NOT NULL CHECK(amount_paise > 0),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          UNIQUE(period_type, period_start_date, category_id)
        );

        CREATE INDEX IF NOT EXISTS idx_budgets_lookup ON budgets(period_type, period_start_date);
      `);

      dbInstance = db;
      return db;
    } catch (error) {
      initPromise = null;
      console.error('[PocketLedger Database] Initialization failed:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Returns the active SQLite database instance, initializing it if not already open.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  return initDatabase();
}

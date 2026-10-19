import { getDatabase } from './database';
import {
  NewTransactionInput,
  SummaryMetrics,
  Transaction,
  TransactionQueryFilters,
  TransactionType,
  UpdateTransactionInput,
} from '../types/transaction';
import { getCurrentMonthKey } from '../utils/formatters';

interface TransactionRow {
  id: string;
  type: TransactionType;
  amount_paise: number;
  category_id: string;
  category_name: string;
  category_icon: string;
  title: string;
  date: string;
  created_at: number;
  note: string | null;
}

/**
 * Maps a database row into a strongly-typed Transaction model
 */
function mapRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amountPaise: row.amount_paise,
    amount: row.amount_paise / 100,
    categoryId: row.category_id as any,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    title: row.title,
    date: row.date,
    createdAt: row.created_at,
    note: row.note || undefined,
  };
}

/**
 * Inserts a new transaction into SQLite using parameterized queries.
 * Validates input strictly: amount must be an integer > 0 in paise.
 */
export async function insertTransaction(input: NewTransactionInput): Promise<Transaction> {
  const db = await getDatabase();

  const title = input.title.trim();
  if (!title) {
    throw new Error('Transaction title cannot be empty.');
  }

  const amountPaise = Math.round(input.amountPaise);
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error('Transaction amount must be a positive integer in paise.');
  }

  if (input.type !== 'income' && input.type !== 'expense') {
    throw new Error('Transaction type must be either "income" or "expense".');
  }

  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const createdAt = Date.now();
  const note = input.note?.trim() || null;

  await db.runAsync(
    `INSERT INTO transactions (
      id, type, amount_paise, category_id, category_name, category_icon, title, date, created_at, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.type,
      amountPaise,
      input.categoryId,
      input.categoryName,
      input.categoryIcon,
      title,
      input.date,
      createdAt,
      note,
    ]
  );

  return {
    id,
    type: input.type,
    amountPaise,
    amount: amountPaise / 100,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    categoryIcon: input.categoryIcon,
    title,
    date: input.date,
    createdAt,
    note: note || undefined,
  };
}

/**
 * Updates an existing transaction in SQLite using parameterized queries.
 * Validates input strictly using identical rules to new transactions.
 */
export async function updateTransaction(input: UpdateTransactionInput): Promise<Transaction> {
  const db = await getDatabase();

  const title = input.title.trim();
  if (!title) {
    throw new Error('Transaction title cannot be empty.');
  }

  const amountPaise = Math.round(input.amountPaise);
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error('Transaction amount must be a positive integer in paise.');
  }

  if (input.type !== 'income' && input.type !== 'expense') {
    throw new Error('Transaction type must be either "income" or "expense".');
  }

  const note = input.note?.trim() || null;

  const result = await db.runAsync(
    `UPDATE transactions SET
      type = ?,
      amount_paise = ?,
      category_id = ?,
      category_name = ?,
      category_icon = ?,
      title = ?,
      date = ?,
      note = ?
    WHERE id = ?;`,
    [
      input.type,
      amountPaise,
      input.categoryId,
      input.categoryName,
      input.categoryIcon,
      title,
      input.date,
      note,
      input.id,
    ]
  );

  if (result.changes === 0) {
    throw new Error(`Transaction with ID "${input.id}" not found.`);
  }

  return {
    id: input.id,
    type: input.type,
    amountPaise,
    amount: amountPaise / 100,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    categoryIcon: input.categoryIcon,
    title,
    date: input.date,
    createdAt: Date.now(),
    note: note || undefined,
  };
}

/**
 * Fetches a single transaction by its unique ID.
 */
export async function getTransactionById(id: string): Promise<Transaction | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE id = ?;',
    [id]
  );
  return row ? mapRowToTransaction(row) : null;
}

/**
 * Builds where-clause and parameters for queries based on TransactionQueryFilters.
 */
function buildQueryFilterClause(filters: TransactionQueryFilters = {}): {
  whereClause: string;
  params: any[];
} {
  const { type = 'all', searchQuery, categoryId, startDate, endDate } = filters;
  const conditions: string[] = ['1=1'];
  const params: any[] = [];

  if (type === 'income' || type === 'expense') {
    conditions.push('type = ?');
    params.push(type);
  }

  if (categoryId && categoryId !== 'all') {
    conditions.push('category_id = ?');
    params.push(categoryId);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const term = `%${searchQuery.trim()}%`;
    conditions.push('(title LIKE ? OR (note IS NOT NULL AND note LIKE ?))');
    params.push(term, term);
  }

  if (startDate && startDate.trim().length > 0) {
    conditions.push('date >= ?');
    params.push(startDate.trim());
  }

  if (endDate && endDate.trim().length > 0) {
    conditions.push('date <= ?');
    params.push(endDate.trim());
  }

  return {
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    params,
  };
}

/**
 * Fetches transactions from SQLite using parameterized queries.
 * Supports filtering by type, category, date range, and text search across title and description.
 * Results are sorted in descending date order, then creation order.
 */
export async function getTransactions(options: TransactionQueryFilters = {}): Promise<Transaction[]> {
  const db = await getDatabase();
  const { limit, offset } = options;

  const { whereClause, params } = buildQueryFilterClause(options);

  let query = `SELECT * FROM transactions ${whereClause} ORDER BY date DESC, created_at DESC`;

  if (limit && limit > 0) {
    query += ' LIMIT ?';
    params.push(limit);
    if (offset && offset > 0) {
      query += ' OFFSET ?';
      params.push(offset);
    }
  }

  const rows = await db.getAllAsync<TransactionRow>(query, params);
  return rows.map(mapRowToTransaction);
}

/**
 * Calculates aggregate totals (income, expense, net, count) matching the specified query filters.
 */
export async function getFilteredTotals(filters: TransactionQueryFilters = {}): Promise<{
  totalIncomePaise: number;
  totalExpensePaise: number;
  netPaise: number;
  count: number;
}> {
  const db = await getDatabase();
  const { whereClause, params } = buildQueryFilterClause(filters);

  const rows = await db.getAllAsync<{ type: TransactionType; total_paise: number }>(
    `SELECT type, COALESCE(SUM(amount_paise), 0) as total_paise
     FROM transactions
     ${whereClause}
     GROUP BY type;`,
    params
  );

  let totalIncomePaise = 0;
  let totalExpensePaise = 0;
  for (const r of rows) {
    if (r.type === 'income') totalIncomePaise = r.total_paise;
    if (r.type === 'expense') totalExpensePaise = r.total_paise;
  }

  const countRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM transactions ${whereClause};`,
    params
  );

  return {
    totalIncomePaise,
    totalExpensePaise,
    netPaise: totalIncomePaise - totalExpensePaise,
    count: countRow?.count || 0,
  };
}

/**
 * Computes dashboard financial metrics directly from SQLite:
 * - All-time Net Cashflow (recorded income minus recorded expenses)
 * - Current Month Inflow
 * - Current Month Outflow
 * - Current Month Net Cashflow
 * - Total transaction count
 */
export async function getSummaryMetrics(targetMonthKey?: string): Promise<SummaryMetrics> {
  const db = await getDatabase();
  const monthKey = targetMonthKey || getCurrentMonthKey();

  // 1. All-time sums
  const allTimeRows = await db.getAllAsync<{ type: TransactionType; total_paise: number }>(
    `SELECT type, COALESCE(SUM(amount_paise), 0) as total_paise 
     FROM transactions 
     GROUP BY type;`
  );

  let totalIncomePaise = 0;
  let totalExpensePaise = 0;
  for (const r of allTimeRows) {
    if (r.type === 'income') totalIncomePaise = r.total_paise;
    if (r.type === 'expense') totalExpensePaise = r.total_paise;
  }

  // 2. Monthly sums for targetMonthKey (e.g. '2026-10%')
  const monthlyRows = await db.getAllAsync<{ type: TransactionType; total_paise: number }>(
    `SELECT type, COALESCE(SUM(amount_paise), 0) as total_paise 
     FROM transactions 
     WHERE date LIKE ? 
     GROUP BY type;`,
    [`${monthKey}%`]
  );

  let monthlyIncomePaise = 0;
  let monthlyExpensePaise = 0;
  for (const r of monthlyRows) {
    if (r.type === 'income') monthlyIncomePaise = r.total_paise;
    if (r.type === 'expense') monthlyExpensePaise = r.total_paise;
  }

  // 3. Count
  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions;'
  );
  const transactionCount = countRow?.count || 0;

  const netCashflow = (totalIncomePaise - totalExpensePaise) / 100;
  const monthlyIncome = monthlyIncomePaise / 100;
  const monthlyExpense = monthlyExpensePaise / 100;
  const monthlyNet = (monthlyIncomePaise - monthlyExpensePaise) / 100;

  return {
    netCashflow,
    monthlyIncome,
    monthlyExpense,
    monthlyNet,
    transactionCount,
  };
}

/**
 * Deletes a single transaction by ID using parameterized query.
 */
export async function deleteTransaction(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
  return result.changes > 0;
}

/**
 * Clears all transactions from the SQLite database.
 */
export async function clearAllTransactions(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions;');
}

/**
 * Optional helper to insert demonstration sample records for testing purposes only
 */
export async function seedSampleTransactions(): Promise<void> {
  const sampleData: NewTransactionInput[] = [
    {
      title: 'Monthly Salary Credit',
      amountPaise: 8700000,
      type: 'income',
      categoryId: 'salary',
      categoryName: 'Salary',
      categoryIcon: '💼',
      date: '2026-10-01',
      note: 'October salary net credit',
    },
    {
      title: 'Broadband Fiber Internet',
      amountPaise: 119900,
      type: 'expense',
      categoryId: 'utilities',
      categoryName: 'Bills & Utilities',
      categoryIcon: '⚡',
      date: '2026-10-03',
      note: '300 Mbps monthly plan',
    },
    {
      title: 'Pharmacy & Vitamins',
      amountPaise: 98000,
      type: 'expense',
      categoryId: 'health',
      categoryName: 'Health & Medical',
      categoryIcon: '💊',
      date: '2026-10-14',
      note: 'Prescription refill',
    },
    {
      title: 'Weekend Dining & Coffee',
      amountPaise: 142000,
      type: 'expense',
      categoryId: 'dining',
      categoryName: 'Dining & Cafes',
      categoryIcon: '☕',
      date: '2026-10-16',
      note: 'Dinner with team',
    },
    {
      title: 'Electricity Bill (BESCOM)',
      amountPaise: 218000,
      type: 'expense',
      categoryId: 'utilities',
      categoryName: 'Bills & Utilities',
      categoryIcon: '⚡',
      date: '2026-10-17',
      note: 'September billing cycle',
    },
    {
      title: 'Fuel - Shell Station',
      amountPaise: 185000,
      type: 'expense',
      categoryId: 'transport',
      categoryName: 'Fuel & Transit',
      categoryIcon: '⛽',
      date: '2026-10-18',
      note: 'Full tank petrol',
    },
    {
      title: 'Client Wire - Mobile App',
      amountPaise: 2500000,
      type: 'income',
      categoryId: 'freelance',
      categoryName: 'Freelance & Side',
      categoryIcon: '💻',
      date: '2026-10-19',
      note: 'Milestone 2 payout',
    },
    {
      title: 'Supermarket Groceries',
      amountPaise: 345000,
      type: 'expense',
      categoryId: 'groceries',
      categoryName: 'Groceries',
      categoryIcon: '🛒',
      date: '2026-10-19',
      note: 'Weekly provisions & dairy',
    },
  ];

  for (const item of sampleData) {
    await insertTransaction(item);
  }
}

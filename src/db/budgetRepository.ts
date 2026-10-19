import { getDatabase } from './database';
import { CATEGORIES } from '../data/mockTransactions';
import {
  BudgetInput,
  BudgetPeriodType,
  BudgetProgress,
  BudgetRecord,
  BudgetsScreenData,
  BudgetStatus,
  OVERALL_BUDGET_CATEGORY_ID,
  PeriodInfo,
} from '../types/budget';
import { Category } from '../types/transaction';

interface BudgetRow {
  id: string;
  period_type: BudgetPeriodType;
  period_start_date: string;
  category_id: string;
  amount_paise: number;
  created_at: number;
  updated_at: number;
}

/**
 * Maps a SQLite database row to a strongly typed BudgetRecord.
 */
function mapRowToBudget(row: BudgetRow): BudgetRecord {
  return {
    id: row.id,
    periodType: row.period_type,
    periodStartDate: row.period_start_date,
    categoryId: row.category_id,
    amountPaise: row.amount_paise,
    amount: row.amount_paise / 100,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Inserts or updates a budget record in SQLite using parameterized queries.
 * Validates input: amount must be an integer > 0 in paise.
 * Uses ON CONFLICT to cleanly update existing budgets without duplicate records.
 */
export async function upsertBudget(input: BudgetInput): Promise<BudgetRecord> {
  const db = await getDatabase();

  const amountPaise = Math.round(input.amountPaise);
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error('Budget amount must be a positive integer in paise.');
  }

  if (input.periodType !== 'weekly' && input.periodType !== 'monthly') {
    throw new Error('Budget period type must be "weekly" or "monthly".');
  }

  const categoryId = input.categoryId.trim();
  if (!categoryId) {
    throw new Error('Category ID cannot be empty.');
  }

  const periodStartDate = input.periodStartDate.trim();
  if (!periodStartDate) {
    throw new Error('Period start date cannot be empty.');
  }

  const id = `bgt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO budgets (
      id, period_type, period_start_date, category_id, amount_paise, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(period_type, period_start_date, category_id) DO UPDATE SET
      amount_paise = excluded.amount_paise,
      updated_at = excluded.updated_at;`,
    [
      id,
      input.periodType,
      periodStartDate,
      categoryId,
      amountPaise,
      now,
      now,
    ]
  );

  const savedRow = await db.getFirstAsync<BudgetRow>(
    `SELECT * FROM budgets 
     WHERE period_type = ? AND period_start_date = ? AND category_id = ?;`,
    [input.periodType, periodStartDate, categoryId]
  );

  if (!savedRow) {
    throw new Error('Failed to retrieve saved budget record.');
  }

  return mapRowToBudget(savedRow);
}

/**
 * Deletes a single budget record by its unique ID.
 */
export async function deleteBudget(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM budgets WHERE id = ?;', [id]);
  return result.changes > 0;
}

/**
 * Computes status, percentage used, and remaining amounts for a budget.
 * Guards against division by zero.
 */
function calculateProgress(
  budget: BudgetRecord,
  spentPaise: number,
  categoryName?: string,
  categoryIcon?: string
): BudgetProgress {
  const remainingPaise = budget.amountPaise - spentPaise;
  const percentageUsed =
    budget.amountPaise > 0
      ? Math.round((spentPaise / budget.amountPaise) * 100)
      : 0;

  let status: BudgetStatus = 'normal';
  if (spentPaise > budget.amountPaise) {
    status = 'exceeded';
  } else if (percentageUsed >= 80) {
    status = 'warning';
  }

  return {
    budget,
    spentPaise,
    spent: spentPaise / 100,
    remainingPaise,
    remaining: remainingPaise / 100,
    percentageUsed,
    status,
    categoryName,
    categoryIcon,
  };
}

/**
 * Loads all budgets and actual expense transactions for the specified period.
 * Calculates spending, percentages, remaining balances, and warning states.
 */
export async function getBudgetDataForPeriod(
  period: PeriodInfo
): Promise<BudgetsScreenData> {
  const db = await getDatabase();

  // 1. Fetch all budgets registered for this period
  const budgetRows = await db.getAllAsync<BudgetRow>(
    `SELECT * FROM budgets 
     WHERE period_type = ? AND period_start_date = ?;`,
    [period.type, period.startDate]
  );
  const budgets = budgetRows.map(mapRowToBudget);

  // 2. Fetch total expense spending in this date range (income excluded!)
  const totalExpenseRow = await db.getFirstAsync<{ total_spent: number }>(
    `SELECT COALESCE(SUM(amount_paise), 0) as total_spent 
     FROM transactions 
     WHERE type = 'expense' AND date >= ? AND date <= ?;`,
    [period.startDate, period.endDate]
  );
  const overallSpentPaise = totalExpenseRow?.total_spent || 0;

  // 3. Fetch category expense spending in this date range
  const categoryExpenseRows = await db.getAllAsync<{
    category_id: string;
    category_spent: number;
  }>(
    `SELECT category_id, COALESCE(SUM(amount_paise), 0) as category_spent 
     FROM transactions 
     WHERE type = 'expense' AND date >= ? AND date <= ? 
     GROUP BY category_id;`,
    [period.startDate, period.endDate]
  );

  const categorySpendingMap = new Map<string, number>();
  for (const row of categoryExpenseRows) {
    categorySpendingMap.set(row.category_id, row.category_spent);
  }

  // 4. Separate overall budget from category budgets
  let overallBudgetProgress: BudgetProgress | null = null;
  const categoryBudgetProgressList: BudgetProgress[] = [];

  for (const bgt of budgets) {
    if (bgt.categoryId === OVERALL_BUDGET_CATEGORY_ID) {
      overallBudgetProgress = calculateProgress(
        bgt,
        overallSpentPaise,
        'Overall Budget',
        '📊'
      );
    } else {
      const spentPaise = categorySpendingMap.get(bgt.categoryId) || 0;
      const matchedCategory = CATEGORIES.find((c) => c.id === bgt.categoryId);
      categoryBudgetProgressList.push(
        calculateProgress(
          bgt,
          spentPaise,
          matchedCategory?.name || bgt.categoryId,
          matchedCategory?.icon || '🏷️'
        )
      );
    }
  }

  // Sort category budgets: exceeded first, then warning, then highest percentage used
  categoryBudgetProgressList.sort((a, b) => {
    if (a.status === 'exceeded' && b.status !== 'exceeded') return -1;
    if (b.status === 'exceeded' && a.status !== 'exceeded') return 1;
    if (a.status === 'warning' && b.status === 'normal') return -1;
    if (b.status === 'warning' && a.status === 'normal') return 1;
    return b.percentageUsed - a.percentageUsed;
  });

  // 5. Determine which expense categories don't have a budget set in this period yet
  const configuredCategoryIds = new Set(
    categoryBudgetProgressList.map((cb) => cb.budget.categoryId)
  );
  const availableCategories = CATEGORIES.filter(
    (c) =>
      (c.type === 'expense' || c.type === 'both') &&
      !configuredCategoryIds.has(c.id)
  );

  return {
    period,
    overallBudget: overallBudgetProgress,
    overallSpentPaise,
    categoryBudgets: categoryBudgetProgressList,
    availableCategories,
  };
}

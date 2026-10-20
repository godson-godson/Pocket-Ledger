import { getDatabase } from './database';
import { CATEGORIES } from '../data/mockTransactions';
import { PeriodInfo } from '../types/budget';
import {
  CategorySpendingItem,
  MonthlyTrendItem,
  PeriodFinancialSummary,
  ReportScreenData,
} from '../types/report';
import { getRecentSixMonths } from '../utils/budgetPeriods';

interface AggregatedTypeRow {
  type: 'income' | 'expense';
  total_paise: number;
  tx_count: number;
}

interface CategorySpendingRow {
  category_id: string;
  category_name: string;
  category_icon: string;
  total_paise: number;
  tx_count: number;
}

interface MonthlyTrendRow {
  month_key: string;
  type: 'income' | 'expense';
  total_paise: number;
  tx_count: number;
}

/**
 * Loads aggregated report data for the specified reporting period:
 * 1. Financial summary (Income, Expenses, Net Cash Flow, Counts)
 * 2. Category spending analysis for expenses (sorted by highest spending first)
 * 3. Monthly trends for the latest six calendar months
 *
 * Uses parameterized SQLite queries directly to prevent fetching raw transactions into memory.
 */
export async function getReportDataForPeriod(
  period: PeriodInfo
): Promise<ReportScreenData> {
  const db = await getDatabase();

  // 1. Financial Summary for selected period (income & expense sums and counts)
  const summaryRows = await db.getAllAsync<AggregatedTypeRow>(
    `SELECT 
       type,
       COALESCE(SUM(amount_paise), 0) as total_paise,
       COUNT(*) as tx_count
     FROM transactions
     WHERE date >= ? AND date <= ?
     GROUP BY type;`,
    [period.startDate, period.endDate]
  );

  let totalIncomePaise = 0;
  let incomeCount = 0;
  let totalExpensePaise = 0;
  let expenseCount = 0;

  for (const row of summaryRows) {
    if (row.type === 'income') {
      totalIncomePaise = row.total_paise;
      incomeCount = row.tx_count;
    } else if (row.type === 'expense') {
      totalExpensePaise = row.total_paise;
      expenseCount = row.tx_count;
    }
  }

  const netCashflowPaise = totalIncomePaise - totalExpensePaise;
  const totalCount = incomeCount + expenseCount;

  const summary: PeriodFinancialSummary = {
    totalIncomePaise,
    totalExpensePaise,
    netCashflowPaise,
    totalIncome: totalIncomePaise / 100,
    totalExpense: totalExpensePaise / 100,
    netCashflow: netCashflowPaise / 100,
    incomeCount,
    expenseCount,
    totalCount,
  };

  // 2. Category Breakdown for expenses in this period (Income strictly excluded)
  const categoryRows = await db.getAllAsync<CategorySpendingRow>(
    `SELECT 
       category_id,
       category_name,
       category_icon,
       COALESCE(SUM(amount_paise), 0) as total_paise,
       COUNT(*) as tx_count
     FROM transactions
     WHERE type = 'expense' AND date >= ? AND date <= ?
     GROUP BY category_id
     ORDER BY total_paise DESC;`,
    [period.startDate, period.endDate]
  );

  const categories: CategorySpendingItem[] = categoryRows.map((row) => {
    const matchedCategory = CATEGORIES.find((c) => c.id === row.category_id);
    const percentage =
      totalExpensePaise > 0
        ? Math.round((row.total_paise / totalExpensePaise) * 1000) / 10
        : 0;

    return {
      categoryId: row.category_id,
      categoryName: row.category_name || matchedCategory?.name || row.category_id,
      categoryIcon: row.category_icon || matchedCategory?.icon || '🏷️',
      amountPaise: row.total_paise,
      amount: row.total_paise / 100,
      percentage,
      transactionCount: row.tx_count,
    };
  });

  // 3. Monthly Trends for the latest six calendar months
  const recentMonths = getRecentSixMonths();
  const earliestStart = recentMonths[0].startDate;
  const latestEnd = recentMonths[recentMonths.length - 1].endDate;

  const trendRows = await db.getAllAsync<MonthlyTrendRow>(
    `SELECT 
       substr(date, 1, 7) as month_key,
       type,
       COALESCE(SUM(amount_paise), 0) as total_paise,
       COUNT(*) as tx_count
     FROM transactions
     WHERE date >= ? AND date <= ?
     GROUP BY month_key, type;`,
    [earliestStart, latestEnd]
  );

  const monthlyTrends: MonthlyTrendItem[] = recentMonths.map((m) => {
    let incomePaise = 0;
    let expensePaise = 0;
    let txCount = 0;

    for (const r of trendRows) {
      if (r.month_key === m.monthKey) {
        if (r.type === 'income') {
          incomePaise = r.total_paise;
          txCount += r.tx_count;
        } else if (r.type === 'expense') {
          expensePaise = r.total_paise;
          txCount += r.tx_count;
        }
      }
    }

    const netPaise = incomePaise - expensePaise;

    return {
      monthKey: m.monthKey,
      startDate: m.startDate,
      endDate: m.endDate,
      label: m.label,
      shortLabel: m.shortLabel,
      year: m.year,
      incomePaise,
      expensePaise,
      netPaise,
      income: incomePaise / 100,
      expense: expensePaise / 100,
      net: netPaise / 100,
      hasTransactions: txCount > 0,
      transactionCount: txCount,
      isCurrent: m.isCurrent,
    };
  });

  return {
    period,
    summary,
    categories,
    monthlyTrends,
  };
}

import { BudgetPeriodType, PeriodInfo } from './budget';

export type ReportPeriodType = BudgetPeriodType;

export interface PeriodFinancialSummary {
  totalIncomePaise: number;
  totalExpensePaise: number;
  netCashflowPaise: number; // totalIncomePaise - totalExpensePaise
  totalIncome: number; // in rupees (paise / 100)
  totalExpense: number; // in rupees (paise / 100)
  netCashflow: number; // in rupees (paise / 100)
  incomeCount: number;
  expenseCount: number;
  totalCount: number;
}

export interface CategorySpendingItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amountPaise: number;
  amount: number; // in rupees
  percentage: number; // 0 to 100
  transactionCount: number;
}

export interface MonthlyTrendItem {
  monthKey: string; // YYYY-MM
  startDate: string; // YYYY-MM-01
  endDate: string; // YYYY-MM-DD
  label: string; // e.g. "October 2026"
  shortLabel: string; // e.g. "Oct"
  year: number;
  incomePaise: number;
  expensePaise: number;
  netPaise: number; // incomePaise - expensePaise
  income: number; // in rupees
  expense: number; // in rupees
  net: number; // in rupees
  hasTransactions: boolean;
  transactionCount: number;
  isCurrent: boolean;
}

export interface ReportScreenData {
  period: PeriodInfo;
  summary: PeriodFinancialSummary;
  categories: CategorySpendingItem[];
  monthlyTrends: MonthlyTrendItem[];
}

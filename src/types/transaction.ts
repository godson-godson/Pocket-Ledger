export type TransactionType = 'expense' | 'income';

export type CategoryId =
  | 'salary'
  | 'freelance'
  | 'groceries'
  | 'dining'
  | 'utilities'
  | 'transport'
  | 'health'
  | 'shopping'
  | 'entertainment'
  | 'investment'
  | 'general';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  type: TransactionType | 'both';
  color?: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number; // in rupees for presentation (derived from amountPaise / 100)
  amountPaise: number; // integer number of paise stored in SQLite
  type: TransactionType;
  categoryId: CategoryId;
  categoryName: string;
  categoryIcon: string;
  date: string; // ISO date string (YYYY-MM-DD or full ISO)
  createdAt: number; // timestamp in ms
  note?: string;
}

export interface NewTransactionInput {
  title: string;
  amountPaise: number; // integer paise > 0
  type: TransactionType;
  categoryId: CategoryId;
  categoryName: string;
  categoryIcon: string;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface UpdateTransactionInput {
  id: string;
  title: string;
  amountPaise: number; // integer paise > 0
  type: TransactionType;
  categoryId: CategoryId;
  categoryName: string;
  categoryIcon: string;
  date: string; // YYYY-MM-DD
  note?: string;
}

export type DateRangePreset = 'all' | 'this_month' | 'last_month' | 'last_30_days' | 'custom';

export interface TransactionQueryFilters {
  type?: FilterType;
  searchQuery?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface SummaryMetrics {
  netCashflow: number; // Net total (recorded income - recorded expenses in rupees)
  monthlyIncome: number; // Current month recorded income in rupees
  monthlyExpense: number; // Current month recorded expenses in rupees
  monthlyNet: number; // Current month net cash flow in rupees
  transactionCount: number; // Total transactions recorded
}

export type FilterType = 'all' | 'expense' | 'income';

import { Category, CategoryId } from './transaction';

export type BudgetPeriodType = 'weekly' | 'monthly';

export const OVERALL_BUDGET_CATEGORY_ID = '__overall__';

export interface BudgetRecord {
  id: string;
  periodType: BudgetPeriodType;
  periodStartDate: string; // YYYY-MM-DD
  categoryId: string; // '__overall__' or CategoryId
  amountPaise: number; // integer paise > 0
  amount: number; // in rupees (amountPaise / 100)
  createdAt: number;
  updatedAt: number;
}

export interface BudgetInput {
  periodType: BudgetPeriodType;
  periodStartDate: string; // YYYY-MM-DD
  categoryId: string; // '__overall__' or CategoryId
  amountPaise: number; // integer paise > 0
}

export interface PeriodInfo {
  type: BudgetPeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  displayLabel: string; // e.g. "19 Oct - 25 Oct 2026" or "October 2026"
  isCurrent: boolean;
}

export type BudgetStatus = 'normal' | 'warning' | 'exceeded';

export interface BudgetProgress {
  budget: BudgetRecord;
  spentPaise: number;
  spent: number; // in rupees
  remainingPaise: number; // budget.amountPaise - spentPaise (negative indicates overspending)
  remaining: number; // in rupees
  percentageUsed: number; // rounded percentage, e.g. 75, 84, 120
  status: BudgetStatus; // 'normal' (<80%), 'warning' (80-100%), 'exceeded' (>100%)
  categoryName?: string;
  categoryIcon?: string;
}

export interface BudgetsScreenData {
  period: PeriodInfo;
  overallBudget: BudgetProgress | null;
  overallSpentPaise: number;
  categoryBudgets: BudgetProgress[];
  availableCategories: Category[];
}

import { BudgetPeriodType, PeriodInfo } from '../types/budget';

/**
 * Formats a Date object into a YYYY-MM-DD string using local calendar coordinates.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 */
export function parseLocalDate(dateString: string): Date {
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

/**
 * Formats a human-readable label for a weekly date range (Monday - Sunday).
 * e.g., "19 Oct - 25 Oct 2026" or "28 Dec 2026 - 03 Jan 2027"
 */
function formatWeekRangeLabel(monday: Date, sunday: Date): string {
  const monDay = monday.getDate();
  const monMonth = monday.toLocaleDateString('en-IN', { month: 'short' });
  const monYear = monday.getFullYear();

  const sunDay = sunday.getDate();
  const sunMonth = sunday.toLocaleDateString('en-IN', { month: 'short' });
  const sunYear = sunday.getFullYear();

  if (monYear !== sunYear) {
    return `${monDay} ${monMonth} ${monYear} – ${sunDay} ${sunMonth} ${sunYear}`;
  }

  if (monMonth !== sunMonth) {
    return `${monDay} ${monMonth} – ${sunDay} ${sunMonth} ${sunYear}`;
  }

  return `${monDay} – ${sunDay} ${sunMonth} ${sunYear}`;
}

/**
 * Calculates the weekly period (Monday through Sunday) for a given reference date.
 * If no date is provided, defaults to the current device date.
 */
export function getWeeklyPeriod(baseDate: Date = new Date()): PeriodInfo {
  const cleanDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );

  const dayOfWeek = cleanDate.getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(cleanDate);
  monday.setDate(cleanDate.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startStr = formatLocalDate(monday);
  const endStr = formatLocalDate(sunday);

  const today = new Date();
  const currentWeekStart = getWeeklyPeriodOnlyStart(today);
  const isCurrent = startStr === currentWeekStart;

  return {
    type: 'weekly',
    startDate: startStr,
    endDate: endStr,
    displayLabel: formatWeekRangeLabel(monday, sunday),
    isCurrent,
  };
}

/**
 * Fast helper to obtain only the Monday string for today
 */
function getWeeklyPeriodOnlyStart(baseDate: Date): string {
  const cleanDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );
  const day = cleanDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(cleanDate);
  monday.setDate(cleanDate.getDate() + diffToMonday);
  return formatLocalDate(monday);
}

/**
 * Shifts a weekly period forward or backward by a number of weeks.
 * @param currentStartDateStr - The Monday start date (YYYY-MM-DD)
 * @param deltaWeeks - Positive for future weeks, negative for previous weeks
 */
export function shiftWeeklyPeriod(
  currentStartDateStr: string,
  deltaWeeks: number
): PeriodInfo {
  const currentMonday = parseLocalDate(currentStartDateStr);
  const targetDate = new Date(currentMonday);
  targetDate.setDate(currentMonday.getDate() + deltaWeeks * 7);
  return getWeeklyPeriod(targetDate);
}

/**
 * Calculates the monthly period (1st of month through last day of month)
 * for a given reference date.
 */
export function getMonthlyPeriod(baseDate: Date = new Date()): PeriodInfo {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0-indexed

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0); // 0th day of next month is last day of current month

  const startStr = formatLocalDate(firstDay);
  const endStr = formatLocalDate(lastDay);

  const today = new Date();
  const isCurrent =
    year === today.getFullYear() && month === today.getMonth();

  const label = firstDay.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  return {
    type: 'monthly',
    startDate: startStr,
    endDate: endStr,
    displayLabel: label,
    isCurrent,
  };
}

/**
 * Shifts a monthly period forward or backward by a number of months.
 * @param currentStartDateStr - The month's start date (YYYY-MM-01)
 * @param deltaMonths - Positive for future months, negative for past months
 */
export function shiftMonthlyPeriod(
  currentStartDateStr: string,
  deltaMonths: number
): PeriodInfo {
  const currentFirstDay = parseLocalDate(currentStartDateStr);
  const targetDate = new Date(
    currentFirstDay.getFullYear(),
    currentFirstDay.getMonth() + deltaMonths,
    1
  );
  return getMonthlyPeriod(targetDate);
}

/**
 * Returns the appropriate PeriodInfo based on periodType.
 */
export function getDefaultPeriod(periodType: BudgetPeriodType): PeriodInfo {
  return periodType === 'weekly' ? getWeeklyPeriod() : getMonthlyPeriod();
}

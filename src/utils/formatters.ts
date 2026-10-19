interface FormatINROptions {
  showDecimals?: boolean | 'auto';
  sign?: boolean;
  forceSign?: boolean;
}

/**
 * Validates and converts an amount in Indian Rupees (string or number)
 * into an integer number of paise.
 * Rejects 0, negatives, malformed strings, or > 2 decimal places.
 * Returns null if invalid.
 */
export function rupeesToPaise(input: string | number): number | null {
  if (typeof input === 'number') {
    if (isNaN(input) || input <= 0 || !isFinite(input)) return null;
    return Math.round(input * 100);
  }
  if (typeof input !== 'string') return null;

  const clean = input.trim().replace(/,/g, '');
  // Allows integers (e.g. 500) or up to 2 decimal places (e.g. 500.5 or 500.50)
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;

  const num = parseFloat(clean);
  if (isNaN(num) || num <= 0 || !isFinite(num)) return null;

  return Math.round(num * 100);
}

/**
 * Converts integer paise to rupees (e.g. 10050 -> 100.5)
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Formats a number according to the Indian Rupee numbering system (Lakhs, Crores).
 * e.g., 142850 -> ₹1,42,850
 *       74500.5 -> ₹74,500.50
 *       -1850 -> -₹1,850
 */
export function formatINR(amount: number, options: FormatINROptions = {}): string {
  const { showDecimals = false, sign = false, forceSign = false } = options;
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);

  let decimalsCount = 0;
  if (showDecimals === true) {
    decimalsCount = 2;
  } else if (showDecimals === 'auto') {
    decimalsCount = absVal % 1 !== 0 ? 2 : 0;
  }

  let formatted = '';
  try {
    formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimalsCount,
      maximumFractionDigits: decimalsCount,
    }).format(absVal);
  } catch {
    // Custom fallback for Indian numbering system
    const [intPart, decPart] = absVal.toFixed(decimalsCount).split('.');
    const lastThree = intPart.slice(-3);
    const otherNumbers = intPart.slice(0, -3);
    const res =
      otherNumbers !== ''
        ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;
    formatted = decPart ? `${res}.${decPart}` : res;
  }

  let prefix = '₹';
  if (isNegative) {
    prefix = '-₹';
  } else if (sign || forceSign) {
    if (amount > 0) {
      prefix = '+₹';
    }
  }

  return `${prefix}${formatted}`;
}

/**
 * Formats an amount given in integer paise into INR string
 */
export function formatPaiseINR(paise: number, options: FormatINROptions = {}): string {
  return formatINR(paise / 100, options);
}

/**
 * Formats date into readable string, e.g. "Today", "Yesterday", or "18 Oct 2026"
 */
export function formatDate(dateString: string): string {
  try {
    // Handle YYYY-MM-DD or full ISO
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return 'Today';
    }

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateString;
  }
}

/**
 * Validates whether a string is a valid YYYY-MM-DD date
 */
export function isValidDateString(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(`${str}T00:00:00`);
  return !isNaN(d.getTime());
}

/**
 * Returns today's date formatted as YYYY-MM-DD for storage and input defaults
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current month key formatted as YYYY-MM (e.g. "2026-10")
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns formatted month and year, e.g. "October 2026"
 */
export function formatCurrentMonth(): string {
  const now = new Date();
  return now.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Generates ISO/SQL-friendly YYYY-MM-DD date range presets
 */
export function getDateRangePresets() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const thisMonthStart = new Date(year, month, 1);
  const thisMonthEnd = new Date(year, month + 1, 0);

  const lastMonthStart = new Date(year, month - 1, 1);
  const lastMonthEnd = new Date(year, month, 0);

  const last30DaysStart = new Date(now);
  last30DaysStart.setDate(now.getDate() - 30);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    thisMonth: { start: format(thisMonthStart), end: format(thisMonthEnd) },
    lastMonth: { start: format(lastMonthStart), end: format(lastMonthEnd) },
    last30Days: { start: format(last30DaysStart), end: format(now) },
  };
}

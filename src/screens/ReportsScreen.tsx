import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { BudgetPeriodType, PeriodInfo } from '../types/budget';
import {
  CategorySpendingItem,
  MonthlyTrendItem,
  ReportScreenData,
} from '../types/report';
import { initDatabase } from '../db/database';
import { getReportDataForPeriod } from '../db/reportRepository';
import {
  getDefaultPeriod,
  shiftMonthlyPeriod,
  shiftWeeklyPeriod,
} from '../utils/budgetPeriods';
import { formatINR } from '../utils/formatters';

interface ReportsScreenProps {
  onNavigateToBudgets?: () => void;
  refreshTrigger?: number;
  onDataChanged?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  groceries: '#10B981',
  dining: '#F59E0B',
  transport: '#38BDF8',
  utilities: '#818CF8',
  shopping: '#EC4899',
  health: '#EF4444',
  entertainment: '#A855F7',
  investment: '#06B6D4',
  general: '#94A3B8',
};

const FALLBACK_COLORS = [
  '#10B981',
  '#38BDF8',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6',
  '#F97316',
  '#06B6D4',
];

function getCategoryColor(categoryId: string, index: number): string {
  return CATEGORY_COLORS[categoryId] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  onNavigateToBudgets,
  refreshTrigger = 0,
}) => {
  const [periodType, setPeriodType] = useState<BudgetPeriodType>('weekly');
  const [currentPeriod, setCurrentPeriod] = useState<PeriodInfo>(() =>
    getDefaultPeriod('weekly')
  );

  const [data, setData] = useState<ReportScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load report metrics directly from SQLite
  const loadReportData = useCallback(
    async (targetPeriod: PeriodInfo = currentPeriod) => {
      try {
        setDbError(null);
        await initDatabase();
        const reportData = await getReportDataForPeriod(targetPeriod);
        setData(reportData);
      } catch (err: any) {
        console.error('[ReportsScreen] Error fetching report data:', err);
        setDbError(err?.message || 'Failed to load reports from local database.');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [currentPeriod]
  );

  useEffect(() => {
    loadReportData(currentPeriod);
  }, [currentPeriod, refreshTrigger, loadReportData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReportData(currentPeriod);
  };

  // Switch between Weekly and Monthly views
  const handlePeriodTypeChange = (newType: BudgetPeriodType) => {
    if (newType === periodType) return;
    setPeriodType(newType);
    const newPeriod = getDefaultPeriod(newType);
    setCurrentPeriod(newPeriod);
  };

  // Navigate between previous/next periods
  const handleNavigatePeriod = (direction: -1 | 1) => {
    if (periodType === 'weekly') {
      const shifted = shiftWeeklyPeriod(currentPeriod.startDate, direction);
      setCurrentPeriod(shifted);
    } else {
      const shifted = shiftMonthlyPeriod(currentPeriod.startDate, direction);
      setCurrentPeriod(shifted);
    }
  };

  // Jump to today's week / month
  const handleJumpToCurrent = () => {
    const current = getDefaultPeriod(periodType);
    setCurrentPeriod(current);
  };

  // Max value in 6-month trends to scale trend bars proportionally
  const maxTrendAmount = React.useMemo(() => {
    if (!data?.monthlyTrends) return 1;
    let max = 0;
    for (const m of data.monthlyTrends) {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    }
    return max > 0 ? max : 1;
  }, [data?.monthlyTrends]);

  const summary = data?.summary;
  const categories = data?.categories || [];
  const trends = data?.monthlyTrends || [];
  const hasPeriodTransactions = Boolean(summary && summary.totalCount > 0);
  const isNetPositive = Boolean(summary && summary.netCashflow >= 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Financial Reports</Text>
            <View style={styles.sqliteBadge}>
              <View style={styles.sqliteDot} />
              <Text style={styles.sqliteBadgeText}>SQLITE</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Spending analytics & cash flow breakdown
          </Text>
        </View>
      </View>

      {/* Period Switcher (Weekly / Monthly) */}
      <View style={styles.periodSwitcherWrapper}>
        <View style={styles.periodSwitcher}>
          <TouchableOpacity
            style={[
              styles.periodSwitcherBtn,
              periodType === 'weekly' && styles.periodSwitcherBtnActive,
            ]}
            onPress={() => handlePeriodTypeChange('weekly')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodSwitcherText,
                periodType === 'weekly' && styles.periodSwitcherTextActive,
              ]}
            >
              Weekly Report
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodSwitcherBtn,
              periodType === 'monthly' && styles.periodSwitcherBtnActive,
            ]}
            onPress={() => handlePeriodTypeChange('monthly')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodSwitcherText,
                periodType === 'monthly' && styles.periodSwitcherTextActive,
              ]}
            >
              Monthly Report
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Period Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navArrowBtn}
          onPress={() => handleNavigatePeriod(-1)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.navArrowText}>◀</Text>
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={styles.navPeriodLabel}>{currentPeriod.displayLabel}</Text>
          {currentPeriod.isCurrent ? (
            <View style={styles.currentPill}>
              <Text style={styles.currentPillText}>
                CURRENT {periodType === 'weekly' ? 'WEEK' : 'MONTH'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleJumpToCurrent}
              style={styles.jumpPill}
              activeOpacity={0.7}
            >
              <Text style={styles.jumpPillText}>Jump to Today</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.navArrowBtn}
          onPress={() => handleNavigatePeriod(1)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.navArrowText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {dbError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Database Query Error</Text>
          <Text style={styles.errorMessage}>{dbError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadReportData(currentPeriod)}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
          <Text style={styles.loadingText}>Generating financial analytics...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.accentBlue}
              colors={[COLORS.accentBlue]}
            />
          }
        >
          {/* Quick link to Budgets module */}
          {onNavigateToBudgets && (
            <TouchableOpacity
              style={styles.budgetBanner}
              onPress={onNavigateToBudgets}
              activeOpacity={0.8}
            >
              <View style={styles.budgetBannerLeft}>
                <View style={styles.budgetBannerIconWrap}>
                  <Text style={styles.budgetBannerIcon}>◎</Text>
                </View>
                <View>
                  <Text style={styles.budgetBannerTitle}>Budgets & Targets</Text>
                  <Text style={styles.budgetBannerSubtitle}>
                    Manage weekly & monthly spending limits
                  </Text>
                </View>
              </View>
              <View style={styles.budgetBannerArrow}>
                <Text style={styles.budgetBannerArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* SECTION 1: FINANCIAL SUMMARY CARD */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>PERIOD FINANCIAL SUMMARY</Text>
            <Text style={styles.sectionSubtitle}>
              {periodType === 'weekly' ? 'Mon – Sun' : 'Calendar Month'}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            {/* Top decorative accent */}
            <View
              style={[
                styles.summaryCardAccent,
                {
                  backgroundColor: !hasPeriodTransactions
                    ? COLORS.borderLight
                    : isNetPositive
                    ? COLORS.accentGreen
                    : COLORS.accentRose,
                },
              ]}
            />

            <View style={styles.summaryCardContent}>
              <View style={styles.netCashflowHeader}>
                <Text style={styles.netLabel}>RECORDED NET CASH FLOW</Text>
                <View style={styles.disclaimerPill}>
                  <Text style={styles.disclaimerText}>Income − Expenses</Text>
                </View>
              </View>

              <Text
                style={[
                  styles.netAmount,
                  hasPeriodTransactions && {
                    color: isNetPositive
                      ? COLORS.textPrimary
                      : COLORS.accentRose,
                  },
                ]}
              >
                {!summary || summary.totalCount === 0
                  ? '₹0'
                  : formatINR(summary.netCashflow, {
                      showDecimals: 'auto',
                      sign: summary.netCashflow !== 0,
                    })}
              </Text>

              {/* Inflow vs Outflow Row */}
              <View style={styles.inflowOutflowGrid}>
                {/* Income */}
                <View style={styles.flowItem}>
                  <View style={styles.flowLabelRow}>
                    <View style={styles.flowDotIncome} />
                    <Text style={styles.flowLabel}>INCOME ({summary?.incomeCount || 0})</Text>
                  </View>
                  <Text style={styles.incomeAmount}>
                    {formatINR(summary?.totalIncome || 0, { showDecimals: 'auto' })}
                  </Text>
                </View>

                <View style={styles.flowDivider} />

                {/* Expenses */}
                <View style={styles.flowItem}>
                  <View style={styles.flowLabelRow}>
                    <View style={styles.flowDotExpense} />
                    <Text style={styles.flowLabel}>EXPENSES ({summary?.expenseCount || 0})</Text>
                  </View>
                  <Text style={styles.expenseAmount}>
                    {formatINR(summary?.totalExpense || 0, { showDecimals: 'auto' })}
                  </Text>
                </View>
              </View>

              {/* Ledger Scope Notice */}
              <View style={styles.scopeNoticeRow}>
                <Text style={styles.scopeNoticeText}>
                  ⓘ Reflects only transactions recorded in Pocket Ledger. Not an official bank balance or total wealth.
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 2: CATEGORY SPENDING ANALYSIS */}
          <View style={[styles.sectionHeaderRow, { marginTop: SPACING.xl }]}>
            <Text style={styles.sectionTitle}>EXPENSE BY CATEGORY</Text>
            {categories.length > 0 && (
              <Text style={styles.sectionSubtitle}>
                {categories.length} {categories.length === 1 ? 'category' : 'categories'}
              </Text>
            )}
          </View>

          {categories.length > 0 ? (
            <View style={styles.categoriesCard}>
              {/* Segmented Distribution Bar */}
              <View style={styles.segmentedBar}>
                {categories.map((cat, idx) => {
                  const color = getCategoryColor(cat.categoryId, idx);
                  const flexWidth = Math.max(cat.percentage, 2);
                  return (
                    <View
                      key={cat.categoryId}
                      style={[
                        styles.segmentedBarSegment,
                        {
                          backgroundColor: color,
                          flex: flexWidth,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {/* Itemized Categories List */}
              <View style={styles.categoryItemsContainer}>
                {categories.map((cat, idx) => {
                  const color = getCategoryColor(cat.categoryId, idx);

                  return (
                    <View key={cat.categoryId} style={styles.categoryItemRow}>
                      <View style={styles.categoryItemTop}>
                        {/* Icon and Name */}
                        <View style={styles.categoryIdentity}>
                          <View
                            style={[
                              styles.categoryIconCircle,
                              { backgroundColor: `${color}18`, borderColor: `${color}40` },
                            ]}
                          >
                            <Text style={styles.categoryIconText}>{cat.categoryIcon}</Text>
                          </View>
                          <View>
                            <Text style={styles.categoryItemName}>{cat.categoryName}</Text>
                            <Text style={styles.categoryItemCount}>
                              {cat.transactionCount} {cat.transactionCount === 1 ? 'entry' : 'entries'}
                            </Text>
                          </View>
                        </View>

                        {/* Amount & Percentage */}
                        <View style={styles.categoryAmountCol}>
                          <Text style={styles.categoryAmountText}>
                            {formatINR(cat.amount, { showDecimals: 'auto' })}
                          </Text>
                          <View
                            style={[
                              styles.categoryPercentagePill,
                              { backgroundColor: `${color}18`, borderColor: `${color}40` },
                            ]}
                          >
                            <Text style={[styles.categoryPercentageText, { color }]}>
                              {cat.percentage}%
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Individual Progress Bar */}
                      <View style={styles.categoryTrack}>
                        <View
                          style={[
                            styles.categoryFill,
                            {
                              width: `${Math.min(cat.percentage, 100)}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Total Expenses Summary Footer */}
              <View style={styles.categoriesFooter}>
                <Text style={styles.categoriesFooterLabel}>Total Period Expenses</Text>
                <Text style={styles.categoriesFooterAmount}>
                  {formatINR(summary?.totalExpense || 0, { showDecimals: 'auto' })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>≡</Text>
              <Text style={styles.emptyTitle}>No expense transactions</Text>
              <Text style={styles.emptySubtitle}>
                No expenses have been recorded for this {periodType === 'weekly' ? 'week' : 'month'}.
                Income transactions are excluded from expense-category breakdowns.
              </Text>
            </View>
          )}

          {/* SECTION 3: MONTHLY TRENDS (LAST 6 MONTHS) */}
          <View style={[styles.sectionHeaderRow, { marginTop: SPACING.xl }]}>
            <Text style={styles.sectionTitle}>6-MONTH MONTHLY TRENDS</Text>
            <Text style={styles.sectionSubtitle}>Recent History</Text>
          </View>

          <View style={styles.trendsCard}>
            {trends.map((m, idx) => {
              const incomeRatio = m.income / maxTrendAmount;
              const expenseRatio = m.expense / maxTrendAmount;
              const isLast = idx === trends.length - 1;

              return (
                <View
                  key={m.monthKey}
                  style={[
                    styles.trendMonthItem,
                    isLast && styles.trendMonthItemLast,
                    m.isCurrent && styles.trendMonthItemCurrent,
                  ]}
                >
                  {/* Month Header Row */}
                  <View style={styles.trendMonthHeader}>
                    <View style={styles.trendMonthTitleGroup}>
                      <Text
                        style={[
                          styles.trendMonthName,
                          m.isCurrent && styles.trendMonthNameCurrent,
                        ]}
                      >
                        {m.label}
                      </Text>
                      {m.isCurrent && (
                        <View style={styles.trendCurrentBadge}>
                          <Text style={styles.trendCurrentBadgeText}>CURRENT</Text>
                        </View>
                      )}
                    </View>

                    {/* Net Cash Flow for the Month */}
                    <Text
                      style={[
                        styles.trendMonthNet,
                        !m.hasTransactions
                          ? styles.trendMonthNetZero
                          : m.net >= 0
                          ? styles.trendMonthNetPositive
                          : styles.trendMonthNetNegative,
                      ]}
                    >
                      {!m.hasTransactions
                        ? '₹0'
                        : formatINR(m.net, { sign: m.net !== 0, showDecimals: 'auto' })}
                    </Text>
                  </View>

                  {m.hasTransactions ? (
                    <View style={styles.trendBarsArea}>
                      {/* Income Bar Row */}
                      <View style={styles.trendBarRow}>
                        <Text style={styles.trendBarTypeLabel}>In</Text>
                        <View style={styles.trendBarTrack}>
                          <View
                            style={[
                              styles.trendBarFillIncome,
                              {
                                width: `${Math.max(Math.round(incomeRatio * 100), m.income > 0 ? 3 : 0)}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.trendBarValueIncome}>
                          {formatINR(m.income)}
                        </Text>
                      </View>

                      {/* Expense Bar Row */}
                      <View style={styles.trendBarRow}>
                        <Text style={styles.trendBarTypeLabel}>Out</Text>
                        <View style={styles.trendBarTrack}>
                          <View
                            style={[
                              styles.trendBarFillExpense,
                              {
                                width: `${Math.max(Math.round(expenseRatio * 100), m.expense > 0 ? 3 : 0)}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.trendBarValueExpense}>
                          {formatINR(m.expense)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    /* Clear zero-state row */
                    <View style={styles.trendEmptyRow}>
                      <Text style={styles.trendEmptyText}>
                        No transactions recorded for this calendar month
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Footer Information */}
          <View style={styles.policyFooter}>
            <Text style={styles.policyText}>
              ⓘ Pocket Ledger performs analytical calculations offline via SQLite.
              Weekly summaries run Monday through Sunday, and monthly summaries cover full calendar months.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.sansMedium,
    letterSpacing: -0.5,
  },
  sqliteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentBlueBg,
    borderColor: COLORS.accentBlueBorder,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    gap: 5,
  },
  sqliteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentBlue,
  },
  sqliteBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentBlueLight,
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  periodSwitcherWrapper: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xs,
  },
  periodSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodSwitcherBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  periodSwitcherBtnActive: {
    backgroundColor: COLORS.accentBlue,
    borderWidth: 1,
    borderColor: COLORS.accentBlueLight,
  },
  periodSwitcherText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  periodSwitcherTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  navArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  navCenter: {
    alignItems: 'center',
    gap: 3,
  },
  navPeriodLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.sansMedium,
  },
  currentPill: {
    backgroundColor: COLORS.accentBlueBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.accentBlueBorder,
  },
  currentPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.accentBlueLight,
    letterSpacing: 0.5,
  },
  jumpPill: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  jumpPillText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  summaryCardAccent: {
    height: 3,
  },
  summaryCardContent: {
    padding: SPACING.lg,
  },
  netCashflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  netLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
  },
  disclaimerPill: {
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  disclaimerText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  netAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    letterSpacing: -0.8,
    marginBottom: SPACING.md,
  },
  inflowOutflowGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  flowItem: {
    flex: 1,
  },
  flowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  flowDotIncome: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentGreen,
  },
  flowDotExpense: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentRose,
  },
  flowLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentGreen,
    fontFamily: FONTS.mono,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentRose,
    fontFamily: FONTS.mono,
  },
  flowDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  scopeNoticeRow: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  scopeNoticeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
  categoriesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceElevated,
    marginBottom: SPACING.lg,
    gap: 2,
  },
  segmentedBarSegment: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  categoryItemsContainer: {
    gap: SPACING.md,
  },
  categoryItemRow: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  categoryIconCircle: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconText: {
    fontSize: 16,
  },
  categoryItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categoryItemCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  categoryAmountCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  categoryAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
  },
  categoryPercentagePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  categoryPercentageText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.mono,
  },
  categoryTrack: {
    height: 5,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  categoriesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  categoriesFooterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoriesFooterAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accentRose,
    fontFamily: FONTS.mono,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  trendsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  budgetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBlueBorder,
  },
  budgetBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  budgetBannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentBlueBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentBlueBorder,
  },
  budgetBannerIcon: {
    fontSize: 18,
  },
  budgetBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.sansMedium,
  },
  budgetBannerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  budgetBannerArrow: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetBannerArrowText: {
    color: COLORS.accentBlueLight,
    fontSize: 14,
    fontWeight: '700',
  },
  trendMonthItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  trendMonthItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  trendMonthItemCurrent: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  trendMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  trendMonthTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendMonthName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  trendMonthNameCurrent: {
    color: COLORS.accentBlueLight,
    fontWeight: '700',
  },
  trendCurrentBadge: {
    backgroundColor: COLORS.accentBlueBg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.accentBlueBorder,
  },
  trendCurrentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.accentBlueLight,
    letterSpacing: 0.5,
  },
  trendMonthNet: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.mono,
  },
  trendMonthNetPositive: {
    color: COLORS.accentGreen,
  },
  trendMonthNetNegative: {
    color: COLORS.accentRose,
  },
  trendMonthNetZero: {
    color: COLORS.textMuted,
  },
  trendBarsArea: {
    gap: 6,
    marginTop: 4,
  },
  trendBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  trendBarTypeLabel: {
    width: 22,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
  },
  trendBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  trendBarFillIncome: {
    height: '100%',
    backgroundColor: COLORS.accentGreen,
    borderRadius: RADIUS.pill,
  },
  trendBarFillExpense: {
    height: '100%',
    backgroundColor: COLORS.accentRose,
    borderRadius: RADIUS.pill,
  },
  trendBarValueIncome: {
    width: 72,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentGreen,
    fontFamily: FONTS.mono,
    textAlign: 'right',
  },
  trendBarValueExpense: {
    width: 72,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentRose,
    fontFamily: FONTS.mono,
    textAlign: 'right',
  },
  trendEmptyRow: {
    paddingVertical: 4,
  },
  trendEmptyText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  policyFooter: {
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.sm,
  },
  policyText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  errorContainer: {
    margin: SPACING.xl,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accentRoseBorder,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  errorEmoji: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentRose,
  },
  errorMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

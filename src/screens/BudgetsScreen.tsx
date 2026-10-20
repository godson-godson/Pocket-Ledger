import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import {
  BudgetInput,
  BudgetPeriodType,
  BudgetProgress,
  BudgetRecord,
  BudgetsScreenData,
  OVERALL_BUDGET_CATEGORY_ID,
  PeriodInfo,
} from '../types/budget';
import { BudgetModal } from '../components/BudgetModal';
import {
  deleteBudget,
  getBudgetDataForPeriod,
  upsertBudget,
} from '../db/budgetRepository';
import { initDatabase } from '../db/database';
import {
  getDefaultPeriod,
  shiftMonthlyPeriod,
  shiftWeeklyPeriod,
} from '../utils/budgetPeriods';
import { formatINR } from '../utils/formatters';

interface BudgetsScreenProps {
  onNavigateBack?: () => void;
  refreshTrigger?: number;
  onDataChanged?: () => void;
}

export const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
  onNavigateBack,
  refreshTrigger = 0,
  onDataChanged,
}) => {
  const [periodType, setPeriodType] = useState<BudgetPeriodType>('weekly');
  const [currentPeriod, setCurrentPeriod] = useState<PeriodInfo>(() =>
    getDefaultPeriod('weekly')
  );

  const [data, setData] = useState<BudgetsScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [targetBudget, setTargetBudget] = useState<BudgetRecord | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string | undefined>(
    undefined
  );

  // Load budgets and actual transaction spending for current period
  const loadBudgetData = useCallback(
    async (targetPeriod: PeriodInfo = currentPeriod) => {
      try {
        setDbError(null);
        await initDatabase();
        const screenData = await getBudgetDataForPeriod(targetPeriod);
        setData(screenData);
      } catch (err: any) {
        console.error('[BudgetsScreen] Error fetching budget data:', err);
        setDbError(err?.message || 'Failed to load budgets from local database.');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [currentPeriod]
  );

  // Reload when period changes or when external transactions are updated
  useEffect(() => {
    loadBudgetData(currentPeriod);
  }, [currentPeriod, refreshTrigger, loadBudgetData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBudgetData(currentPeriod);
  };

  // Switch between Weekly and Monthly views
  const handlePeriodTypeChange = (newType: BudgetPeriodType) => {
    if (newType === periodType) return;
    setPeriodType(newType);
    const newPeriod = getDefaultPeriod(newType);
    setCurrentPeriod(newPeriod);
  };

  // Navigate to previous or next period
  const handleNavigatePeriod = (direction: -1 | 1) => {
    if (periodType === 'weekly') {
      const shifted = shiftWeeklyPeriod(currentPeriod.startDate, direction);
      setCurrentPeriod(shifted);
    } else {
      const shifted = shiftMonthlyPeriod(currentPeriod.startDate, direction);
      setCurrentPeriod(shifted);
    }
  };

  // Quick jump back to current week / month
  const handleJumpToCurrent = () => {
    const current = getDefaultPeriod(periodType);
    setCurrentPeriod(current);
  };

  // Open modal for Overall Budget
  const handleOpenOverallBudgetModal = () => {
    setTargetBudget(data?.overallBudget?.budget || null);
    setModalCategoryId(OVERALL_BUDGET_CATEGORY_ID);
    setModalVisible(true);
  };

  // Open modal to add a new category budget
  const handleOpenAddCategoryBudgetModal = () => {
    setTargetBudget(null);
    setModalCategoryId(undefined);
    setModalVisible(true);
  };

  // Open modal to edit an existing category budget
  const handleEditCategoryBudget = (budgetProgress: BudgetProgress) => {
    setTargetBudget(budgetProgress.budget);
    setModalCategoryId(budgetProgress.budget.categoryId);
    setModalVisible(true);
  };

  // Save budget handler (upsert)
  const handleSaveBudget = async (input: BudgetInput) => {
    await upsertBudget(input);
    await loadBudgetData(currentPeriod);
    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Delete budget handler
  const handleDeleteBudget = async (id: string) => {
    await deleteBudget(id);
    await loadBudgetData(currentPeriod);
    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Helper to render progress bar color and text
  const getStatusColor = (status: 'normal' | 'warning' | 'exceeded') => {
    switch (status) {
      case 'exceeded':
        return COLORS.accentRose;
      case 'warning':
        return COLORS.accentAmber;
      case 'normal':
      default:
        return COLORS.accentBlue;
    }
  };

  const getStatusBgColor = (status: 'normal' | 'warning' | 'exceeded') => {
    switch (status) {
      case 'exceeded':
        return COLORS.accentRoseBg;
      case 'warning':
        return COLORS.accentAmberBg;
      case 'normal':
      default:
        return COLORS.accentBlueBg;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Screen Header */}
      <View style={styles.header}>
        {onNavigateBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onNavigateBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backButtonText}>← Overview</Text>
          </TouchableOpacity>
        )}
        <View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Budgets & Limits</Text>
            <View style={styles.offlineBadge}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineBadgeText}>SQLITE</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Offline spending limits with warning triggers
          </Text>
        </View>
      </View>

      {/* Weekly / Monthly Tab Switcher */}
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
              Weekly Budgets
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
              Monthly Budgets
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
          <Text style={styles.errorTitle}>Database Error</Text>
          <Text style={styles.errorMessage}>{dbError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadBudgetData(currentPeriod)}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
          <Text style={styles.loadingText}>Calculating budgets & spending...</Text>
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
          {/* SECTION 1: OVERALL BUDGET CARD */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>OVERALL SPENDING LIMIT</Text>
            {data?.overallBudget && (
              <TouchableOpacity
                onPress={handleOpenOverallBudgetModal}
                activeOpacity={0.7}
              >
                <Text style={styles.editActionText}>Edit Limit</Text>
              </TouchableOpacity>
            )}
          </View>

          {data?.overallBudget ? (
            <View
              style={[
                styles.overallCard,
                data.overallBudget.status === 'exceeded' &&
                  styles.overallCardExceeded,
                data.overallBudget.status === 'warning' &&
                  styles.overallCardWarning,
              ]}
            >
              {/* Header row with status badge */}
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardScopeText}>
                    {periodType === 'weekly' ? 'Weekly' : 'Monthly'} Target
                  </Text>
                  <Text style={styles.overallBudgetAmount}>
                    {formatINR(data.overallBudget.budget.amount)}
                  </Text>
                </View>

                {/* Status Indicator Badge */}
                {data.overallBudget.status === 'exceeded' ? (
                  <View style={styles.badgeExceeded}>
                    <Text style={styles.badgeExceededText}>🚨 OVER BUDGET</Text>
                  </View>
                ) : data.overallBudget.status === 'warning' ? (
                  <View style={styles.badgeWarning}>
                    <Text style={styles.badgeWarningText}>⚠️ 80% LIMIT REACHED</Text>
                  </View>
                ) : (
                  <View style={styles.badgeNormal}>
                    <Text style={styles.badgeNormalText}>✓ ON TRACK</Text>
                  </View>
                )}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(data.overallBudget.percentageUsed, 100)}%`,
                      backgroundColor: getStatusColor(data.overallBudget.status),
                    },
                  ]}
                />
              </View>

              {/* Metrics Grid */}
              <View style={styles.overallMetricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>EXPENSES RECORDED</Text>
                  <Text style={styles.metricValue}>
                    {formatINR(data.overallBudget.spent)}
                  </Text>
                </View>

                <View style={styles.metricItemDivider} />

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>
                    {data.overallBudget.remainingPaise < 0
                      ? 'EXCEEDED BY'
                      : 'REMAINING'}
                  </Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: getStatusColor(data.overallBudget.status) },
                    ]}
                  >
                    {data.overallBudget.remainingPaise < 0
                      ? formatINR(Math.abs(data.overallBudget.remaining))
                      : formatINR(data.overallBudget.remaining)}
                  </Text>
                </View>

                <View style={styles.metricItemDivider} />

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>USED</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: getStatusColor(data.overallBudget.status) },
                    ]}
                  >
                    {data.overallBudget.percentageUsed}%
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* Unset Overall Budget Card */
            <View style={styles.emptyOverallCard}>
              <View style={styles.emptyOverallTop}>
                <Text style={styles.emptyOverallIcon}>📊</Text>
                <View style={styles.emptyOverallTextGroup}>
                  <Text style={styles.emptyOverallTitle}>
                    No {periodType} overall budget set
                  </Text>
                  <Text style={styles.emptyOverallDesc}>
                    Recorded expenses:{' '}
                    <Text style={styles.highlightExpense}>
                      {formatINR((data?.overallSpentPaise || 0) / 100)}
                    </Text>
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.setOverallBtn}
                onPress={handleOpenOverallBudgetModal}
                activeOpacity={0.8}
              >
                <Text style={styles.setOverallBtnText}>
                  + Set {periodType === 'weekly' ? 'Weekly' : 'Monthly'} Budget
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SECTION 2: CATEGORY BUDGETS */}
          <View style={[styles.sectionHeaderRow, { marginTop: SPACING.xl }]}>
            <Text style={styles.sectionTitle}>CATEGORY SPENDING LIMITS</Text>
            {data && data.availableCategories.length > 0 && (
              <TouchableOpacity
                onPress={handleOpenAddCategoryBudgetModal}
                activeOpacity={0.7}
                style={styles.addCategoryHeaderBtn}
              >
                <Text style={styles.addCategoryHeaderBtnText}>+ Add Limit</Text>
              </TouchableOpacity>
            )}
          </View>

          {data && data.categoryBudgets.length > 0 ? (
            <View style={styles.categoryList}>
              {data.categoryBudgets.map((cb) => {
                const statusColor = getStatusColor(cb.status);
                const statusBg = getStatusBgColor(cb.status);

                return (
                  <TouchableOpacity
                    key={cb.budget.id}
                    style={[
                      styles.categoryCard,
                      cb.status === 'exceeded' && styles.categoryCardExceeded,
                      cb.status === 'warning' && styles.categoryCardWarning,
                    ]}
                    onPress={() => handleEditCategoryBudget(cb)}
                    activeOpacity={0.7}
                  >
                    {/* Top Row: Category Info & Badge */}
                    <View style={styles.categoryTopRow}>
                      <View style={styles.categoryIdentity}>
                        <View style={styles.categoryIconCircle}>
                          <Text style={styles.categoryIconText}>
                            {cb.categoryIcon}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.categoryName}>
                            {cb.categoryName}
                          </Text>
                          <Text style={styles.categoryBudgetSubtitle}>
                            Limit: {formatINR(cb.budget.amount)}
                          </Text>
                        </View>
                      </View>

                      {/* Percentage Badge */}
                      <View
                        style={[
                          styles.categoryStatusPill,
                          {
                            backgroundColor: statusBg,
                            borderColor: statusColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryStatusPillText,
                            { color: statusColor },
                          ]}
                        >
                          {cb.status === 'exceeded'
                            ? `Over ${cb.percentageUsed}%`
                            : `${cb.percentageUsed}% used`}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.categoryProgressTrack}>
                      <View
                        style={[
                          styles.categoryProgressFill,
                          {
                            width: `${Math.min(cb.percentageUsed, 100)}%`,
                            backgroundColor: statusColor,
                          },
                        ]}
                      />
                    </View>

                    {/* Bottom Stats: Spent and Remaining */}
                    <View style={styles.categoryStatsRow}>
                      <Text style={styles.categoryStatText}>
                        Spent:{' '}
                        <Text style={styles.categoryStatBold}>
                          {formatINR(cb.spent)}
                        </Text>
                      </Text>

                      <Text style={styles.categoryStatText}>
                        {cb.remainingPaise < 0 ? (
                          <Text style={{ color: COLORS.accentRose, fontWeight: '700' }}>
                            Over by {formatINR(Math.abs(cb.remaining))}
                          </Text>
                        ) : (
                          <Text>
                            Remaining:{' '}
                            <Text style={styles.categoryStatBold}>
                              {formatINR(cb.remaining)}
                            </Text>
                          </Text>
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Empty Category Budgets State */
            <View style={styles.emptyCategoriesCard}>
              <Text style={styles.emptyCategoriesIcon}>🏷️</Text>
              <Text style={styles.emptyCategoriesTitle}>
                No category limits defined
              </Text>
              <Text style={styles.emptyCategoriesDesc}>
                Set spending targets for Groceries, Dining, Fuel, or Bills to monitor
                where your money goes and get warned when spending nears 80%.
              </Text>
              {data && data.availableCategories.length > 0 && (
                <TouchableOpacity
                  style={styles.addCategoryBtn}
                  onPress={handleOpenAddCategoryBudgetModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addCategoryBtnText}>
                    + Add Category Limit
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Policy Information Footer */}
          <View style={styles.policyFooter}>
            <Text style={styles.policyText}>
              ⓘ Spending totals include only transactions recorded in Pocket Ledger.
              Weekly periods run Monday through Sunday, and monthly periods run through
              the full calendar month. Budgets and transactions are stored offline in SQLite.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Add / Edit Budget Modal */}
      <BudgetModal
        visible={modalVisible}
        period={currentPeriod}
        targetBudget={targetBudget}
        initialCategoryId={modalCategoryId}
        availableCategories={data?.availableCategories || []}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveBudget}
        onDelete={handleDeleteBudget}
      />
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
  backButton: {
    paddingVertical: 4,
    marginBottom: SPACING.xs,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentBlueLight,
    fontFamily: FONTS.mono,
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
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    gap: 5,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentBlueLight,
  },
  offlineBadgeText: {
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
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  periodSwitcherText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  periodSwitcherTextActive: {
    color: COLORS.accentBlueLight,
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
    backgroundColor: COLORS.surface,
    marginTop: SPACING.sm,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  navCenter: {
    alignItems: 'center',
    gap: 3,
  },
  navPeriodLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
  },
  currentPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  currentPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.accentBlueLight,
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
  jumpPill: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  jumpPillText: {
    fontSize: 10,
    color: COLORS.accentBlue,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
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
  editActionText: {
    fontSize: 12,
    color: COLORS.accentBlueLight,
    fontWeight: '600',
    fontFamily: FONTS.mono,
  },
  overallCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  overallCardExceeded: {
    borderColor: COLORS.accentRoseBorder,
    backgroundColor: 'rgba(248, 113, 113, 0.05)',
  },
  overallCardWarning: {
    borderColor: COLORS.accentAmberBorder,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardScopeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  overallBudgetAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    marginTop: 2,
  },
  badgeNormal: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeNormalText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentBlueLight,
    fontFamily: FONTS.mono,
  },
  badgeWarning: {
    backgroundColor: COLORS.accentAmberBg,
    borderColor: COLORS.accentAmberBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeWarningText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentAmber,
    fontFamily: FONTS.mono,
  },
  badgeExceeded: {
    backgroundColor: COLORS.accentRoseBg,
    borderColor: COLORS.accentRoseBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeExceededText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentRose,
    fontFamily: FONTS.mono,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginVertical: SPACING.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  overallMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
  },
  metricItem: {
    flex: 1,
  },
  metricItemDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  metricLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    marginTop: 4,
  },
  emptyOverallCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  emptyOverallTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  emptyOverallIcon: {
    fontSize: 30,
  },
  emptyOverallTextGroup: {
    flex: 1,
  },
  emptyOverallTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyOverallDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  highlightExpense: {
    color: COLORS.accentRose,
    fontFamily: FONTS.mono,
    fontWeight: '700',
  },
  setOverallBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  setOverallBtnText: {
    color: COLORS.accentBlueLight,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: FONTS.sansMedium,
  },
  addCategoryHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  addCategoryHeaderBtnText: {
    fontSize: 12,
    color: COLORS.accentBlueLight,
    fontWeight: '600',
    fontFamily: FONTS.mono,
  },
  categoryList: {
    gap: SPACING.md,
  },
  categoryCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  categoryCardExceeded: {
    borderColor: COLORS.accentRoseBorder,
  },
  categoryCardWarning: {
    borderColor: COLORS.accentAmberBorder,
  },
  categoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryIconCircle: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  categoryIconText: {
    fontSize: 17,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  categoryBudgetSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    marginTop: 1,
  },
  categoryStatusPill: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  categoryStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.mono,
  },
  categoryProgressTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginVertical: SPACING.xs,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  categoryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  categoryStatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  categoryStatBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyCategoriesCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyCategoriesIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  emptyCategoriesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptyCategoriesDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  addCategoryBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  addCategoryBtnText: {
    color: COLORS.accentBlueLight,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: FONTS.sansMedium,
  },
  policyFooter: {
    marginTop: SPACING.xxl,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  policyText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorEmoji: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  errorMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.accentBlueVivid,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.buttonPrimaryText,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.mono,
  },
});

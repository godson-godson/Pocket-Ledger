import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import {
  FilterType,
  NewTransactionInput,
  SummaryMetrics,
  Transaction,
  TransactionType,
  UpdateTransactionInput,
} from '../types/transaction';
import { BudgetProgress } from '../types/budget';
import { Header } from '../components/Header';
import { BalanceCard } from '../components/BalanceCard';
import { DashboardQuickActions } from '../components/DashboardQuickActions';
import { BudgetOverviewSummary } from '../components/BudgetOverviewSummary';
import { TransactionList } from '../components/TransactionList';
import { TransactionModal } from '../components/TransactionModal';
import { SettingsModal } from '../components/SettingsModal';
import { initDatabase } from '../db/database';
import {
  clearAllTransactions,
  deleteTransaction,
  getSummaryMetrics,
  getTransactions,
  insertTransaction,
  seedSampleTransactions,
  updateTransaction,
} from '../db/transactionRepository';
import { getBudgetDataForPeriod } from '../db/budgetRepository';
import { getDefaultPeriod } from '../utils/budgetPeriods';

const DEFAULT_METRICS: SummaryMetrics = {
  netCashflow: 0,
  monthlyIncome: 0,
  monthlyExpense: 0,
  monthlyNet: 0,
  transactionCount: 0,
};

interface DashboardScreenProps {
  onNavigateToHistory?: () => void;
  onNavigateToBudgets?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToReports?: () => void;
  refreshTrigger?: number;
  onDataChanged?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToHistory,
  onNavigateToBudgets,
  onNavigateToWallet,
  onNavigateToReports,
  refreshTrigger = 0,
  onDataChanged,
}) => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<SummaryMetrics>(DEFAULT_METRICS);
  const [weeklyBudget, setWeeklyBudget] = useState<BudgetProgress | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<BudgetProgress | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('expense');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // 1. Safe Database Initialization
  const initialize = useCallback(async () => {
    try {
      setDbError(null);
      await initDatabase();
      setIsDbReady(true);
    } catch (err: any) {
      console.error('[Dashboard] SQLite initialization error:', err);
      setDbError(err?.message || 'Failed to initialize local SQLite database.');
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 2. Fetch Transactions, Metrics & Budgets from SQLite
  const loadDashboardData = useCallback(
    async (filter: FilterType = activeFilter) => {
      if (!isDbReady) return;

      try {
        setIsLoadingData(true);
        const [fetchedTransactions, summary, weeklyData, monthlyData] = await Promise.all([
          // Limit to 10 most recent on the dashboard overview
          getTransactions({ type: filter, limit: 10 }),
          getSummaryMetrics(),
          getBudgetDataForPeriod(getDefaultPeriod('weekly')),
          getBudgetDataForPeriod(getDefaultPeriod('monthly')),
        ]);

        setTransactions(fetchedTransactions);
        setMetrics(summary);
        setWeeklyBudget(weeklyData.overallBudget);
        setMonthlyBudget(monthlyData.overallBudget);
      } catch (err: any) {
        console.error('[Dashboard] Error reading from SQLite:', err);
      } finally {
        setIsLoadingData(false);
      }
    },
    [isDbReady, activeFilter]
  );

  useEffect(() => {
    if (isDbReady) {
      loadDashboardData(activeFilter);
    }
  }, [isDbReady, activeFilter, loadDashboardData, refreshTrigger]);

  // 3. User actions
  const handleFilterChange = (newFilter: FilterType) => {
    setActiveFilter(newFilter);
    loadDashboardData(newFilter);
  };

  const handleOpenAdd = (type: TransactionType = 'expense') => {
    setModalInitialType(type);
    setEditingTransaction(null);
    setAddModalVisible(true);
  };

  const handleSaveTransaction = async (input: NewTransactionInput) => {
    await insertTransaction(input);
    await loadDashboardData(activeFilter);
    onDataChanged?.();
  };

  const handleUpdateTransaction = async (input: UpdateTransactionInput) => {
    await updateTransaction(input);
    await loadDashboardData(activeFilter);
    onDataChanged?.();
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    await loadDashboardData(activeFilter);
    onDataChanged?.();
  };

  const handleClearData = async () => {
    await clearAllTransactions();
    await loadDashboardData(activeFilter);
    onDataChanged?.();
  };

  const handleSeedSampleData = async () => {
    await seedSampleTransactions();
    await loadDashboardData(activeFilter);
    onDataChanged?.();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(activeFilter);
    setRefreshing(false);
  };

  // If database failed to initialize, display a clean recovery view
  if (dbError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Local Database Error</Text>
          <Text style={styles.errorDesc}>{dbError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={initialize}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry Initialization</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading indicator on initial cold start
  if (!isDbReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
          <Text style={styles.loadingText}>Initializing Pocket Ledger...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accentBlue}
              colors={[COLORS.accentBlue]}
              progressBackgroundColor={COLORS.surfaceElevated}
            />
          }
        >
          {/* Header */}
          <Header
            onOpenSettings={() => setSettingsVisible(true)}
            transactionCount={metrics.transactionCount}
          />

          {/* Prominent Net Cash Flow Hero Card */}
          <BalanceCard
            netCashflow={metrics.netCashflow}
            monthlyNet={metrics.monthlyNet}
            monthlyIncome={metrics.monthlyIncome}
            monthlyExpense={metrics.monthlyExpense}
            transactionCount={metrics.transactionCount}
          />

          {/* Quick Actions Shortcuts */}
          <DashboardQuickActions
            onAddExpense={() => handleOpenAdd('expense')}
            onAddIncome={() => handleOpenAdd('income')}
            onNavigateToWallet={() => onNavigateToWallet?.()}
            onNavigateToReports={() => onNavigateToReports?.()}
          />

          {/* Compact Weekly & Monthly Budget Overview */}
          <BudgetOverviewSummary
            weeklyProgress={weeklyBudget}
            monthlyProgress={monthlyBudget}
            onNavigateToBudgets={() => onNavigateToBudgets?.()}
          />

          {/* Recent Activity List with Active Filter & View All */}
          <TransactionList
            transactions={transactions}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            onSelectTransaction={(item) => setEditingTransaction(item)}
            onViewAll={onNavigateToHistory}
            isLoading={isLoadingData && !refreshing}
          />
        </ScrollView>

        {/* Floating Add Transaction Action Button */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => handleOpenAdd('expense')}
            activeOpacity={0.85}
            accessibilityLabel="Add New Transaction"
          >
            <Text style={styles.fabPlus}>+</Text>
            <Text style={styles.fabLabel}>Record Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Unified Transaction Modal (Add or Edit/Delete) */}
        <TransactionModal
          visible={addModalVisible || editingTransaction !== null}
          transaction={editingTransaction}
          initialType={modalInitialType}
          onClose={() => {
            setAddModalVisible(false);
            setEditingTransaction(null);
          }}
          onSave={async (data) => {
            if (editingTransaction) {
              await handleUpdateTransaction(data as UpdateTransactionInput);
            } else {
              await handleSaveTransaction(data as NewTransactionInput);
            }
          }}
          onDelete={editingTransaction ? handleDeleteTransaction : undefined}
        />

        {/* Settings & Diagnostics Modal */}
        <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          onClearData={handleClearData}
          onSeedSampleData={handleSeedSampleData}
          recordCount={metrics.transactionCount}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  fabContainer: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center',
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentBlueVivid,
    paddingVertical: 13,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    width: '100%',
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    gap: 8,
  },
  fabPlus: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.buttonPrimaryText,
    lineHeight: 22,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.buttonPrimaryText,
    fontFamily: FONTS.sansMedium,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  errorIcon: {
    fontSize: 36,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  errorDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

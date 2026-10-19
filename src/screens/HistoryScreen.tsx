import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { CATEGORIES } from '../data/mockTransactions';
import {
  DateRangePreset,
  FilterType,
  NewTransactionInput,
  Transaction,
  TransactionQueryFilters,
  UpdateTransactionInput,
} from '../types/transaction';
import { TransactionItem } from '../components/TransactionItem';
import { TransactionModal } from '../components/TransactionModal';
import {
  deleteTransaction,
  getFilteredTotals,
  getTransactions,
  insertTransaction,
  updateTransaction,
} from '../db/transactionRepository';
import {
  formatINR,
  getDateRangePresets,
  isValidDateString,
} from '../utils/formatters';

interface HistoryScreenProps {
  refreshTrigger?: number;
  onDataChanged?: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  refreshTrigger = 0,
  onDataChanged,
}) => {
  // Query Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<FilterType>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Data & Lifecycle State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({
    totalIncomePaise: 0,
    totalExpensePaise: 0,
    netPaise: 0,
    count: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Single Modal State for both Add and Edit/Delete
  const [modalVisible, setModalVisible] = useState(false);
  const [targetTransaction, setTargetTransaction] = useState<Transaction | null>(null);

  // 200ms debounce on search input to prevent redundant SQL queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derive start and end date from active preset
  const getDateRange = useCallback((): { start?: string; end?: string } => {
    if (datePreset === 'all') {
      return {};
    }
    const presets = getDateRangePresets();
    if (datePreset === 'this_month') {
      return presets.thisMonth;
    }
    if (datePreset === 'last_month') {
      return presets.lastMonth;
    }
    if (datePreset === 'last_30_days') {
      return presets.last30Days;
    }
    if (datePreset === 'custom') {
      return {
        start: isValidDateString(customStartDate) ? customStartDate : undefined,
        end: isValidDateString(customEndDate) ? customEndDate : undefined,
      };
    }
    return {};
  }, [datePreset, customStartDate, customEndDate]);

  // Load transactions and aggregates matching current filters
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setQueryError(null);

      const { start, end } = getDateRange();

      const filters: TransactionQueryFilters = {
        type: activeType,
        searchQuery: debouncedSearchQuery.trim() || undefined,
        categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
        startDate: start,
        endDate: end,
      };

      const [data, aggregated] = await Promise.all([
        getTransactions(filters),
        getFilteredTotals(filters),
      ]);

      setTransactions(data);
      setTotals(aggregated);
    } catch (err: any) {
      console.error('[HistoryScreen] Failed to load transactions:', err);
      setQueryError(err?.message || 'Could not query transactions from database.');
    } finally {
      setIsLoading(false);
    }
  }, [activeType, debouncedSearchQuery, selectedCategoryId, getDateRange]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions, refreshTrigger]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setActiveType('all');
    setSelectedCategoryId('all');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const isAnyFilterActive =
    searchQuery.trim().length > 0 ||
    activeType !== 'all' ||
    selectedCategoryId !== 'all' ||
    datePreset !== 'all';

  // Transaction CRUD Actions
  const handleSaveTransaction = async (data: NewTransactionInput | UpdateTransactionInput) => {
    if ('id' in data) {
      await updateTransaction(data as UpdateTransactionInput);
    } else {
      await insertTransaction(data as NewTransactionInput);
    }
    await loadTransactions();
    onDataChanged?.();
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    await loadTransactions();
    onDataChanged?.();
  };

  const openAddModal = () => {
    setTargetTransaction(null);
    setModalVisible(true);
  };

  const openEditModal = (item: Transaction) => {
    setTargetTransaction(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTargetTransaction(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>TRANSACTION HISTORY</Text>
            <Text style={styles.screenSubtitle}>Search, filter & manage entries</Text>
          </View>
          {isAnyFilterActive && (
            <TouchableOpacity
              style={styles.resetFilterButton}
              onPress={handleResetFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.resetFilterText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title or note..."
            placeholderTextColor={COLORS.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.searchClearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Bar: Type & Date Range Presets */}
        <View style={styles.filtersSection}>
          {/* Row 1: Type Switcher Chips */}
          <View style={styles.chipRow}>
            {(['all', 'income', 'expense'] as FilterType[]).map((t) => {
              const isActive = activeType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    isActive && styles.typeChipActive,
                  ]}
                  onPress={() => setActiveType(t)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      isActive && styles.typeChipTextActive,
                    ]}
                  >
                    {t === 'all' ? 'All Types' : t === 'income' ? '↙ Income' : '↗ Expenses'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Row 2: Date Range Presets */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollRow}
          >
            {[
              { id: 'all', label: 'All Time' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom Range...' },
            ].map((p) => {
              const isActive = datePreset === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.presetChip,
                    isActive && styles.presetChipActive,
                  ]}
                  onPress={() => setDatePreset(p.id as DateRangePreset)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isActive && styles.presetChipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Custom Date Inputs if 'custom' selected */}
          {datePreset === 'custom' && (
            <View style={styles.customDateRow}>
              <View style={styles.customDateCol}>
                <Text style={styles.customDateLabel}>FROM (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.customDateInput}
                  placeholder="2026-10-01"
                  placeholderTextColor={COLORS.textDisabled}
                  value={customStartDate}
                  onChangeText={setCustomStartDate}
                  maxLength={10}
                />
              </View>
              <Text style={styles.customDateToText}>→</Text>
              <View style={styles.customDateCol}>
                <Text style={styles.customDateLabel}>TO (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.customDateInput}
                  placeholder="2026-10-31"
                  placeholderTextColor={COLORS.textDisabled}
                  value={customEndDate}
                  onChangeText={setCustomEndDate}
                  maxLength={10}
                />
              </View>
            </View>
          )}

          {/* Row 3: Category Filter Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollRow}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategoryId === 'all' && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategoryId('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategoryId === 'all' && styles.categoryChipTextActive,
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>

            {CATEGORIES.map((cat) => {
              const isActive = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryChipText,
                      isActive && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filtered Results Summary Bar */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryCount}>
            {totals.count} {totals.count === 1 ? 'transaction' : 'transactions'}
          </Text>
          <View style={styles.summaryAmounts}>
            <Text style={styles.summaryInflow}>
              +{formatINR(totals.totalIncomePaise / 100, { showDecimals: false })}
            </Text>
            <Text style={styles.summaryDot}>•</Text>
            <Text style={styles.summaryOutflow}>
              -{formatINR(totals.totalExpensePaise / 100, { showDecimals: false })}
            </Text>
          </View>
        </View>

        {/* Transactions List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accentGreen}
              colors={[COLORS.accentGreen]}
              progressBackgroundColor={COLORS.surfaceElevated}
            />
          }
        >
          {isLoading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={COLORS.accentGreen} />
              <Text style={styles.centerText}>Filtering SQLite records...</Text>
            </View>
          ) : queryError ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>⚠️</Text>
              <Text style={styles.emptyTitle}>Query Error</Text>
              <Text style={styles.centerText}>{queryError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadTransactions}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>
                {isAnyFilterActive ? 'No matching transactions' : 'No transactions recorded'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isAnyFilterActive
                  ? 'Try modifying your search or clearing the active filters.'
                  : 'Your SQLite database is currently empty. Tap "+ Add Transaction" below to log an entry.'}
              </Text>
              {isAnyFilterActive && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleResetFilters}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryButtonText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.listCard}>
              {transactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onPress={(item) => openEditModal(item)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Floating Add Transaction Action Button */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={openAddModal}
            activeOpacity={0.85}
            accessibilityLabel="Add New Transaction"
          >
            <Text style={styles.fabPlus}>+</Text>
            <Text style={styles.fabLabel}>Add Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Unified Transaction Modal (Add or Edit/Delete) */}
        <TransactionModal
          visible={modalVisible}
          transaction={targetTransaction}
          onClose={closeModal}
          onSave={handleSaveTransaction}
          onDelete={handleDelete}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.sansMedium,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resetFilterButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  resetFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentRose,
    fontFamily: FONTS.mono,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    paddingVertical: 10,
  },
  searchClearButton: {
    padding: 4,
  },
  searchClearText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  filtersSection: {
    gap: 8,
    paddingBottom: SPACING.xs,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: 8,
  },
  typeChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: 7,
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.accentGreen,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  typeChipTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  horizontalScrollRow: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
    alignItems: 'center',
  },
  presetChip: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  presetChipActive: {
    backgroundColor: COLORS.accentGreenBg,
    borderColor: COLORS.accentGreenBorder,
  },
  presetChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: COLORS.accentGreen,
    fontWeight: '700',
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    gap: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  customDateCol: {
    flex: 1,
  },
  customDateLabel: {
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  customDateInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
  },
  customDateToText: {
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  categoryChipActive: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.accentGreen,
  },
  categoryChipIcon: {
    fontSize: 12,
  },
  categoryChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 7,
    marginTop: 4,
  },
  summaryCount: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  summaryAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryInflow: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    fontWeight: '700',
    color: COLORS.accentGreen,
  },
  summaryDot: {
    fontSize: 10,
    color: COLORS.textDisabled,
  },
  summaryOutflow: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    fontWeight: '700',
    color: COLORS.accentRose,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 130, // Space for floating Add button
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  centerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  retryButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center',
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentGreen,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    width: '100%',
    shadowColor: COLORS.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.buttonPrimaryText,
    fontFamily: FONTS.sansMedium,
    letterSpacing: 0.3,
  },
});

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { FilterType, Transaction } from '../types/transaction';
import { TransactionItem } from './TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onSelectTransaction?: (transaction: Transaction) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  activeFilter,
  onFilterChange,
  onSelectTransaction,
  onViewAll,
  isLoading = false,
}) => {
  const filterOptions: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Expenses', value: 'expense' },
    { label: 'Income', value: 'income' },
  ];

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithCount}>
          <Text style={styles.sectionTitle}>RECENT</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{transactions.length}</Text>
          </View>
        </View>

        {onViewAll && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={onViewAll}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>All →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <View style={styles.filterContainer}>
          {filterOptions.map((opt) => {
            const isActive = activeFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => onFilterChange(opt.value)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List Card */}
      <View style={styles.listCard}>
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="small" color={COLORS.accentBlue} />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>≡</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'expense'
                ? 'No expenses logged'
                : activeFilter === 'income'
                ? 'No income logged'
                : 'No transactions yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all'
                ? 'Your offline ledger is empty. Add a transaction to get started.'
                : `No ${activeFilter} transactions found.`}
            </Text>
          </View>
        ) : (
          transactions.map((item, index) => (
            <TransactionItem
              key={item.id || index.toString()}
              transaction={item}
              onPress={onSelectTransaction}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.9,
  },
  countBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
  },
  viewAllButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentBlue,
    fontFamily: FONTS.mono,
  },
  filterBar: {
    marginBottom: SPACING.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 3,
    gap: 3,
  },
  filterChip: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.accentBlueBg,
    borderColor: COLORS.accentBlueBorder,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  filterChipTextActive: {
    color: COLORS.accentBlueLight,
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyIconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyIcon: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 270,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});

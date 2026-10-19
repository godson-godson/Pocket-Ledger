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
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
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
            <Text style={styles.viewAllText}>Full History →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterContainer}>
          {filterOptions.map((opt) => {
            const isActive = activeFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
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

      {/* Transactions List Card */}
      <View style={styles.listCard}>
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="small" color={COLORS.accentGreen} />
            <Text style={styles.loadingText}>Reading SQLite database...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              {activeFilter === 'expense' ? '↗' : activeFilter === 'income' ? '↙' : '📋'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'expense'
                ? 'No expenses recorded'
                : activeFilter === 'income'
                ? 'No income recorded'
                : 'No transactions recorded yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all'
                ? 'Your offline ledger is empty. Tap "+ Add Transaction" below to log an entry.'
                : `No transactions found matching "${activeFilter}".`}
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
    marginTop: SPACING.lg,
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
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
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
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  viewAllButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentGreen,
    fontFamily: FONTS.mono,
  },
  filterBar: {
    marginBottom: SPACING.md,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: 2,
    gap: 2,
  },
  filterChip: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  filterChipTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 32,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});

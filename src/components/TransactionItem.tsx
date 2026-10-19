import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { Transaction } from '../types/transaction';
import { formatDate, formatINR } from '../utils/formatters';
import { CategoryBadge } from './CategoryBadge';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  const isIncome = transaction.type === 'income';

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={() => onPress?.(transaction)}
    >
      <CategoryBadge
        icon={transaction.categoryIcon}
        type={transaction.type}
        size="medium"
      />

      <View style={styles.detailsColumn}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.title}
        </Text>
        <View style={styles.subInfoRow}>
          <Text style={styles.categoryName}>{transaction.categoryName}</Text>
          {transaction.note ? (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.note} numberOfLines={1}>
                {transaction.note}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.amountColumn}>
        <Text
          style={[
            styles.amount,
            isIncome ? styles.amountIncome : styles.amountExpense,
          ]}
        >
          {formatINR(isIncome ? transaction.amount : -transaction.amount, {
            showDecimals: 'auto',
            sign: true,
          })}
        </Text>
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  detailsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dot: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  note: {
    fontSize: 12,
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  amountColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.mono,
    marginBottom: 2,
  },
  amountIncome: {
    color: COLORS.accentGreen,
  },
  amountExpense: {
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
  },
});

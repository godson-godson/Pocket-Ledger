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
          <Text style={styles.dot}>·</Text>
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
          {Boolean(transaction.note) && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.note} numberOfLines={1}>
                {transaction.note}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.amountColumn}>
        <Text
          style={[
            styles.amount,
            isIncome ? styles.amountIncome : styles.amountExpense,
          ]}
        >
          {isIncome ? '+' : '−'}{' '}
          {formatINR(transaction.amount, { showDecimals: 'auto', sign: false })}
        </Text>
        <Text style={[styles.typeLabel, isIncome ? styles.typeLabelIncome : styles.typeLabelExpense]}>
          {isIncome ? 'INCOME' : 'EXPENSE'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.md,
  },
  detailsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.sansMedium,
    marginBottom: 3,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap',
  },
  categoryName: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  dot: {
    fontSize: 10,
    color: COLORS.textDisabled,
  },
  date: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
  },
  note: {
    fontSize: 11,
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  amountColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.mono,
  },
  amountIncome: {
    color: COLORS.accentGreen,
  },
  amountExpense: {
    color: COLORS.textPrimary,
  },
  typeLabel: {
    fontSize: 8,
    fontWeight: '700',
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
  typeLabelIncome: {
    color: COLORS.accentGreenMuted,
  },
  typeLabelExpense: {
    color: COLORS.textDisabled,
  },
});

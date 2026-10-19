import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { formatINR } from '../utils/formatters';

interface IncomeExpenseSummaryProps {
  income: number;
  expense: number;
}

export const IncomeExpenseSummary: React.FC<IncomeExpenseSummaryProps> = ({
  income,
  expense,
}) => {
  return (
    <View style={styles.container}>
      {/* Income Card */}
      <View style={[styles.card, styles.incomeCard]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, styles.incomeIconCircle]}>
            <Text style={styles.incomeArrow}>↙</Text>
          </View>
          <Text style={styles.cardTag}>INCOME</Text>
        </View>
        <Text style={styles.cardLabel}>Monthly Inflow</Text>
        <Text style={[styles.amountText, styles.incomeText]}>
          {formatINR(income)}
        </Text>
      </View>

      {/* Expense Card */}
      <View style={[styles.card, styles.expenseCard]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, styles.expenseIconCircle]}>
            <Text style={styles.expenseArrow}>↗</Text>
          </View>
          <Text style={styles.cardTag}>EXPENSES</Text>
        </View>
        <Text style={styles.cardLabel}>Monthly Outflow</Text>
        <Text style={[styles.amountText, styles.expenseText]}>
          {formatINR(expense)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  incomeCard: {
    borderColor: COLORS.border,
  },
  expenseCard: {
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeIconCircle: {
    backgroundColor: COLORS.accentGreenBg,
    borderColor: COLORS.accentGreenBorder,
    borderWidth: 1,
  },
  expenseIconCircle: {
    backgroundColor: COLORS.accentRoseBg,
    borderColor: COLORS.accentRoseBorder,
    borderWidth: 1,
  },
  incomeArrow: {
    color: COLORS.accentGreen,
    fontSize: 14,
    fontWeight: '700',
  },
  expenseArrow: {
    color: COLORS.accentRose,
    fontSize: 14,
    fontWeight: '700',
  },
  cardTag: {
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.mono,
    letterSpacing: -0.3,
  },
  incomeText: {
    color: COLORS.accentGreen,
  },
  expenseText: {
    color: COLORS.textPrimary,
  },
});

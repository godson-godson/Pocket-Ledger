import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { formatCurrentMonth, formatINR } from '../utils/formatters';

interface BalanceCardProps {
  netCashflow: number;
  monthlyNet: number;
  transactionCount: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  netCashflow,
  monthlyNet,
  transactionCount,
  monthlyIncome = 0,
  monthlyExpense = 0,
}) => {
  const isPositiveMonth = monthlyNet >= 0;
  const isPositiveCumulative = netCashflow >= 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.monthLabel}>{formatCurrentMonth().toUpperCase()}</Text>
            <Text style={styles.cardTitle}>NET CASH FLOW</Text>
          </View>
          <View style={styles.localBadge}>
            <View style={styles.localDot} />
            <Text style={styles.localText}>LOCAL</Text>
          </View>
        </View>

        {/* Main amount */}
        <View style={styles.amountSection}>
          <Text
            style={[
              styles.mainAmount,
              transactionCount > 0 && !isPositiveMonth && { color: COLORS.accentRose },
              transactionCount > 0 && isPositiveMonth && { color: COLORS.textPrimary },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {transactionCount === 0
              ? '₹0.00'
              : formatINR(monthlyNet, { showDecimals: true, sign: monthlyNet !== 0 })}
          </Text>
          <Text style={styles.clarification}>
            {transactionCount === 0
              ? 'No transactions logged this month'
              : 'Recorded income minus recorded expenses'}
          </Text>
        </View>

        {/* Inflow / Outflow row */}
        <View style={styles.flowRow}>
          <View style={styles.flowItem}>
            <View style={[styles.flowIconBox, styles.flowIconIncome]}>
              <Text style={styles.flowIconTextIncome}>+</Text>
            </View>
            <View>
              <Text style={styles.flowLabel}>INCOME</Text>
              <Text style={styles.flowValueIncome}>{formatINR(monthlyIncome)}</Text>
            </View>
          </View>

          <View style={styles.flowDivider} />

          <View style={styles.flowItem}>
            <View style={[styles.flowIconBox, styles.flowIconExpense]}>
              <Text style={styles.flowIconTextExpense}>−</Text>
            </View>
            <View>
              <Text style={styles.flowLabel}>EXPENSES</Text>
              <Text style={styles.flowValueExpense}>{formatINR(monthlyExpense)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>All-time net</Text>
          <Text
            style={[
              styles.footerValue,
              { color: isPositiveCumulative ? COLORS.accentBlueLight : COLORS.accentRose },
            ]}
          >
            {transactionCount === 0
              ? '₹0.00'
              : formatINR(netCashflow, { sign: netCashflow !== 0 })}
          </Text>
          <View style={styles.footerSpacer} />
          <Text style={styles.footerCount}>
            {transactionCount} {transactionCount === 1 ? 'record' : 'records'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    gap: 2,
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    letterSpacing: 0.6,
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  localDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accentBlue,
  },
  localText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
  amountSection: {
    gap: 3,
  },
  mainAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    letterSpacing: -0.8,
  },
  clarification: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.sans,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  flowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flowIconBox: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.xs,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  flowIconIncome: {
    backgroundColor: COLORS.accentGreenBg,
    borderColor: COLORS.accentGreenBorder,
  },
  flowIconExpense: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.border,
  },
  flowIconTextIncome: {
    color: COLORS.accentGreen,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  flowIconTextExpense: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
  flowLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
  flowValueIncome: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentGreen,
    fontFamily: FONTS.mono,
  },
  flowValueExpense: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
  },
  flowDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  footerLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  footerValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.mono,
    marginLeft: 5,
  },
  footerSpacer: {
    flex: 1,
  },
  footerCount: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.3,
  },
});

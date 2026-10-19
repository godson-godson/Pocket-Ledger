import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { formatINR } from '../utils/formatters';

interface BalanceCardProps {
  netCashflow: number; // Recorded Income minus Recorded Expenses (Rupees)
  monthlyNet: number; // Current month recorded net (Rupees)
  transactionCount: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  netCashflow,
  monthlyNet,
  transactionCount,
}) => {
  const isPositiveCashflow = netCashflow >= 0;
  const isPositiveMonth = monthlyNet >= 0;

  return (
    <View style={styles.container}>
      {/* Decorative top accent line */}
      <View
        style={[
          styles.topAccentBar,
          {
            backgroundColor:
              transactionCount === 0
                ? COLORS.borderLight
                : isPositiveCashflow
                ? COLORS.accentGreen
                : COLORS.accentRose,
          },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>RECORDED NET CASH FLOW</Text>
          <View style={styles.enginePill}>
            <Text style={styles.engineText}>LOCAL SQLITE</Text>
          </View>
        </View>

        <Text
          style={[
            styles.balanceAmount,
            transactionCount > 0 && {
              color: isPositiveCashflow ? COLORS.textPrimary : COLORS.accentRose,
            },
          ]}
        >
          {transactionCount === 0
            ? '₹0.00'
            : formatINR(netCashflow, {
                showDecimals: true,
                sign: netCashflow !== 0,
              })}
        </Text>

        {/* Clear explanation that this is strictly recorded income minus expenses */}
        <View style={styles.clarificationRow}>
          <Text style={styles.clarificationText}>
            {transactionCount === 0
              ? 'Start tracking by tapping "+ Add Transaction" below'
              : 'Cumulative Total: Recorded Income − Recorded Expenses'}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.savingsTag}>
            <Text
              style={[
                styles.savingsIcon,
                { color: isPositiveMonth ? COLORS.accentGreen : COLORS.accentRose },
              ]}
            >
              {transactionCount === 0 ? '•' : isPositiveMonth ? '▲' : '▼'}
            </Text>
            <Text
              style={[
                styles.savingsText,
                {
                  color:
                    transactionCount === 0
                      ? COLORS.textMuted
                      : isPositiveMonth
                      ? COLORS.accentGreen
                      : COLORS.accentRose,
                },
              ]}
            >
              {transactionCount === 0
                ? 'No activity this month'
                : `${isPositiveMonth ? '+' : ''}${formatINR(monthlyNet, {
                    showDecimals: false,
                  })} net this month`}
            </Text>
          </View>

          <Text style={styles.ledgerStatus}>
            {transactionCount === 1 ? '1 RECORD' : `${transactionCount} RECORDS`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  topAccentBar: {
    height: 3,
    opacity: 0.9,
  },
  content: {
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    fontFamily: FONTS.mono,
  },
  enginePill: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  engineText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.accentGreen,
    fontFamily: FONTS.mono,
    letterSpacing: 0.6,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    letterSpacing: -0.5,
    marginTop: SPACING.xs,
    marginBottom: 4,
  },
  clarificationRow: {
    marginBottom: SPACING.sm,
  },
  clarificationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.sans,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  savingsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  savingsIcon: {
    fontSize: 11,
    fontWeight: '700',
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.mono,
  },
  ledgerStatus: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
});

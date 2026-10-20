import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

interface DashboardQuickActionsProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  onNavigateToWallet: () => void;
  onNavigateToReports: () => void;
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  onAddExpense,
  onAddIncome,
  onNavigateToWallet,
  onNavigateToReports,
}) => {
  const actions = [
    {
      id: 'expense',
      label: 'Add Expense',
      icon: '−',
      iconColor: COLORS.textSecondary,
      onPress: onAddExpense,
    },
    {
      id: 'income',
      label: 'Add Income',
      icon: '+',
      iconColor: COLORS.accentGreen,
      onPress: onAddIncome,
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: '▣',
      iconColor: COLORS.textSecondary,
      onPress: onNavigateToWallet,
    },
    {
      id: 'reports',
      label: 'Insights',
      icon: '◉',
      iconColor: COLORS.accentBlueLight,
      onPress: onNavigateToReports,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.actionsGrid}>
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            style={styles.actionButton}
            onPress={act.onPress}
            activeOpacity={0.65}
          >
            <View style={styles.iconWrap}>
              <Text style={[styles.iconText, { color: act.iconColor }]}>
                {act.icon}
              </Text>
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>
              {act.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 5,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.sans,
    textAlign: 'center',
  },
});

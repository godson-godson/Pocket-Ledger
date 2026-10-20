import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { BudgetProgress } from '../types/budget';
import { formatINR } from '../utils/formatters';

interface BudgetOverviewSummaryProps {
  weeklyProgress: BudgetProgress | null;
  monthlyProgress: BudgetProgress | null;
  onNavigateToBudgets: () => void;
}

export const BudgetOverviewSummary: React.FC<BudgetOverviewSummaryProps> = ({
  weeklyProgress,
  monthlyProgress,
  onNavigateToBudgets,
}) => {
  const renderBudgetCard = (
    label: string,
    periodTag: string,
    progress: BudgetProgress | null
  ) => {
    if (!progress || !progress.budget) {
      return (
        <TouchableOpacity
          style={[styles.card, styles.emptyCard]}
          onPress={onNavigateToBudgets}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.periodTag}>{periodTag}</Text>
            <Text style={styles.setBudgetText}>+ Set</Text>
          </View>
          <Text style={styles.budgetLabel}>{label}</Text>
          <Text style={styles.emptyNote}>Tap to set a spending cap</Text>
        </TouchableOpacity>
      );
    }

    const { spent, budget, remaining, percentageUsed, status } = progress;
    const limit = budget.amount;
    const isExceeded = status === 'exceeded';
    const isWarning = status === 'warning';

    const barColor = isExceeded
      ? COLORS.accentRose
      : isWarning
      ? COLORS.accentAmber
      : COLORS.accentBlue;

    return (
      <TouchableOpacity style={styles.card} onPress={onNavigateToBudgets} activeOpacity={0.75}>
        <View style={styles.cardHeader}>
          <Text style={styles.periodTag}>{periodTag}</Text>
          <View
            style={[
              styles.statusPill,
              isExceeded
                ? styles.statusPillExceeded
                : isWarning
                ? styles.statusPillWarning
                : styles.statusPillNormal,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isExceeded
                  ? styles.statusTextExceeded
                  : isWarning
                  ? styles.statusTextWarning
                  : styles.statusTextNormal,
              ]}
            >
              {isExceeded ? 'OVER' : isWarning ? '80%+' : `${Math.round(percentageUsed)}%`}
            </Text>
          </View>
        </View>

        <Text style={styles.budgetLabel}>{label}</Text>

        <View style={styles.amountRow}>
          <Text style={styles.spentAmount}>{formatINR(spent)}</Text>
          <Text style={styles.limitAmount}> / {formatINR(limit)}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(Math.max(percentageUsed, 0), 100)}%` as any,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>

        <Text
          style={[styles.remainingText, isExceeded && { color: COLORS.accentRose }]}
        >
          {isExceeded
            ? `${formatINR(Math.abs(remaining))} over`
            : `${formatINR(remaining)} left`}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>BUDGETS</Text>
        <TouchableOpacity
          onPress={onNavigateToBudgets}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.manageText}>Manage →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsRow}>
        {renderBudgetCard('Weekly Cap', 'WEEKLY', weeklyProgress)}
        {renderBudgetCard('Monthly Cap', 'MONTHLY', monthlyProgress)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.9,
  },
  manageText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentBlue,
    fontFamily: FONTS.mono,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  periodTag: {
    fontSize: 9,
    fontFamily: FONTS.mono,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  setBudgetText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentBlue,
    fontFamily: FONTS.mono,
  },
  budgetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  emptyNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 14,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  spentAmount: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.mono,
    color: COLORS.textPrimary,
  },
  limitAmount: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  remainingText: {
    fontSize: 10,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
  },
  statusPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  statusPillNormal: {
    backgroundColor: COLORS.accentBlueBg,
  },
  statusPillWarning: {
    backgroundColor: COLORS.accentAmberBg,
  },
  statusPillExceeded: {
    backgroundColor: COLORS.accentRoseBg,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '700',
    fontFamily: FONTS.mono,
    letterSpacing: 0.4,
  },
  statusTextNormal: {
    color: COLORS.accentBlueLight,
  },
  statusTextWarning: {
    color: COLORS.accentAmber,
  },
  statusTextExceeded: {
    color: COLORS.accentRose,
  },
});

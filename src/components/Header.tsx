import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { formatCurrentMonth } from '../utils/formatters';

interface HeaderProps {
  onOpenSettings: () => void;
  transactionCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, transactionCount }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.titleRow}>
          <Text style={styles.appName}>Pocket Ledger</Text>
          <View style={styles.offlineBadge}>
            <View style={styles.offlineDot} />
            <Text style={styles.offlineBadgeText}>OFFLINE</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{formatCurrentMonth()}</Text>
      </View>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={onOpenSettings}
        activeOpacity={0.7}
        accessibilityLabel="Open settings"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.settingsIcon}>⚙</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  leftSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.sansMedium,
    letterSpacing: -0.3,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  offlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accentGreen,
  },
  offlineBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.2,
    fontFamily: FONTS.sans,
  },
  settingsButton: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
});

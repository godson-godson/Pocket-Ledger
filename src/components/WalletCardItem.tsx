import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import {
  CARD_THEMES,
  DEFAULT_CARD_THEME,
  WALLET_TYPES,
  WalletItem,
} from '../types/wallet';

interface WalletCardItemProps {
  item: WalletItem;
  onPress: () => void;
  onTogglePin?: (id: string, newPinned: boolean) => void;
  featured?: boolean;
}

export const WalletCardItem: React.FC<WalletCardItemProps> = ({
  item,
  onPress,
  onTogglePin,
  featured = false,
}) => {
  const meta = WALLET_TYPES[item.type] || WALLET_TYPES.custom;
  const theme = CARD_THEMES[item.color] || CARD_THEMES[DEFAULT_CARD_THEME];

  const handlePinPress = (e: any) => {
    e.stopPropagation?.();
    if (onTogglePin) {
      onTogglePin(item.id, !item.isPinned);
    }
  };

  // Safe formatting for identifier
  const renderIdentifier = () => {
    if (!item.identifier) return null;
    if (item.type === 'payment') {
      return (
        <Text style={[styles.identifierText, featured && styles.identifierTextFeatured]}>
          •••• •••• •••• {item.identifier}
        </Text>
      );
    }
    return (
      <Text style={[styles.identifierText, featured && styles.identifierTextFeatured]}>
        {item.identifier}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.cardContainer,
        featured ? styles.cardContainerFeatured : styles.cardContainerStandard,
        {
          backgroundColor: theme.bgGradientStart,
          borderColor: theme.borderColor,
        },
      ]}
    >
      {/* Subtle top glare accent */}
      <View style={[styles.cardGlareBar, { backgroundColor: theme.accentColor }]} />

      {/* Top Header Row: Issuer / Type & Pin Action */}
      <View style={styles.cardHeader}>
        <View style={styles.typeBadgeRow}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: theme.borderColor },
            ]}
          >
            <Text style={styles.typeBadgeIcon}>{meta.icon}</Text>
            <Text style={[styles.typeBadgeText, { color: theme.accentColor }]}>
              {meta.badgeText}
            </Text>
          </View>

          {Boolean(item.issuer) && (
            <Text style={styles.issuerText} numberOfLines={1}>
              {item.issuer}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handlePinPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[
            styles.pinButton,
            item.isPinned && styles.pinButtonActive,
          ]}
        >
          <Text style={[styles.pinIcon, item.isPinned && styles.pinIconActive]}>
            {item.isPinned ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Middle Section: Decorative EMV chip */}
      {featured && (
        <View style={styles.chipRow}>
          <View style={[styles.emvChip, { borderColor: theme.chipColor }]}>
            <View style={styles.chipInnerLineHorizontal} />
            <View style={styles.chipInnerLineVertical} />
          </View>
        </View>
      )}

      {/* Card Title & Identifier */}
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, featured && styles.cardTitleFeatured]} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.identifierRow}>{renderIdentifier()}</View>
      </View>

      {/* Bottom Footer Row: Holder & Expiry */}
      <View style={styles.cardFooter}>
        <View style={styles.holderColumn}>
          {Boolean(item.holderName) && (
            <>
              <Text style={styles.footerLabel}>HOLDER</Text>
              <Text style={styles.footerValue} numberOfLines={1}>
                {item.holderName?.toUpperCase()}
              </Text>
            </>
          )}
        </View>

        {Boolean(item.expiryDate) && (
          <View style={styles.expiryColumn}>
            <Text style={styles.footerLabel}>EXP</Text>
            <Text style={styles.footerValue}>{item.expiryDate}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardContainerFeatured: {
    padding: SPACING.lg,
    minHeight: 180,
    marginVertical: SPACING.xs,
  },
  cardContainerStandard: {
    padding: SPACING.md,
    minHeight: 140,
    marginBottom: SPACING.md,
  },
  cardGlareBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    gap: 4,
  },
  typeBadgeIcon: {
    fontSize: 11,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: FONTS.mono,
  },
  issuerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  pinButton: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  pinButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  pinIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  pinIconActive: {
    color: COLORS.accentAmber,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: 4,
  },
  emvChip: {
    width: 34,
    height: 26,
    borderRadius: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInnerLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
  },
  chipInnerLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
  },
  cardBody: {
    marginVertical: SPACING.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  cardTitleFeatured: {
    fontSize: 18,
    fontWeight: '700',
  },
  identifierRow: {
    marginTop: 4,
  },
  identifierText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    letterSpacing: 1.2,
  },
  identifierTextFeatured: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  holderColumn: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  expiryColumn: {
    alignItems: 'flex-end',
  },
  footerLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  footerValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
});

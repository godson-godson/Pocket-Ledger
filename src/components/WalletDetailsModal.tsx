import React from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { WALLET_TYPES, WalletItem } from '../types/wallet';
import { WalletCardItem } from './WalletCardItem';
import { formatDate } from '../utils/formatters';

interface WalletDetailsModalProps {
  visible: boolean;
  item: WalletItem | null;
  onClose: () => void;
  onEdit: (item: WalletItem) => void;
  onDelete: (id: string) => Promise<void>;
  onTogglePin: (id: string, newPinned: boolean) => Promise<void>;
}

export const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({
  visible,
  item,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  // Preserve last known item during close transition so native Modal doesn't unmount prematurely
  const [activeItem, setActiveItem] = React.useState<WalletItem | null>(item);

  React.useEffect(() => {
    if (item) {
      setActiveItem(item);
    }
  }, [item]);

  if (!activeItem && !item) {
    return (
      <Modal
        visible={false}
        transparent
        onRequestClose={onClose}
      />
    );
  }

  const currentItem = item || activeItem!;
  const meta = WALLET_TYPES[currentItem.type] || WALLET_TYPES.custom;

  const handleDeletePress = () => {
    Alert.alert(
      'Remove from Wallet?',
      `Are you sure you want to remove "${currentItem.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              onClose();
              await onDelete(currentItem.id);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to remove card.');
            }
          },
        },
      ]
    );
  };

  const formattedCreated = new Date(currentItem.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop touchable to dismiss when tapping outside the sheet */}
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Card Details</Text>
              <Text style={styles.headerSubtitle}>{meta.label}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Card Hero Preview */}
            <View style={styles.cardPreviewWrapper}>
              <WalletCardItem
                item={currentItem}
                featured
                onPress={() => {}}
                onTogglePin={async (id, newPinned) => {
                  await onTogglePin(id, newPinned);
                }}
              />
            </View>

            {/* Quick Actions Row: Pin toggle */}
            <View style={styles.quickActionRow}>
              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  currentItem.isPinned && styles.quickActionBtnPinned,
                ]}
                onPress={() => onTogglePin(currentItem.id, !currentItem.isPinned)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>{currentItem.isPinned ? '★' : '☆'}</Text>
                <Text style={styles.quickActionText}>
                  {currentItem.isPinned ? 'Pinned to Featured' : 'Pin to Featured'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Details Table */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsCardHeader}>CARD SPECIFICATIONS</Text>

              {/* Name */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Display Name</Text>
                <Text style={styles.detailValue}>{currentItem.name}</Text>
              </View>

              {/* Type */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{meta.label}</Text>
              </View>

              {/* Issuer */}
              {Boolean(currentItem.issuer) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{meta.issuerLabel}</Text>
                  <Text style={styles.detailValue}>{currentItem.issuer}</Text>
                </View>
              )}

              {/* Identifier */}
              {Boolean(currentItem.identifier) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{meta.identifierLabel}</Text>
                  <Text style={[styles.detailValue, styles.monoValue]}>
                    {currentItem.type === 'payment'
                      ? `•••• •••• •••• ${currentItem.identifier}`
                      : currentItem.identifier}
                  </Text>
                </View>
              )}

              {/* Holder Name */}
              {Boolean(currentItem.holderName) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{meta.holderLabel}</Text>
                  <Text style={styles.detailValue}>{currentItem.holderName}</Text>
                </View>
              )}

              {/* Expiry */}
              {Boolean(currentItem.expiryDate) && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{meta.expiryLabel}</Text>
                  <Text style={[styles.detailValue, styles.monoValue]}>
                    {currentItem.expiryDate}
                  </Text>
                </View>
              )}

              {/* Added On */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Added On</Text>
                <Text style={styles.detailValue}>{formattedCreated}</Text>
              </View>

              {/* Notes */}
              {Boolean(currentItem.note) && (
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailNoteValue}>{currentItem.note}</Text>
                </View>
              )}
            </View>

            {/* Privacy & Safety Notice */}
            <View style={styles.securityNotice}>
              <Text style={styles.securityIcon}>🛡️</Text>
              <Text style={styles.securityText}>
                Stored encrypted and offline in Pocket Ledger SQLite. No CVV, PIN, or full card numbers are stored. This reference card does not support NFC or contactless transactions.
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Actions: Edit & Delete */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeletePress}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteButtonText}>Remove Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                onClose();
                onEdit(currentItem);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.sansMedium,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtnText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: SPACING.xl,
  },
  scrollContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  cardPreviewWrapper: {
    marginBottom: SPACING.md,
  },
  quickActionRow: {
    marginBottom: SPACING.md,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    gap: 8,
  },
  quickActionBtnPinned: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: COLORS.accentAmberBorder,
  },
  quickActionIcon: {
    fontSize: 15,
    color: COLORS.accentAmber,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  detailsCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  detailsCardHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  monoValue: {
    fontFamily: FONTS.mono,
  },
  detailNoteValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: SPACING.md,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentRoseBg,
    borderWidth: 1,
    borderColor: COLORS.accentRoseBorder,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accentRose,
  },
  editButton: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentBlue,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.buttonPrimaryText,
  },
});

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import {
  CARD_THEMES,
  DEFAULT_CARD_THEME,
  WALLET_TYPES,
  WalletItem,
  WalletItemInput,
  WalletItemType,
} from '../types/wallet';

interface WalletCardModalProps {
  visible: boolean;
  targetItem?: WalletItem | null;
  onClose: () => void;
  onSave: (input: WalletItemInput) => Promise<void>;
}

export const WalletCardModal: React.FC<WalletCardModalProps> = ({
  visible,
  targetItem,
  onClose,
  onSave,
}) => {
  const isEditMode = Boolean(targetItem);

  const [type, setType] = useState<WalletItemType>('payment');
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [holderName, setHolderName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [color, setColor] = useState(DEFAULT_CARD_THEME);
  const [isPinned, setIsPinned] = useState(false);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (targetItem) {
        setType(targetItem.type);
        setName(targetItem.name);
        setIssuer(targetItem.issuer || '');
        setHolderName(targetItem.holderName || '');
        setIdentifier(targetItem.identifier || '');
        setExpiryDate(targetItem.expiryDate || '');
        setColor(targetItem.color || DEFAULT_CARD_THEME);
        setIsPinned(targetItem.isPinned);
        setNote(targetItem.note || '');
      } else {
        setType('payment');
        setName('');
        setIssuer('');
        setHolderName('');
        setIdentifier('');
        setExpiryDate('');
        setColor(DEFAULT_CARD_THEME);
        setIsPinned(false);
        setNote('');
      }
    }
  }, [visible, targetItem]);

  const typeMeta = WALLET_TYPES[type] || WALLET_TYPES.custom;

  const handleIdentifierChange = (val: string) => {
    if (type === 'payment') {
      // Payment card strictly allows only up to 4 digits
      const digitsOnly = val.replace(/\D/g, '').slice(0, 4);
      setIdentifier(digitsOnly);
    } else {
      setIdentifier(val);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a name or nickname for this card/pass.');
      return;
    }

    if (type === 'payment' && identifier.trim()) {
      const cleanDigits = identifier.trim().replace(/\D/g, '');
      if (cleanDigits.length > 4) {
        Alert.alert(
          'Security Notice',
          'Only the last 4 digits are permitted for payment card references. Never store full card numbers.'
        );
        return;
      }
    }

    try {
      setIsSaving(true);
      await onSave({
        id: targetItem?.id,
        type,
        name: trimmedName,
        issuer: issuer.trim() || undefined,
        holderName: holderName.trim() || undefined,
        identifier: identifier.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        color,
        isPinned,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save wallet item.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {isEditMode ? 'Edit Card / Pass' : 'Add Card or Pass'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Stored locally & offline in SQLite
              </Text>
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Card Type Selector */}
            <View style={styles.section}>
              <Text style={styles.label}>CARD OR PASS TYPE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeChipsContainer}
              >
                {(Object.keys(WALLET_TYPES) as WalletItemType[]).map((t) => {
                  const m = WALLET_TYPES[t];
                  const isSelected = type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeChip,
                        isSelected && styles.typeChipActive,
                      ]}
                      onPress={() => setType(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.typeChipIcon}>{m.icon}</Text>
                      <Text
                        style={[
                          styles.typeChipLabel,
                          isSelected && styles.typeChipLabelActive,
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Privacy Notice for Payment Cards */}
            {type === 'payment' && (
              <View style={styles.privacyBanner}>
                <Text style={styles.privacyIcon}>🔒</Text>
                <View style={styles.privacyTextGroup}>
                  <Text style={styles.privacyTitle}>Offline Card Reference Only</Text>
                  <Text style={styles.privacyDesc}>
                    Store only card nickname and last 4 digits for easy identification. Never enter full card numbers, CVVs, or PINs.
                  </Text>
                </View>
              </View>
            )}

            {/* Display Name Input (Required) */}
            <View style={styles.section}>
              <Text style={styles.label}>
                NAME / NICKNAME <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={
                  type === 'payment'
                    ? 'e.g. Salary Account Card, Amazon Pay'
                    : type === 'id_card'
                    ? 'e.g. Office Access Badge, Student ID'
                    : type === 'membership'
                    ? 'e.g. Gold Gym Pass, Library Card'
                    : 'e.g. Metro Card, Grocery Club'
                }
                placeholderTextColor={COLORS.textDisabled}
                value={name}
                onChangeText={setName}
                maxLength={40}
              />
            </View>

            {/* Dynamic Identifier Field */}
            <View style={styles.section}>
              <Text style={styles.label}>{typeMeta.identifierLabel.toUpperCase()}</Text>
              <TextInput
                style={styles.input}
                placeholder={typeMeta.identifierPlaceholder}
                placeholderTextColor={COLORS.textDisabled}
                value={identifier}
                onChangeText={handleIdentifierChange}
                keyboardType={type === 'payment' ? 'numeric' : 'default'}
                maxLength={type === 'payment' ? 4 : 50}
              />
              {type === 'payment' && (
                <Text style={styles.helperText}>
                  Enter the last 4 digits printed on the card.
                </Text>
              )}
            </View>

            {/* Issuer / Organization */}
            <View style={styles.section}>
              <Text style={styles.label}>{typeMeta.issuerLabel.toUpperCase()}</Text>
              <TextInput
                style={styles.input}
                placeholder={typeMeta.issuerPlaceholder}
                placeholderTextColor={COLORS.textDisabled}
                value={issuer}
                onChangeText={setIssuer}
                maxLength={50}
              />
            </View>

            {/* Holder Name & Expiry Row */}
            <View style={styles.row}>
              <View style={[styles.section, { flex: 1.2, marginRight: SPACING.md }]}>
                <Text style={styles.label}>{typeMeta.holderLabel.toUpperCase()}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={typeMeta.holderPlaceholder}
                  placeholderTextColor={COLORS.textDisabled}
                  value={holderName}
                  onChangeText={setHolderName}
                  maxLength={40}
                />
              </View>

              <View style={[styles.section, { flex: 0.8 }]}>
                <Text style={styles.label}>{typeMeta.expiryLabel.toUpperCase()}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={COLORS.textDisabled}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  maxLength={12}
                />
              </View>
            </View>

            {/* Card Color Theme */}
            <View style={styles.section}>
              <Text style={styles.label}>CARD COLOR & THEME</Text>
              <View style={styles.themesRow}>
                {Object.keys(CARD_THEMES).map((key) => {
                  const t = CARD_THEMES[key];
                  const isSelected = color === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.themeSwatch,
                        {
                          backgroundColor: t.bgGradientStart,
                          borderColor: isSelected ? t.accentColor : t.borderColor,
                        },
                        isSelected && styles.themeSwatchSelected,
                      ]}
                      onPress={() => setColor(key)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.themeAccentDot, { backgroundColor: t.accentColor }]} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Pinned / Favorite Toggle */}
            <View style={styles.pinnedRow}>
              <View style={styles.pinnedTextGroup}>
                <Text style={styles.pinnedTitle}>Pin to Featured Cards</Text>
                <Text style={styles.pinnedDesc}>
                  Shows this card prominently at the top of your wallet
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.pinnedToggleBtn,
                  isPinned && styles.pinnedToggleBtnActive,
                ]}
                onPress={() => setIsPinned(!isPinned)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pinnedToggleText, isPinned && styles.pinnedToggleTextActive]}>
                  {isPinned ? '★ Pinned' : '☆ Not Pinned'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <View style={[styles.section, { marginTop: SPACING.md }]}>
              <Text style={styles.label}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add optional notes, phone numbers, or details..."
                placeholderTextColor={COLORS.textDisabled}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
                maxLength={200}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!name.trim() || isSaving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!name.trim() || isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.buttonPrimaryText} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Update Card' : 'Save to Wallet'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
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
    paddingTop: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: COLORS.accentRose,
  },
  typeChipsContainer: {
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  typeChipActive: {
    backgroundColor: COLORS.accentBlue,
    borderColor: COLORS.accentBlueLight,
  },
  typeChipIcon: {
    fontSize: 14,
  },
  typeChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeChipLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentBlueBg,
    borderWidth: 1,
    borderColor: COLORS.accentBlueBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  privacyIcon: {
    fontSize: 20,
  },
  privacyTextGroup: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentBlueLight,
  },
  privacyDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  themesRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  themeSwatch: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeSwatchSelected: {
    borderWidth: 2.5,
    transform: [{ scale: 1.1 }],
  },
  themeAccentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pinnedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  pinnedTextGroup: {
    flex: 1,
    marginRight: SPACING.md,
  },
  pinnedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pinnedDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  pinnedToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  pinnedToggleBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: COLORS.accentAmber,
  },
  pinnedToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pinnedToggleTextActive: {
    color: COLORS.accentAmber,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.buttonPrimaryText,
  },
});

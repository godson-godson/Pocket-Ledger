import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { CATEGORIES } from '../data/mockTransactions';
import {
  Category,
  NewTransactionInput,
  Transaction,
  TransactionType,
  UpdateTransactionInput,
} from '../types/transaction';
import {
  getTodayDateString,
  isValidDateString,
  rupeesToPaise,
} from '../utils/formatters';

export interface TransactionModalProps {
  visible: boolean;
  transaction?: Transaction | null; // If provided, modal opens in edit mode; otherwise, create mode
  initialType?: TransactionType;
  onClose: () => void;
  onSave: (data: NewTransactionInput | UpdateTransactionInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  transaction,
  initialType = 'expense',
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditMode = Boolean(transaction);

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync form state when modal opens or transaction changes
  useEffect(() => {
    if (visible) {
      if (transaction) {
        setType(transaction.type);
        setAmount((transaction.amountPaise / 100).toString());
        setTitle(transaction.title);
        setNote(transaction.note || '');
        setDate(transaction.date);

        const matched = CATEGORIES.find((c) => c.id === transaction.categoryId);
        setSelectedCategory(matched || CATEGORIES[0]);
      } else {
        setAmount('');
        setTitle('');
        setNote('');
        setDate(getTodayDateString());
        setType(initialType);
        const validCategory = CATEGORIES.find(
          (c) => c.type === 'both' || c.type === initialType
        );
        setSelectedCategory(validCategory || CATEGORIES[0]);
      }
    }
  }, [transaction, visible, initialType]);

  const availableCategories = CATEGORIES.filter(
    (c) => c.type === 'both' || c.type === type
  );

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const validCategory = CATEGORIES.find(
      (c) => c.type === 'both' || c.type === newType
    );
    if (validCategory) {
      setSelectedCategory(validCategory);
    }
  };

  const handleSave = async () => {
    // 1. Strict amount validation & conversion to integer paise
    const amountPaise = rupeesToPaise(amount);
    if (!amountPaise || amountPaise <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount in rupees greater than 0 (e.g. 250 or 1499.50). Zero or negative values are not allowed.'
      );
      return;
    }

    // 2. Title validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Title Required', 'Please enter a transaction title or payee.');
      return;
    }

    // 3. Date validation (YYYY-MM-DD)
    const trimmedDate = date.trim();
    if (!isValidDateString(trimmedDate)) {
      Alert.alert('Invalid Date', 'Please specify a valid date in YYYY-MM-DD format (e.g. 2026-10-20).');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && transaction) {
        const updatePayload: UpdateTransactionInput = {
          id: transaction.id,
          title: trimmedTitle,
          amountPaise,
          type,
          categoryId: selectedCategory.id,
          categoryName: selectedCategory.name,
          categoryIcon: selectedCategory.icon,
          date: trimmedDate,
          note: note.trim() || undefined,
        };
        await onSave(updatePayload);
      } else {
        const newPayload: NewTransactionInput = {
          title: trimmedTitle,
          amountPaise,
          type,
          categoryId: selectedCategory.id,
          categoryName: selectedCategory.name,
          categoryIcon: selectedCategory.icon,
          date: trimmedDate,
          note: note.trim() || undefined,
        };
        await onSave(newPayload);
      }
      onClose();
    } catch (err: any) {
      console.error('[TransactionModal] Save failed:', err);
      Alert.alert(
        'Database Error',
        `Unable to save transaction to local SQLite: ${err?.message || 'Unknown error'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!transaction || !onDelete) return;

    Alert.alert(
      'Delete Transaction?',
      `Are you sure you want to delete "${transaction.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDelete(transaction.id);
              onClose();
            } catch (err: any) {
              console.error('[TransactionModal] Delete failed:', err);
              Alert.alert('Error', `Failed to delete transaction: ${err?.message || 'Database error'}`);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (!isSaving && !isDeleting) onClose();
      }}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={() => {
            if (!isSaving && !isDeleting) onClose();
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {isEditMode ? 'EDIT TRANSACTION' : 'RECORD TRANSACTION'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEditMode ? 'Modify or delete entry in SQLite' : 'Stored offline in local SQLite'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
                disabled={isSaving || isDeleting}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
            >
              {/* Type Switcher: Segmented Control */}
              <View style={styles.typeSwitcher}>
                <TouchableOpacity
                  style={[
                    styles.typeTab,
                    type === 'expense' && styles.typeTabActiveExpense,
                  ]}
                  onPress={() => handleTypeChange('expense')}
                  activeOpacity={0.7}
                  disabled={isSaving || isDeleting}
                >
                  <Text
                    style={[
                      styles.typeTabText,
                      type === 'expense' && styles.typeTabTextActiveExpense,
                    ]}
                  >
                    − Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeTab,
                    type === 'income' && styles.typeTabActiveIncome,
                  ]}
                  onPress={() => handleTypeChange('income')}
                  activeOpacity={0.7}
                  disabled={isSaving || isDeleting}
                >
                  <Text
                    style={[
                      styles.typeTabText,
                      type === 'income' && styles.typeTabTextActiveIncome,
                    ]}
                  >
                    + Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Prominent Amount Input Card */}
              <View style={styles.amountHeroCard}>
                <Text style={styles.amountCardLabel}>ENTER AMOUNT (INR)</Text>
                <View style={styles.amountInputRow}>
                  <Text
                    style={[
                      styles.currencySymbol,
                      { color: type === 'income' ? COLORS.accentGreen : COLORS.accentBlueLight },
                    ]}
                  >
                    ₹
                  </Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textDisabled}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    maxLength={10}
                    editable={!isSaving && !isDeleting}
                    autoFocus={!isEditMode}
                  />
                </View>
                <Text style={styles.amountPaiseHint}>Stored safely as integer paise in SQLite</Text>
              </View>

              {/* Title / Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TITLE / PAYEE</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    type === 'expense'
                      ? 'e.g. Groceries, Fuel, Electricity Bill'
                      : 'e.g. Salary, Client Invoice, Consulting'
                  }
                  placeholderTextColor={COLORS.textDisabled}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={50}
                  editable={!isSaving && !isDeleting}
                />
              </View>

              {/* Category Picker Chips */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CATEGORY</Text>
                <View style={styles.categoryGrid}>
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCategory.id === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          isSelected && (type === 'income' ? styles.categoryChipSelectedIncome : styles.categoryChipSelectedExpense),
                        ]}
                        onPress={() => setSelectedCategory(cat)}
                        activeOpacity={0.7}
                        disabled={isSaving || isDeleting}
                      >
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <Text
                          style={[
                            styles.categoryText,
                            isSelected && styles.categoryTextSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Date Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>TRANSACTION DATE</Text>
                  <TouchableOpacity
                    onPress={() => setDate(getTodayDateString())}
                    activeOpacity={0.7}
                    disabled={isSaving || isDeleting}
                    style={styles.todayPill}
                  >
                    <Text style={styles.todayAction}>Today</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textDisabled}
                  value={date}
                  onChangeText={setDate}
                  maxLength={10}
                  editable={!isSaving && !isDeleting}
                />
              </View>

              {/* Note / Memo (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOTE / MEMO (OPTIONAL)</Text>
                <TextInput
                  style={[styles.textInput, styles.noteInput]}
                  placeholder="Add additional details or reference number..."
                  placeholderTextColor={COLORS.textDisabled}
                  value={note}
                  onChangeText={setNote}
                  maxLength={80}
                  multiline
                  editable={!isSaving && !isDeleting}
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.footerRow}>
              {isEditMode && onDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  activeOpacity={0.8}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={COLORS.accentRose} />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
                disabled={isSaving || isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  type === 'income' ? styles.saveButtonIncome : styles.saveButtonExpense,
                  (isSaving || isDeleting) && { opacity: 0.6 },
                ]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={isSaving || isDeleting}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.buttonPrimaryText} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEditMode ? 'Update Record' : 'Save to Ledger'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardContainer: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.borderLight,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'android' ? SPACING.lg : SPACING.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 3,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  typeTabActiveExpense: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
  },
  typeTabActiveIncome: {
    backgroundColor: COLORS.accentGreenBg,
    borderColor: COLORS.accentGreenBorder,
    borderWidth: 1,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  typeTabTextActiveExpense: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  typeTabTextActiveIncome: {
    color: COLORS.accentGreen,
    fontWeight: '700',
  },
  amountHeroCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  amountCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: FONTS.mono,
    marginRight: 6,
  },
  amountInput: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    minWidth: 120,
    textAlign: 'center',
    paddingVertical: 4,
  },
  amountPaiseHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    marginTop: 4,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
  },
  todayPill: {
    backgroundColor: COLORS.accentBlueBg,
    borderColor: COLORS.accentBlueBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  todayAction: {
    fontSize: 10,
    color: COLORS.accentBlueLight,
    fontWeight: '700',
    fontFamily: FONTS.mono,
  },
  textInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  noteInput: {
    height: 56,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  categoryChipSelectedExpense: {
    backgroundColor: COLORS.accentBlueBg,
    borderColor: COLORS.accentBlue,
  },
  categoryChipSelectedIncome: {
    backgroundColor: COLORS.accentGreenBg,
    borderColor: COLORS.accentGreen,
  },
  categoryIcon: {
    fontSize: 13,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  categoryTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.accentRoseBg,
    borderColor: COLORS.accentRoseBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentRose,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1.6,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonExpense: {
    backgroundColor: COLORS.accentBlue,
  },
  saveButtonIncome: {
    backgroundColor: COLORS.accentGreenMuted,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.buttonPrimaryText,
    letterSpacing: 0.3,
  },
});

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
  onClose: () => void;
  onSave: (data: NewTransactionInput | UpdateTransactionInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  transaction,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditMode = Boolean(transaction);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync form state when modal opens or transaction changes
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount((transaction.amountPaise / 100).toString());
      setTitle(transaction.title);
      setNote(transaction.note || '');
      setDate(transaction.date);

      const matched = CATEGORIES.find((c) => c.id === transaction.categoryId);
      setSelectedCategory(matched || CATEGORIES[0]);
    } else {
      resetForm();
    }
  }, [transaction, visible]);

  const resetForm = () => {
    setAmount('');
    setTitle('');
    setNote('');
    setDate(getTodayDateString());
    setType('expense');
    setSelectedCategory(CATEGORIES[0]);
  };

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
      Alert.alert('Invalid Date', 'Please specify a valid date in YYYY-MM-DD format.');
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
      resetForm();
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {isEditMode ? 'EDIT TRANSACTION' : 'NEW TRANSACTION'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEditMode ? 'Modify or delete entry' : 'Store locally in SQLite'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
                disabled={isSaving || isDeleting}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
            >
              {/* Type Switcher */}
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
                    ↗ Expense
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
                    ↙ Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Amount Input in Rupees */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>AMOUNT (INR)</Text>
                  <Text style={styles.inputHint}>Stored as integer paise</Text>
                </View>
                <View style={styles.amountInputWrapper}>
                  <Text
                    style={[
                      styles.currencySymbol,
                      { color: type === 'income' ? COLORS.accentGreen : COLORS.textPrimary },
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
                  />
                </View>
              </View>

              {/* Title / Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TITLE / PAYEE</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    type === 'expense'
                      ? 'e.g. Groceries, Shell Petrol, BESCOM'
                      : 'e.g. Salary, Client Wire, Consulting'
                  }
                  placeholderTextColor={COLORS.textDisabled}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={50}
                  editable={!isSaving && !isDeleting}
                />
              </View>

              {/* Date Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>TRANSACTION DATE</Text>
                  <TouchableOpacity
                    onPress={() => setDate(getTodayDateString())}
                    activeOpacity={0.7}
                    disabled={isSaving || isDeleting}
                  >
                    <Text style={styles.todayAction}>Set Today</Text>
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
                          isSelected && styles.categoryChipSelected,
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

              {/* Note (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOTE (OPTIONAL)</Text>
                <TextInput
                  style={[styles.textInput, styles.noteInput]}
                  placeholder="Additional remarks or details"
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
                    <Text style={styles.deleteButtonText}>🗑 Delete</Text>
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
                    {isEditMode ? 'Save Changes' : 'Save to SQLite'}
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
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'android' ? SPACING.xl : SPACING.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
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
    fontWeight: '600',
  },
  scrollBody: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.accentRoseBg,
    borderColor: COLORS.accentRoseBorder,
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
    color: COLORS.accentRose,
    fontWeight: '700',
  },
  typeTabTextActiveIncome: {
    color: COLORS.accentGreen,
    fontWeight: '700',
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
  inputHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
  },
  todayAction: {
    fontSize: 11,
    color: COLORS.accentGreen,
    fontWeight: '600',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.mono,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    paddingVertical: 12,
  },
  textInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  noteInput: {
    height: 60,
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
    paddingVertical: 8,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.accentGreen,
  },
  categoryIcon: {
    fontSize: 14,
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  deleteButton: {
    flex: 1.1,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.accentRoseBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
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
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1.6,
    backgroundColor: COLORS.accentGreen,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.buttonPrimaryText,
    letterSpacing: 0.3,
  },
});

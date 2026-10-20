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
  BudgetInput,
  BudgetRecord,
  OVERALL_BUDGET_CATEGORY_ID,
  PeriodInfo,
} from '../types/budget';
import { Category } from '../types/transaction';
import { formatINR, rupeesToPaise } from '../utils/formatters';

export interface BudgetModalProps {
  visible: boolean;
  period: PeriodInfo;
  targetBudget?: BudgetRecord | null;
  initialCategoryId?: string;
  availableCategories: Category[];
  onClose: () => void;
  onSave: (input: BudgetInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  visible,
  period,
  targetBudget,
  initialCategoryId,
  availableCategories,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditMode = Boolean(targetBudget);
  const isOverall =
    targetBudget?.categoryId === OVERALL_BUDGET_CATEGORY_ID ||
    initialCategoryId === OVERALL_BUDGET_CATEGORY_ID;

  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategoryId || OVERALL_BUDGET_CATEGORY_ID
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (targetBudget) {
        setAmount((targetBudget.amountPaise / 100).toString());
        setSelectedCategoryId(targetBudget.categoryId);
      } else {
        setAmount('');
        if (initialCategoryId) {
          setSelectedCategoryId(initialCategoryId);
        } else if (availableCategories.length > 0) {
          setSelectedCategoryId(availableCategories[0].id);
        } else {
          setSelectedCategoryId(OVERALL_BUDGET_CATEGORY_ID);
        }
      }
    }
  }, [visible, targetBudget, initialCategoryId, availableCategories]);

  // Available categories for selection in modal
  const selectableCategories = React.useMemo(() => {
    if (isOverall) return [];
    if (isEditMode && targetBudget) {
      const currentCat = CATEGORIES.find((c) => c.id === targetBudget.categoryId);
      return currentCat ? [currentCat] : [];
    }
    return availableCategories;
  }, [isOverall, isEditMode, targetBudget, availableCategories]);

  const handleSave = async () => {
    const amountPaise = rupeesToPaise(amount);
    if (!amountPaise || amountPaise <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid positive budget amount in Rupees (e.g. 5000 or 1500.50).'
      );
      return;
    }

    const catId = isOverall
      ? OVERALL_BUDGET_CATEGORY_ID
      : selectedCategoryId;

    if (!catId) {
      Alert.alert('Category Required', 'Please select a category for this budget.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        periodType: period.type,
        periodStartDate: period.startDate,
        categoryId: catId,
        amountPaise,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save the budget limit.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!targetBudget || !onDelete) return;

    const label = isOverall
      ? 'Overall Budget'
      : CATEGORIES.find((c) => c.id === targetBudget.categoryId)?.name || 'Category Budget';

    Alert.alert(
      'Remove Budget',
      `Are you sure you want to remove the ${period.type} ${label}? Recorded transactions will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await onDelete(targetBudget.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not remove budget.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const selectedCategoryMeta = CATEGORIES.find((c) => c.id === selectedCategoryId);

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
              <Text style={styles.title}>
                {isEditMode ? 'Edit Budget' : 'Set Budget Limit'}
              </Text>
              <Text style={styles.periodSubtitle}>
                {period.type === 'weekly' ? 'Weekly' : 'Monthly'} • {period.displayLabel}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Target Type Display */}
            <View style={styles.section}>
              <Text style={styles.label}>BUDGET SCOPE</Text>
              {isOverall ? (
                <View style={styles.overallScopeCard}>
                  <Text style={styles.overallIcon}>📊</Text>
                  <View style={styles.scopeDetails}>
                    <Text style={styles.scopeTitle}>Overall Spending Limit</Text>
                    <Text style={styles.scopeDesc}>
                      Caps total expense spending across all categories for this {period.type === 'weekly' ? 'week' : 'month'}.
                    </Text>
                  </View>
                </View>
              ) : isEditMode ? (
                <View style={styles.overallScopeCard}>
                  <Text style={styles.overallIcon}>
                    {selectedCategoryMeta?.icon || '🏷️'}
                  </Text>
                  <View style={styles.scopeDetails}>
                    <Text style={styles.scopeTitle}>
                      {selectedCategoryMeta?.name || selectedCategoryId}
                    </Text>
                    <Text style={styles.scopeDesc}>
                      Category spending limit for this {period.type === 'weekly' ? 'week' : 'month'}.
                    </Text>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.helperText}>Select category to budget:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryPillsContainer}
                  >
                    {selectableCategories.map((cat) => {
                      const isSelected = selectedCategoryId === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryPill,
                            isSelected && styles.categoryPillActive,
                          ]}
                          onPress={() => setSelectedCategoryId(cat.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.categoryPillIcon}>{cat.icon}</Text>
                          <Text
                            style={[
                              styles.categoryPillText,
                              isSelected && styles.categoryPillTextActive,
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.label}>BUDGET LIMIT (RUPEES)</Text>
              <View style={styles.amountInputWrapper}>
                <Text style={styles.rupeeSign}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  maxLength={10}
                  autoFocus={!isEditMode}
                />
              </View>
              {Boolean(amount && rupeesToPaise(amount)) && (
                <Text style={styles.amountPreview}>
                  Limit:{' '}
                  {formatINR(rupeesToPaise(amount)! / 100, {
                    showDecimals: 'auto',
                  })}
                </Text>
              )}
            </View>

            {/* Quick Amount Suggestion Chips */}
            <View style={styles.section}>
              <Text style={styles.label}>QUICK AMOUNTS</Text>
              <View style={styles.chipRow}>
                {(period.type === 'weekly'
                  ? [1000, 2500, 5000, 10000]
                  : [5000, 15000, 25000, 50000]
                ).map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={styles.quickChip}
                    onPress={() => setAmount(val.toString())}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickChipText}>₹{val.toLocaleString('en-IN')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Policy & Guidance Note */}
            <View style={styles.infoBanner}>
              <Text style={styles.infoIcon}>ⓘ</Text>
              <Text style={styles.infoText}>
                Only recorded expense transactions in Pocket Ledger count toward this budget limit.
                Income is never subtracted from spending.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            {isEditMode && onDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isSaving || isDeleting}
                activeOpacity={0.7}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={COLORS.accentRose} />
                ) : (
                  <Text style={styles.deleteButtonText}>Remove</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!amount || isSaving || isDeleting) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!amount || isSaving || isDeleting}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.buttonPrimaryText} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Update Budget' : 'Save Budget'}
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
    maxHeight: '85%',
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.sansMedium,
  },
  periodSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  overallScopeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  overallIcon: {
    fontSize: 26,
  },
  scopeDetails: {
    flex: 1,
  },
  scopeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scopeDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  categoryPillsContainer: {
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  categoryPillActive: {
    borderColor: COLORS.accentBlue,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  categoryPillIcon: {
    fontSize: 15,
  },
  categoryPillText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: COLORS.accentBlueLight,
    fontWeight: '700',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
  },
  rupeeSign: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accentBlueLight,
    marginRight: SPACING.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
  },
  amountPreview: {
    fontSize: 12,
    fontFamily: FONTS.mono,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickChip: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  quickChipText: {
    fontSize: 12,
    fontFamily: FONTS.mono,
    color: COLORS.textSecondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  infoIcon: {
    fontSize: 14,
    color: COLORS.accentBlue,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    gap: SPACING.md,
  },
  deleteButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentRoseBg,
    borderColor: COLORS.accentRoseBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: COLORS.accentRose,
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.accentBlueVivid,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.buttonPrimaryText,
    fontWeight: '700',
    fontSize: 15,
  },
});

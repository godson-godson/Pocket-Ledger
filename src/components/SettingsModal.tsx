import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onClearData: () => Promise<void>;
  onSeedSampleData: () => Promise<void>;
  recordCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onClearData,
  onSeedSampleData,
  recordCount,
}) => {
  const handleConfirmClear = () => {
    Alert.alert(
      'Clear All Transactions?',
      'This will permanently delete all records stored in your local SQLite database. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await onClearData();
              onClose();
              Alert.alert('Database Cleared', 'All local SQLite transactions have been removed.');
            } catch (err: any) {
              Alert.alert('Error', `Failed to clear transactions: ${err?.message}`);
            }
          },
        },
      ]
    );
  };

  const handleConfirmSeed = () => {
    Alert.alert(
      'Load Demo Data?',
      'This will insert 8 demonstration transactions into your SQLite database for UI evaluation.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Load Demo Records',
          onPress: async () => {
            try {
              await onSeedSampleData();
              onClose();
              Alert.alert('Demo Data Loaded', 'Sample transactions have been inserted into SQLite.');
            } catch (err: any) {
              Alert.alert('Error', `Failed to load demo transactions: ${err?.message}`);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>SETTINGS & DATABASE</Text>
              <Text style={styles.subtitle}>Pocket Ledger • Expo SDK 57</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* SQLite Engine Info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OFFLINE STORAGE ENGINE</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Database Driver</Text>
              <Text style={styles.infoValHighlight}>expo-sqlite (WAL Mode)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Database File</Text>
              <Text style={styles.infoVal}>pocket_ledger.db</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Stored Records</Text>
              <Text style={styles.infoVal}>{recordCount} transactions</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Monetary Precision</Text>
              <Text style={styles.infoVal}>Integer Paise (Exact)</Text>
            </View>
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DATABASE ACTIONS</Text>

            <TouchableOpacity
              style={styles.seedButton}
              onPress={handleConfirmSeed}
              activeOpacity={0.8}
            >
              <Text style={styles.seedButtonIcon}>📋</Text>
              <Text style={styles.seedButtonText}>Load Demo Dataset (8 records)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleConfirmClear}
              activeOpacity={0.8}
            >
              <Text style={styles.clearButtonIcon}>🗑</Text>
              <Text style={styles.clearButtonText}>Clear All SQLite Records</Text>
            </TouchableOpacity>
          </View>

          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  section: {
    gap: SPACING.xs,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoKey: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoVal: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
  },
  infoValHighlight: {
    fontSize: 12,
    color: COLORS.accentBlueLight,
    fontFamily: FONTS.mono,
    fontWeight: '600',
  },
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    gap: 8,
    marginBottom: 8,
  },
  seedButtonIcon: {
    fontSize: 14,
  },
  seedButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.accentRoseBorder,
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  clearButtonIcon: {
    fontSize: 13,
    color: COLORS.accentRose,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accentRose,
  },
  doneButton: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

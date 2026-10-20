import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import {
  WALLET_TYPES,
  WalletItem,
  WalletItemInput,
  WalletItemType,
} from '../types/wallet';
import { WalletCardItem } from '../components/WalletCardItem';
import { WalletCardModal } from '../components/WalletCardModal';
import { WalletDetailsModal } from '../components/WalletDetailsModal';
import { initDatabase } from '../db/database';
import {
  deleteWalletItem,
  getWalletItems,
  getWalletTypeCounts,
  togglePinWalletItem,
  upsertWalletItem,
} from '../db/walletRepository';

interface WalletScreenProps {
  refreshTrigger?: number;
  onDataChanged?: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  refreshTrigger = 0,
  onDataChanged,
}) => {
  const [items, setItems] = useState<WalletItem[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<WalletItem | null>(null);
  const [viewingItem, setViewingItem] = useState<WalletItem | null>(null);

  // Debounce search input (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load wallet items from SQLite
  const loadWalletData = useCallback(async () => {
    try {
      setDbError(null);
      await initDatabase();

      const [loadedItems, counts] = await Promise.all([
        getWalletItems({
          type: activeFilter === 'all' ? undefined : activeFilter,
          searchQuery: debouncedSearch.trim() || undefined,
        }),
        getWalletTypeCounts(),
      ]);

      setItems(loadedItems);
      setTypeCounts(counts);

      // Keep viewingItem synced if open without making loadWalletData depend on viewingItem
      setViewingItem((prev) => {
        if (!prev) return null;
        const refreshedCurrent = loadedItems.find((i) => i.id === prev.id);
        return refreshedCurrent || prev;
      });
    } catch (err: any) {
      console.error('[WalletScreen] Error reading wallet items:', err);
      setDbError(err?.message || 'Failed to load wallet cards from local database.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, debouncedSearch]);

  useEffect(() => {
    loadWalletData();
  }, [activeFilter, debouncedSearch, refreshTrigger, loadWalletData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
  };

  // Save (insert or update) handler
  const handleSaveItem = async (input: WalletItemInput) => {
    await upsertWalletItem(input);
    await loadWalletData();
    onDataChanged?.();
  };

  // Delete handler
  const handleDeleteItem = async (id: string) => {
    await deleteWalletItem(id);
    await loadWalletData();
    onDataChanged?.();
  };

  // Toggle pin/favorite handler
  const handleTogglePin = async (id: string, newPinned: boolean) => {
    await togglePinWalletItem(id, newPinned);
    await loadWalletData();
    onDataChanged?.();
  };

  const handleCardPress = (item: WalletItem) => {
    setViewingItem(item);
  };

  const handleEditFromDetails = (item: WalletItem) => {
    setViewingItem(null);
    setTimeout(() => {
      setEditingItem(item);
      setAddModalVisible(true);
    }, 150);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setAddModalVisible(true);
  };

  const handleResetFilters = () => {
    setActiveFilter('all');
    setSearchQuery('');
    setDebouncedSearch('');
  };

  // Pinned items vs unpinned items
  const pinnedItems = items.filter((i) => i.isPinned);
  const otherItems = items.filter((i) => !i.isPinned);

  const filterOptions: { key: string; label: string; icon?: string }[] = [
    { key: 'all', label: 'All Cards' },
    { key: 'payment', label: 'Payment', icon: '▤' },
    { key: 'id_card', label: 'IDs', icon: '▣' },
    { key: 'membership', label: 'Members', icon: '◇' },
    { key: 'loyalty', label: 'Loyalty', icon: '★' },
    { key: 'transit', label: 'Transit', icon: '►' },
    { key: 'custom', label: 'Custom', icon: '✦' },
  ];

  const isFiltered = activeFilter !== 'all' || searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Wallet & Passes</Text>
              <View style={styles.sqliteBadge}>
                <View style={styles.sqliteDot} />
                <Text style={styles.sqliteBadgeText}>SQLITE</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Offline card references, IDs & memberships
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addCardBtn}
            onPress={openAddModal}
            activeOpacity={0.8}
          >
            <Text style={styles.addCardBtnText}>+ Add Card</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards, issuers, IDs..."
            placeholderTextColor={COLORS.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContainer}
        >
          {filterOptions.map((opt) => {
            const isActive = activeFilter === opt.key;
            const count = opt.key === 'all' ? items.length : (typeCounts[opt.key] || 0);

            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(opt.key)}
                activeOpacity={0.7}
              >
                {Boolean(opt.icon) && (
                  <Text style={styles.filterChipIcon}>{opt.icon}</Text>
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.filterCountBadge,
                      isActive && styles.filterCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        isActive && styles.filterCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {dbError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Local Database Error</Text>
          <Text style={styles.errorMessage}>{dbError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadWalletData}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
          <Text style={styles.loadingText}>Accessing local wallet...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.accentBlue}
              colors={[COLORS.accentBlue]}
            />
          }
        >
          {items.length === 0 ? (
            /* Empty States */
            isFiltered ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No matching cards or passes</Text>
                <Text style={styles.emptyDesc}>
                  We could not find any saved cards matching "{searchQuery}" or the active category filter.
                </Text>
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={handleResetFilters}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetFilterBtnText}>Reset Search & Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyWalletCard}>
                <View style={styles.emptyWalletIconCircle}>
                  <Text style={styles.emptyWalletIcon}>▣</Text>
                </View>
                <Text style={styles.emptyWalletTitle}>Your Wallet is Empty</Text>
                <Text style={styles.emptyWalletDesc}>
                  Keep payment card references, student or employee badges, club memberships, and transit passes organized securely in one offline place.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={openAddModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyAddBtnText}>+ Add Your First Card / Pass</Text>
                </TouchableOpacity>

                <View style={styles.emptySecurityNote}>
                  <Text style={styles.emptySecurityIcon}>🛡️</Text>
                  <Text style={styles.emptySecurityText}>
                    Stored 100% offline in SQLite on this device. Never store CVVs or PINs.
                  </Text>
                </View>
              </View>
            )
          ) : (
            <>
              {/* SECTION 1: FEATURED / PINNED CARDS */}
              {pinnedItems.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleWithIcon}>
                      <Text style={styles.starIcon}>★</Text>
                      <Text style={styles.sectionTitle}>FEATURED CARDS</Text>
                    </View>
                    <Text style={styles.sectionCountText}>
                      {pinnedItems.length} {pinnedItems.length === 1 ? 'card' : 'cards'}
                    </Text>
                  </View>

                  {/* Render featured cards */}
                  {pinnedItems.map((item) => (
                    <WalletCardItem
                      key={item.id}
                      item={item}
                      featured
                      onPress={() => handleCardPress(item)}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </View>
              )}

              {/* SECTION 2: OTHER CARDS / COLLECTION */}
              <View style={[styles.sectionContainer, pinnedItems.length > 0 && { marginTop: SPACING.lg }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    {pinnedItems.length > 0 ? 'OTHER CARDS & PASSES' : 'ALL CARDS & PASSES'}
                  </Text>
                  <Text style={styles.sectionCountText}>
                    {otherItems.length} {otherItems.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                {otherItems.length > 0 ? (
                  otherItems.map((item) => (
                    <WalletCardItem
                      key={item.id}
                      item={item}
                      featured={false}
                      onPress={() => handleCardPress(item)}
                      onTogglePin={handleTogglePin}
                    />
                  ))
                ) : (
                  <View style={styles.allPinnedNotice}>
                    <Text style={styles.allPinnedText}>
                      All current cards are pinned in the Featured section above.
                    </Text>
                  </View>
                )}
              </View>

              {/* Footer Policy Notice */}
              <View style={styles.policyFooter}>
                <Text style={styles.policyText}>
                  ⓘ Pocket Ledger Wallet stores card references locally on device.
                  For your safety, never enter full 16-digit card numbers, CVVs, or PINs.
                  Stored references do not support contactless (NFC) payments.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Add / Edit Card Modal */}
      <WalletCardModal
        visible={addModalVisible}
        targetItem={editingItem}
        onClose={() => {
          setAddModalVisible(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Card Details Modal */}
      <WalletDetailsModal
        visible={Boolean(viewingItem)}
        item={viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteItem}
        onTogglePin={handleTogglePin}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.sansMedium,
    letterSpacing: -0.5,
  },
  sqliteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentBlueBg,
    borderColor: COLORS.accentBlueBorder,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    gap: 5,
  },
  sqliteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentBlue,
  },
  sqliteBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentBlueLight,
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addCardBtn: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  addCardBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.buttonPrimaryText,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 42,
    marginTop: 4,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  clearSearchText: {
    fontSize: 14,
    color: COLORS.textMuted,
    paddingHorizontal: 4,
  },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  filterChipsContainer: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: COLORS.accentBlue,
    borderColor: COLORS.accentBlueLight,
  },
  filterChipIcon: {
    fontSize: 12,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterCountBadge: {
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  sectionContainer: {},
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starIcon: {
    fontSize: 12,
    color: COLORS.accentAmber,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 0.8,
  },
  sectionCountText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  allPinnedNotice: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  allPinnedText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyWalletCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  emptyWalletIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyWalletIcon: {
    fontSize: 32,
  },
  emptyWalletTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyWalletDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
  emptyAddBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.buttonPrimaryText,
  },
  emptySecurityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  emptySecurityIcon: {
    fontSize: 13,
  },
  emptySecurityText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  resetFilterBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  resetFilterBtnText: {
    fontSize: 12,
    color: COLORS.accentGreen,
    fontWeight: '600',
  },
  policyFooter: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  policyText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
  },
  errorContainer: {
    margin: SPACING.xl,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accentRoseBorder,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  errorEmoji: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentRose,
  },
  errorMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

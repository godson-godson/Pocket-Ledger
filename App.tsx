import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { BudgetsScreen } from './src/screens/BudgetsScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { COLORS, FONTS, RADIUS, SPACING } from './src/constants/theme';

export type AppTab = 'dashboard' | 'budgets' | 'reports' | 'wallet' | 'history';

function MainNavigator() {
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const insets = useSafeAreaInsets();

  const handleDataChanged = () => {
    setRefreshKey((k) => k + 1);
  };

  const primaryTabs: {
    key: 'dashboard' | 'wallet' | 'reports' | 'history';
    label: string;
    icon: string;
  }[] = [
    { key: 'dashboard', label: 'Home', icon: '◈' },
    { key: 'wallet', label: 'Wallet', icon: '▣' },
    { key: 'reports', label: 'Insights', icon: '◰' },
    { key: 'history', label: 'History', icon: '≡' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Screen Views */}
      <View style={styles.screenContainer}>
        {currentTab === 'dashboard' ? (
          <DashboardScreen
            onNavigateToHistory={() => setCurrentTab('history')}
            onNavigateToBudgets={() => setCurrentTab('budgets')}
            onNavigateToWallet={() => setCurrentTab('wallet')}
            onNavigateToReports={() => setCurrentTab('reports')}
            refreshTrigger={refreshKey}
            onDataChanged={handleDataChanged}
          />
        ) : currentTab === 'budgets' ? (
          <BudgetsScreen
            onNavigateBack={() => setCurrentTab('dashboard')}
            refreshTrigger={refreshKey}
            onDataChanged={handleDataChanged}
          />
        ) : currentTab === 'reports' ? (
          <ReportsScreen
            onNavigateToBudgets={() => setCurrentTab('budgets')}
            refreshTrigger={refreshKey}
            onDataChanged={handleDataChanged}
          />
        ) : currentTab === 'wallet' ? (
          <WalletScreen
            refreshTrigger={refreshKey}
            onDataChanged={handleDataChanged}
          />
        ) : (
          <HistoryScreen
            refreshTrigger={refreshKey}
            onDataChanged={handleDataChanged}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.tabBar,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
      >
        {primaryTabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                isActive && styles.tabItemActive,
              ]}
              onPress={() => setCurrentTab(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.tabIcon,
                  isActive && styles.tabIconActive,
                ]}
              >
                {tab.icon}
              </Text>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={styles.provider}>
      <MainNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  provider: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0A0C10',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: COLORS.accentBlueBg,
  },
  tabIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  tabIconActive: {
    color: COLORS.accentBlue,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.accentBlue,
    fontWeight: '700',
  },
});

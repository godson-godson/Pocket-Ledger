import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { BudgetsScreen } from './src/screens/BudgetsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { COLORS, FONTS, RADIUS, SPACING } from './src/constants/theme';

type Tab = 'dashboard' | 'budgets' | 'history';

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChanged = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="light" />

      {/* Screen Views */}
      <View style={styles.screenContainer}>
        {currentTab === 'dashboard' ? (
          <DashboardScreen
            onNavigateToHistory={() => setCurrentTab('history')}
            refreshTrigger={refreshKey}
            onDataChanged={handleDataChanged}
          />
        ) : currentTab === 'budgets' ? (
          <BudgetsScreen
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
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'dashboard' && styles.tabItemActive]}
          onPress={() => setCurrentTab('dashboard')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabIcon,
              currentTab === 'dashboard' && styles.tabIconActive,
            ]}
          >
            ◆
          </Text>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'dashboard' && styles.tabLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'budgets' && styles.tabItemActive]}
          onPress={() => setCurrentTab('budgets')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabIcon,
              currentTab === 'budgets' && styles.tabIconActive,
            ]}
          >
            🎯
          </Text>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'budgets' && styles.tabLabelActive,
            ]}
          >
            Budgets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'history' && styles.tabItemActive]}
          onPress={() => setCurrentTab('history')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabIcon,
              currentTab === 'history' && styles.tabIconActive,
            ]}
          >
            ≡
          </Text>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'history' && styles.tabLabelActive,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.xl,
    paddingTop: 8,
    paddingBottom: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: COLORS.surfaceHighlight,
  },
  tabIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  tabIconActive: {
    color: COLORS.accentGreen,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.accentGreen,
    fontWeight: '700',
  },
});

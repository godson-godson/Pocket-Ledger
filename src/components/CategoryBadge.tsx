import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { TransactionType } from '../types/transaction';

interface CategoryBadgeProps {
  icon: string;
  type?: TransactionType;
  size?: 'small' | 'medium' | 'large';
}

const GLYPH_MAP: Record<string, string> = {
  groceries: '⌸',
  dining: '♨',
  transport: '◈',
  utilities: 'ϟ',
  shopping: '▤',
  health: '✚',
  entertainment: '✦',
  salary: '▲',
  freelance: '❖',
  investment: '⬈',
  general: '●',
  '🛒': '⌸',
  '☕': '♨',
  '⛽': '◈',
  '⚡': 'ϟ',
  '🛍️': '▤',
  '🛍': '▤',
  '💊': '✚',
  '🎬': '✦',
  '💼': '▲',
  '💻': '❖',
  '📈': '⬈',
  '🏷️': '●',
  '🏷': '●',
  '💳': '▣',
  '🪪': '⌸',
  '⭐': '★',
  '🚇': '►',
  '🎫': '✦',
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  icon,
  type = 'expense',
  size = 'medium',
}) => {
  const isIncome = type === 'income';

  const sizeStyle = {
    small: { width: 28, height: 28, fontSize: 13 },
    medium: { width: 38, height: 38, fontSize: 16 },
    large: { width: 46, height: 46, fontSize: 20 },
  }[size];

  const glyph = GLYPH_MAP[icon] || (isIncome ? '▲' : '−');
  const iconColor = isIncome ? COLORS.accentGreen : COLORS.textSecondary;

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeStyle.width,
          height: sizeStyle.height,
          backgroundColor: isIncome ? COLORS.accentGreenBg : COLORS.surfaceElevated,
          borderColor: isIncome ? COLORS.accentGreenBorder : COLORS.border,
        },
      ]}
    >
      <Text style={{ fontSize: sizeStyle.fontSize, color: iconColor, fontWeight: '700' }}>
        {glyph}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

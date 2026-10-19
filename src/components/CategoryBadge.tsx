import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { TransactionType } from '../types/transaction';

interface CategoryBadgeProps {
  icon: string;
  type?: TransactionType;
  size?: 'small' | 'medium' | 'large';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  icon,
  type = 'expense',
  size = 'medium',
}) => {
  const isIncome = type === 'income';

  const sizeStyle = {
    small: { width: 32, height: 32, fontSize: 16 },
    medium: { width: 42, height: 42, fontSize: 20 },
    large: { width: 50, height: 50, fontSize: 24 },
  }[size];

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
      <Text style={{ fontSize: sizeStyle.fontSize }}>{icon}</Text>
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

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ProgressProps {
  total: number;
  current: number;
}

export function Progress({ total, current }: ProgressProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => {
        const color = i <= current ? theme.primary : 'rgba(255, 255, 255, 0.35)';
        return <View key={i} style={[styles.dash, { backgroundColor: color }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dash: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});

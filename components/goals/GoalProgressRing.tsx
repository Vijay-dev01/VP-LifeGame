import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { theme } from '@/constants/theme';

interface GoalProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  current?: number;
  target?: number;
  unit?: string;
}

export function GoalProgressRing({
  percent,
  size = 80,
  strokeWidth = 8,
  current,
  target,
  unit,
}: GoalProgressRingProps) {
  const center =
    current !== undefined && target !== undefined ? (
      <View style={styles.center}>
        <Text style={[styles.value, { fontSize: size * 0.2 }]}>
          {current}/{target}
        </Text>
        {unit ? (
          <Text style={[styles.unit, { fontSize: size * 0.11 }]}>{unit}</Text>
        ) : null}
      </View>
    ) : (
      <Text style={[styles.percent, { fontSize: size * 0.22 }]}>{Math.round(percent)}%</Text>
    );

  return (
    <ProgressRing
      percent={percent}
      size={size}
      strokeWidth={strokeWidth}
      center={center}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  value: {
    fontWeight: '800',
    color: theme.text,
  },
  unit: {
    color: theme.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  percent: {
    fontWeight: '800',
    color: theme.text,
  },
});

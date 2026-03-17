import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '@/store';
import {
  computeTotalDoneThisMonth,
  computeBestStreak,
  computeMonthlyCompletionPercent,
} from '@/store';
import { theme } from '@/constants/theme';

export function StatsCards() {
  const habits = useStore((s) => s.habits);
  const completions = useStore((s) => s.completions);
  const currentMonth = useStore((s) => s.currentMonth);
  const totalDone = useMemo(
    () => computeTotalDoneThisMonth(completions, currentMonth),
    [completions, currentMonth]
  );
  const bestStreak = useMemo(
    () => computeBestStreak(habits, completions),
    [habits, completions]
  );
  const completionPercent = useMemo(
    () => computeMonthlyCompletionPercent(habits, completions, currentMonth),
    [habits, completions, currentMonth]
  );

  const cards = [
    { label: 'CHECK-INS THIS MONTH', value: String(totalDone) },
    { label: 'CURRENT TRACKING LIST', value: String(habits.length), sub: 'ACTIVE HABITS' },
    { label: bestStreak.habitName.toUpperCase(), value: `${bestStreak.days} Days`, sub: 'BEST STREAK' },
    { label: 'MONTHLY TARGET', value: `${completionPercent}%`, sub: 'COMPLETION' },
  ];

  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <View key={card.label} style={styles.card}>
          <Text style={styles.value}>{card.value}</Text>
          <Text style={styles.sub}>{card.sub ?? card.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 16,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },
  sub: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 4,
  },
});

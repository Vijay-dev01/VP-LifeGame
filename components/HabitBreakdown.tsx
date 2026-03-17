import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '@/store';
import { computeHabitCompletionPercent } from '@/store';
import { theme } from '@/constants/theme';

export function HabitBreakdown() {
  const habits = useStore((s) => s.habits);
  const completions = useStore((s) => s.completions);
  const currentMonth = useStore((s) => s.currentMonth);
  const sorted = useMemo(() => [...habits].sort((a, b) => a.order - b.order), [habits]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>HABIT BREAKDOWN</Text>
      <ScrollView style={styles.list}>
        {sorted.length === 0 ? (
          <Text style={styles.empty}>No habits to show.</Text>
        ) : (
          sorted.map((habit) => {
            const pct = computeHabitCompletionPercent(habit.id, completions, currentMonth);
            return (
              <View key={habit.id} style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>
                  {habit.emoji} {habit.name}
                </Text>
                <View style={styles.barWrap}>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.pct}>{pct}%</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  list: {
    maxHeight: 280,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
  },
  barWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 100,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: theme.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 3,
  },
  pct: {
    fontSize: 12,
    color: theme.textMuted,
    width: 28,
    textAlign: 'right',
  },
  empty: {
    color: theme.textMuted,
    fontSize: 14,
    paddingVertical: 16,
  },
});

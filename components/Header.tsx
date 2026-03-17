import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { format, addMonths, subMonths } from 'date-fns';
import { useStore } from '@/store';
import { computeMonthlyCompletionPercent } from '@/store';
import { theme } from '@/constants/theme';

export function Header() {
  const currentMonth = useStore((s) => s.currentMonth);
  const setCurrentMonth = useStore((s) => s.setCurrentMonth);
  const habits = useStore((s) => s.habits);
  const completions = useStore((s) => s.completions);
  const percent = useMemo(
    () => computeMonthlyCompletionPercent(habits, completions, currentMonth),
    [habits, completions, currentMonth]
  );

  const d = new Date(currentMonth + 'T12:00:00');
  const prev = () => setCurrentMonth(format(subMonths(d, 1), 'yyyy-MM-dd'));
  const next = () => setCurrentMonth(format(addMonths(d, 1), 'yyyy-MM-dd'));

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Pressable onPress={prev} style={styles.navBtn}>
          <Text style={styles.arrow}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.month}>{format(d, 'MMMM yyyy').toUpperCase()}</Text>
        <Pressable onPress={next} style={styles.navBtn}>
          <Text style={styles.arrow}>{'›'}</Text>
        </Pressable>
      </View>
      <View style={styles.right}>
        <Text style={styles.label}>GLOBAL PROGRESS</Text>
        <View style={styles.barWrap}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(100, percent)}%` }]} />
          </View>
          <Text style={styles.percent}>{percent}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.surface,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    padding: 8,
  },
  arrow: {
    fontSize: 28,
    color: theme.textMuted,
    fontWeight: '300',
  },
  month: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    letterSpacing: 0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: theme.textMuted,
  },
  barWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barBg: {
    width: 80,
    height: 8,
    backgroundColor: theme.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 4,
  },
  percent: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    minWidth: 36,
  },
});

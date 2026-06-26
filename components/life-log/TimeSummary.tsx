import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { formatDurationHours } from '@/utils/lifeLog';
import { formatElapsed } from '@/hooks/useTimer';

interface TimeSummaryProps {
  todayLabel: string;
  todayTotalMinutes: number;
  isRunning: boolean;
  elapsedSeconds: number;
  activeTitle?: string;
}

export function TimeSummary({
  todayLabel,
  todayTotalMinutes,
  isRunning,
  elapsedSeconds,
  activeTitle,
}: TimeSummaryProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.date}>{todayLabel}</Text>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>LOGGED TODAY</Text>
          <Text style={styles.hours}>{formatDurationHours(todayTotalMinutes)}</Text>
        </View>
        {isRunning ? (
          <View style={styles.timerBox}>
            <Text style={styles.label}>ACTIVE</Text>
            <Text style={styles.timer}>{formatElapsed(elapsedSeconds)}</Text>
            {activeTitle ? (
              <Text style={styles.activeTitle} numberOfLines={1}>
                {activeTitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  hours: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.accent,
  },
  timerBox: {
    alignItems: 'flex-end',
    flex: 1,
  },
  timer: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
    fontVariant: ['tabular-nums'],
  },
  activeTitle: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
    maxWidth: 160,
  },
});

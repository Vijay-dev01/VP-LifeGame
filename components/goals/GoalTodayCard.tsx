import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GoalDailyAction, GoalHealthSnapshot } from '@/store/goalTypes';
import { theme } from '@/constants/theme';

interface GoalTodayCardProps {
  unit: string;
  todayActions: GoalDailyAction[];
  health: GoalHealthSnapshot | null;
  requiredDailyRate: number;
  onQuickLog: (amount: number) => void;
  onCustomLog: () => void;
}

export const GoalTodayCard = memo(function GoalTodayCard({
  unit,
  todayActions,
  health,
  requiredDailyRate,
  onQuickLog,
  onCustomLog,
}: GoalTodayCardProps) {
  const primary = todayActions.find((a) => !a.done) ?? todayActions[0];
  const todayTarget = primary?.targetValue ?? Math.max(1, Math.ceil(requiredDailyRate));
  const todayActual = primary?.actualValue ?? 0;
  const remaining = Math.max(0, todayTarget - todayActual);
  const progress = todayTarget > 0 ? Math.min(1, todayActual / todayTarget) : 0;
  const done = remaining <= 0 && todayActual > 0;

  const quickAmounts = [
    1,
    ...(remaining > 1 ? [remaining] : []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Today</Text>
        {done ? <Text style={styles.doneBadge}>Done ✓</Text> : null}
      </View>

      {primary ? (
        <Text style={styles.actionTitle}>{primary.title}</Text>
      ) : (
        <Text style={styles.actionTitle}>
          Log ~{requiredDailyRate.toFixed(1)} {unit} to stay on pace
        </Text>
      )}

      <View style={styles.progressRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {Math.round(todayActual)}/{Math.round(todayTarget)} {unit}
        </Text>
      </View>

      {health && health.requiredDailyRate > 0 && !done ? (
        <Text style={styles.hint}>
          Need ~{health.requiredDailyRate.toFixed(1)} {unit}/day overall · doing{' '}
          {health.currentDailyRate.toFixed(1)}
        </Text>
      ) : null}

      {!done ? (
        <View style={styles.chips}>
          {quickAmounts.map((amount) => (
            <Pressable
              key={amount}
              style={styles.chip}
              onPress={() => onQuickLog(amount)}
            >
              <Text style={styles.chipText}>
                +{amount}{amount === remaining && remaining !== 1 ? ' today' : ''}
              </Text>
            </Pressable>
          ))}
          <Pressable style={[styles.chip, styles.chipGhost]} onPress={onCustomLog}>
            <Text style={styles.chipGhostText}>Other</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.moreBtn} onPress={onCustomLog}>
          <Text style={styles.moreBtnText}>Log more progress</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  doneBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: theme.bg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    minWidth: 72,
    textAlign: 'right',
  },
  hint: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: theme.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipText: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 14,
  },
  chipGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipGhostText: {
    color: theme.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  moreBtn: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  moreBtnText: {
    color: theme.accent,
    fontWeight: '600',
    fontSize: 14,
  },
});

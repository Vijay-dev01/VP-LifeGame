import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GoalDailyAction, GoalHealthSnapshot, GoalMetricType } from '@/store/goalTypes';
import { toDisplayGoalAmount, toStoredGoalAmount } from '@/utils/goalUnits';
import { theme } from '@/constants/theme';

interface GoalTodayCardProps {
  unit: string;
  metricType: GoalMetricType;
  todayActions: GoalDailyAction[];
  health: GoalHealthSnapshot | null;
  requiredDailyRate: number;
  onQuickLog: (amount: number) => void;
  onCustomLog: () => void;
}

export const GoalTodayCard = memo(function GoalTodayCard({
  unit,
  metricType,
  todayActions,
  health,
  requiredDailyRate,
  onQuickLog,
  onCustomLog,
}: GoalTodayCardProps) {
  const primary = todayActions.find((a) => !a.done) ?? todayActions[0];
  const todayTargetStored =
    primary?.targetValue ?? Math.max(1, Math.ceil(toStoredGoalAmount(requiredDailyRate, unit, metricType)));
  const todayActualStored = primary?.actualValue ?? 0;
  const remainingStored = Math.max(0, todayTargetStored - todayActualStored);
  const progress =
    todayTargetStored > 0 ? Math.min(1, todayActualStored / todayTargetStored) : 0;
  const done = remainingStored <= 0 && todayActualStored > 0;

  const oneUnitStored = toStoredGoalAmount(1, unit, metricType);
  const quickAmountsStored = [
    oneUnitStored,
    ...(remainingStored > oneUnitStored ? [remainingStored] : []),
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
          {toDisplayGoalAmount(todayActualStored, unit, metricType)}/
          {toDisplayGoalAmount(todayTargetStored, unit, metricType)} {unit}
        </Text>
      </View>

      {health && health.requiredDailyRate > 0 && !done ? (
        <Text style={styles.hint}>
          Need ~{toDisplayGoalAmount(health.requiredDailyRate, unit, metricType).toFixed(1)}{' '}
          {unit}/day overall · doing{' '}
          {toDisplayGoalAmount(health.currentDailyRate, unit, metricType).toFixed(1)}
        </Text>
      ) : null}

      {!done ? (
        <View style={styles.chips}>
          {quickAmountsStored.map((storedAmount) => {
            const displayAmount = toDisplayGoalAmount(storedAmount, unit, metricType);
            const isRemaining = storedAmount === remainingStored;
            return (
              <Pressable
                key={storedAmount}
                style={styles.chip}
                onPress={() => onQuickLog(storedAmount)}
              >
                <Text style={styles.chipText}>
                  +{displayAmount}
                  {isRemaining && remainingStored !== oneUnitStored ? ' today' : ''}
                </Text>
              </Pressable>
            );
          })}
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

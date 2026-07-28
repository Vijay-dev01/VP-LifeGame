import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { GoalProgressRing } from '@/components/goals/GoalProgressRing';
import { PaceIndicator, GoalHealthBadge } from '@/components/goals/PaceIndicator';
import { theme } from '@/constants/theme';
import type { useGoals } from '@/hooks/useGoals';

type GoalMeta = ReturnType<typeof useGoals>['goalsWithMeta'][number];

interface GoalCardProps {
  meta: GoalMeta;
}

export function GoalCard({ meta }: GoalCardProps) {
  const { goal, progressPercent, paceStatus, paceHint, health, weeklyTarget, weekActual } =
    meta;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/goals/[id]', params: { id: goal.id } })}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{goal.emoji}</Text>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={2}>
            {goal.title}
          </Text>
          <PaceIndicator status={paceStatus} hint={paceHint} compact />
        </View>
        <GoalHealthBadge score={health.score} />
      </View>

      <View style={styles.body}>
        <GoalProgressRing
          percent={progressPercent}
          size={72}
          current={Math.round(goal.currentValue)}
          target={goal.targetValue}
          unit={goal.unit}
        />
        <View style={styles.stats}>
          <Text style={styles.statLine}>
            This week: {Math.round(weekActual)}/{weeklyTarget?.targetValue ?? '—'}{' '}
            {goal.unit}
          </Text>
          {goal.deadlineDate ? (
            <Text style={styles.deadline}>Due {goal.deadlineDate}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function GoalsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🎯</Text>
      <Text style={styles.emptyTitle}>Define what you're building toward</Text>
      <Text style={styles.emptySub}>
        Turn big ambitions into daily actions that connect to your missions and life log.
      </Text>
      <Pressable style={styles.createBtn} onPress={onCreate}>
        <Text style={styles.createBtnText}>Create Your First Goal</Text>
      </Pressable>
      <Text style={styles.examples}>
        Read 24 books · Apply to 500 companies · 1000 pushups
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stats: {
    flex: 1,
    gap: 4,
  },
  statLine: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '600',
  },
  deadline: {
    fontSize: 11,
    color: theme.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: theme.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 16,
  },
  createBtnText: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  examples: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useGoals } from '@/hooks/useGoals';
import { theme } from '@/constants/theme';

export function GoalFocusWidget() {
  const { topFocusGoal, activeGoals } = useGoals();

  if (activeGoals.length === 0) {
    return (
      <Pressable style={styles.card} onPress={() => router.push('/goals/create')}>
        <Text style={styles.emoji}>🎯</Text>
        <View style={styles.body}>
          <Text style={styles.title}>Set a Life Goal</Text>
          <Text style={styles.sub}>Connect daily actions to what matters</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    );
  }

  if (!topFocusGoal) return null;

  const { goal, paceHint, todayActions } = topFocusGoal;
  const todayAction = todayActions.find((a) => !a.done) ?? todayActions[0];

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/goals/[id]', params: { id: goal.id } })}
    >
      <Text style={styles.emoji}>{goal.emoji}</Text>
      <View style={styles.body}>
        <Text style={styles.label}>TODAY'S FOCUS</Text>
        <Text style={styles.title} numberOfLines={1}>
          {goal.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {todayAction?.title ?? paceHint}
        </Text>
      </View>
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {Math.round(goal.currentValue)}/{goal.targetValue}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  emoji: {
    fontSize: 28,
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  sub: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  chevron: {
    color: theme.textMuted,
    fontSize: 22,
  },
  progress: {
    backgroundColor: 'rgba(220,38,38,0.16)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  progressText: {
    color: theme.accent,
    fontWeight: '700',
    fontSize: 13,
  },
});

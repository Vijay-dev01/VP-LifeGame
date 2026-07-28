import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { GoalProgressRing } from '@/components/goals/GoalProgressRing';
import { PaceIndicator, GoalHealthBadge } from '@/components/goals/PaceIndicator';
import { useGoalDetail } from '@/hooks/useGoals';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goal, entries, meta, health } = useGoalDetail(id ?? '');
  const addManualGoalProgress = useStore((s) => s.addManualGoalProgress);
  const pauseGoal = useStore((s) => s.pauseGoal);
  const completeGoal = useStore((s) => s.completeGoal);
  const archiveGoal = useStore((s) => s.archiveGoal);

  if (!goal) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Goal not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const progressPercent =
    goal.targetValue > 0
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : 0;

  const handleManualProgress = () => {
    addManualGoalProgress(goal.id, 1);
  };

  const handleMenu = () => {
    Alert.alert(goal.title, undefined, [
      { text: 'Pause goal', onPress: () => pauseGoal(goal.id) },
      { text: 'Mark complete', onPress: () => completeGoal(goal.id) },
      { text: 'Archive', style: 'destructive', onPress: () => archiveGoal(goal.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Pressable onPress={handleMenu}>
          <Text style={styles.menu}>•••</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>{goal.emoji}</Text>
          <Text style={styles.title}>{goal.title}</Text>
          {goal.motivationNote ? (
            <Text style={styles.motivation}>{goal.motivationNote}</Text>
          ) : null}
        </View>

        <View style={styles.ringRow}>
          <GoalProgressRing
            percent={progressPercent}
            size={120}
            strokeWidth={10}
            current={Math.round(goal.currentValue)}
            target={goal.targetValue}
            unit={goal.unit}
          />
          {health ? <GoalHealthBadge score={health.score} /> : null}
        </View>

        {meta ? (
          <PaceIndicator status={meta.paceStatus} hint={meta.paceHint} />
        ) : null}

        {goal.deadlineDate ? (
          <Text style={styles.deadline}>Deadline: {goal.deadlineDate}</Text>
        ) : null}

        <Pressable style={styles.progressBtn} onPress={handleManualProgress}>
          <Text style={styles.progressBtnText}>+ Log 1 {goal.unit}</Text>
        </Pressable>

        {meta?.weeklyTarget ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This week</Text>
            <Text style={styles.sectionBody}>
              {Math.round(meta.weekActual)} / {meta.weeklyTarget.targetValue} {goal.unit}
            </Text>
          </View>
        ) : null}

        {meta?.todayActions && meta.todayActions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's actions</Text>
            {meta.todayActions.map((a) => (
              <View key={a.id} style={styles.actionRow}>
                <Text style={[styles.actionTitle, a.done && styles.actionDone]}>
                  {a.title}
                </Text>
                <Text style={styles.actionMeta}>
                  {a.actualValue}/{a.targetValue}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress log</Text>
          {entries.length === 0 ? (
            <Text style={styles.emptyLog}>No progress logged yet</Text>
          ) : (
            entries.slice(0, 20).map((e) => (
              <View key={e.id} style={styles.logRow}>
                <Text style={styles.logAmount}>+{e.amount}</Text>
                <View style={styles.logBody}>
                  <Text style={styles.logNote}>{e.note ?? e.source}</Text>
                  <Text style={styles.logDate}>{e.date} · {e.source}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {goal.status === 'completed' ? (
          <View style={styles.completedBanner}>
            <Text style={styles.completedEmoji}>🏆</Text>
            <Text style={styles.completedTitle}>Goal Complete!</Text>
            <Text style={styles.completedSub}>
              You hit {goal.targetValue} {goal.unit}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  back: {
    color: theme.textMuted,
    fontSize: 14,
  },
  menu: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
  },
  motivation: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  deadline: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  progressBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  progressBtnText: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  section: {
    marginTop: 24,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 12,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  actionTitle: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
  },
  actionDone: {
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
  actionMeta: {
    color: theme.textMuted,
    fontSize: 13,
  },
  logRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  logAmount: {
    color: theme.accent,
    fontWeight: '700',
    fontSize: 14,
    minWidth: 36,
  },
  logBody: {
    flex: 1,
  },
  logNote: {
    color: theme.text,
    fontSize: 14,
  },
  logDate: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyLog: {
    color: theme.textMuted,
    fontSize: 13,
  },
  completedBanner: {
    marginTop: 24,
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(22,163,74,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.3)',
  },
  completedEmoji: {
    fontSize: 40,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginTop: 8,
  },
  completedSub: {
    color: theme.textMuted,
    marginTop: 4,
  },
  notFound: {
    color: theme.text,
    textAlign: 'center',
    marginTop: 40,
  },
  backLink: {
    color: theme.accent,
    textAlign: 'center',
    marginTop: 12,
  },
});

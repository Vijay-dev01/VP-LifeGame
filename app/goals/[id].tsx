import React, { useCallback, useState } from 'react';

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

import { AddProgressSheet } from '@/components/goals/AddProgressSheet';

import { GoalActionsSheet } from '@/components/goals/GoalActionsSheet';

import { GoalProgressLog } from '@/components/goals/GoalProgressLog';

import { GoalProgressRing } from '@/components/goals/GoalProgressRing';

import { GoalTodayCard } from '@/components/goals/GoalTodayCard';

import { PaceIndicator, GoalHealthBadge } from '@/components/goals/PaceIndicator';

import { useGoalDetail } from '@/hooks/useGoals';

import { useStore } from '@/store';

import { theme } from '@/constants/theme';



export default function GoalDetailScreen() {

  const { id } = useLocalSearchParams<{ id: string }>();

  const { goal, entries, meta, health } = useGoalDetail(id ?? '');

  const addManualGoalProgress = useStore((s) => s.addManualGoalProgress);
  const deleteLifeGoal = useStore((s) => s.deleteLifeGoal);



  const [showAddProgress, setShowAddProgress] = useState(false);

  const [showActions, setShowActions] = useState(false);

  const [initialAmount, setInitialAmount] = useState(1);



  const openLogSheet = useCallback((amount = 1) => {

    setInitialAmount(amount);

    setShowAddProgress(true);

  }, []);



  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Delete goal?',
      `Remove "${goal?.title}" and all its progress, daily actions, and mission tasks? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteLifeGoal(id);
            router.replace('/(tabs)/goals');
          },
        },
      ]
    );
  }, [deleteLifeGoal, goal?.title, id]);

  const handleQuickLog = useCallback(
    (amount: number) => {
      if (!id) return;
      addManualGoalProgress(id, amount);
    },
    [addManualGoalProgress, id]
  );

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



  const hasProgress = goal.currentValue > 0 || entries.length > 0;

  const weekTarget = meta?.weeklyTarget?.targetValue ?? 0;

  const weekActual = meta?.weekActual ?? 0;

  const weekProgress = weekTarget > 0 ? Math.min(1, weekActual / weekTarget) : 0;



  return (

    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      <View style={styles.topBar}>

        <Pressable onPress={() => router.back()}>

          <Text style={styles.back}>← Back</Text>

        </Pressable>

        <Pressable onPress={() => setShowActions(true)} hitSlop={8}>

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

          {health ? (

            <GoalHealthBadge score={health.score} hasProgress={hasProgress} />

          ) : null}

        </View>



        {meta ? (

          <PaceIndicator status={meta.paceStatus} hint={meta.paceHint} />

        ) : null}



        {goal.deadlineDate ? (

          <Text style={styles.deadline}>Deadline: {goal.deadlineDate}</Text>

        ) : null}



        {goal.status === 'active' ? (

          <GoalTodayCard

            unit={goal.unit}

            todayActions={meta?.todayActions ?? []}

            health={health}

            requiredDailyRate={health?.requiredDailyRate ?? 1}

            onQuickLog={handleQuickLog}

            onCustomLog={() => openLogSheet(1)}

          />

        ) : null}



        {meta?.weeklyTarget ? (

          <View style={styles.section}>

            <Text style={styles.sectionTitle}>This week</Text>

            <View style={styles.weekRow}>

              <View style={styles.weekTrack}>

                <View

                  style={[styles.weekFill, { width: `${Math.round(weekProgress * 100)}%` }]}

                />

              </View>

              <Text style={styles.weekText}>

                {Math.round(weekActual)} / {Math.round(weekTarget)} {goal.unit}

              </Text>

            </View>

          </View>

        ) : null}



        <GoalProgressLog

          entries={entries}

          unit={goal.unit}

          onAddPress={() => openLogSheet(1)}

        />



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



      <AddProgressSheet

        visible={showAddProgress}

        goalId={goal.id}

        unit={goal.unit}

        initialAmount={initialAmount}

        onClose={() => setShowAddProgress(false)}

      />



      <GoalActionsSheet

        visible={showActions}

        goalTitle={goal.title}

        onClose={() => setShowActions(false)}

        onLogProgress={() => openLogSheet(1)}
        onEdit={() =>
          router.push({ pathname: '/goals/edit', params: { goalId: goal.id } })
        }
        onDelete={handleDelete}

      />

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

    marginBottom: 16,

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

    marginBottom: 12,

  },

  deadline: {

    fontSize: 12,

    color: theme.textMuted,

    textAlign: 'center',

    marginTop: 8,

    marginBottom: 4,

  },

  section: {

    marginTop: 16,

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

  weekRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

  },

  weekTrack: {

    flex: 1,

    height: 8,

    backgroundColor: theme.bg,

    borderRadius: 4,

    overflow: 'hidden',

  },

  weekFill: {

    height: '100%',

    backgroundColor: theme.accent,

    borderRadius: 4,

  },

  weekText: {

    fontSize: 13,

    fontWeight: '700',

    color: theme.text,

    minWidth: 88,

    textAlign: 'right',

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



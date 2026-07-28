import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { GoalCard, GoalsEmptyState } from '@/components/goals/GoalCard';
import { useGoals } from '@/hooks/useGoals';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

export default function GoalsTabScreen() {
  const { goalsWithMeta, activeGoals } = useGoals();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    useStore.getState().ensureWeeklyTargetsForActiveGoals();
  }, []);

  const avgHealth =
    goalsWithMeta.length > 0
      ? Math.round(
          goalsWithMeta.reduce((sum, g) => sum + g.health.score, 0) / goalsWithMeta.length
        )
      : null;
  const atRiskCount = goalsWithMeta.filter(
    (g) => g.paceStatus === 'at_risk' || g.paceStatus === 'behind'
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Life Goals</Text>
        <Pressable style={styles.fab} onPress={() => router.push('/goals/create')}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeGoals.length === 0 ? (
          <GoalsEmptyState onCreate={() => router.push('/goals/create')} />
        ) : (
          <>
            {avgHealth !== null ? (
              <View style={styles.overview}>
                <Text style={styles.overviewLabel}>GOAL HEALTH</Text>
                <Text style={styles.overviewValue}>{avgHealth}</Text>
                <Text style={styles.overviewSub}>
                  {atRiskCount > 0
                    ? `${atRiskCount} goal${atRiskCount > 1 ? 's' : ''} need attention`
                    : 'All systems go'}
                </Text>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>ACTIVE GOALS ({activeGoals.length})</Text>
            {goalsWithMeta.map((meta) => (
              <GoalCard key={meta.goal.id} meta={meta} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
  },
  fab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  overview: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 11,
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  overviewValue: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.text,
    marginVertical: 4,
  },
  overviewSub: {
    fontSize: 13,
    color: theme.textMuted,
  },
  sectionLabel: {
    fontSize: 11,
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
});

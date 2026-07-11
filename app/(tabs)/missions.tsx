import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { MissionBoard } from '@/components/MissionBoard';
import { PlanTomorrowSheet } from '@/components/plan/PlanTomorrowSheet';
import { usePlanTomorrow } from '@/hooks/useEngagementModals';
import { theme } from '@/constants/theme';

export default function MissionsScreen() {
  const { showPlan, setShowPlan } = usePlanTomorrow();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <MissionBoard onPlanTomorrow={() => setShowPlan(true)} />
      </ScrollView>
      <PlanTomorrowSheet visible={showPlan} onClose={() => setShowPlan(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});

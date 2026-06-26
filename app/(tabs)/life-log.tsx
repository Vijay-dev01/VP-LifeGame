import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { ActiveTimerBar } from '@/components/life-log/ActiveTimerBar';
import { FloatingAddButton } from '@/components/life-log/FloatingAddButton';
import { LifeLogFiltersBar } from '@/components/life-log/LifeLogFilters';
import { LifeLogTimeline } from '@/components/life-log/LifeLogTimeline';
import { QuickAddBar } from '@/components/life-log/QuickAddBar';
import { RecentActivitiesRow } from '@/components/life-log/RecentActivitiesRow';
import { StopTimerModal } from '@/components/life-log/StopTimerModal';
import { SuggestedNextRow } from '@/components/life-log/SuggestedNextRow';
import { TimeSummary } from '@/components/life-log/TimeSummary';
import { getDefaultTitleForCategory } from '@/constants/lifeLogCategories';
import { useLifeLog } from '@/hooks/useLifeLog';
import { useTimer } from '@/hooks/useTimer';
import { theme } from '@/constants/theme';

export default function LifeLogScreen() {
  const {
    groupedLogs,
    todayTotalMinutes,
    dayTotals,
    recentActivities,
    suggestedNext,
    filters,
    updateFilter,
    clearFilters,
    todayLabel,
  } = useLifeLog();

  const { activeTimer, elapsedSeconds, isRunning, start, stop } = useTimer();
  const [stopModalOpen, setStopModalOpen] = useState(false);

  const handleQuickStart = (categoryId: string) => {
    if (isRunning) {
      Alert.alert('Timer running', 'Stop the current timer before starting a new one.');
      return;
    }
    start(categoryId, getDefaultTitleForCategory(categoryId));
  };

  const handleResume = (category: string, title: string) => {
    if (isRunning) {
      Alert.alert('Timer running', 'Stop the current timer before starting a new one.');
      return;
    }
    start(category, title);
  };

  const handleStopPress = () => {
    setStopModalOpen(true);
  };

  const handleStopSave = (data: Parameters<typeof stop>[0]) => {
    const id = stop(data);
    setStopModalOpen(false);
    if (!id) {
      Alert.alert('Error', 'Could not save activity.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <View style={styles.body}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <TimeSummary
            todayLabel={todayLabel}
            todayTotalMinutes={todayTotalMinutes}
            isRunning={isRunning}
            elapsedSeconds={elapsedSeconds}
            activeTitle={activeTimer?.title}
          />

          {isRunning && activeTimer ? (
            <ActiveTimerBar
              categoryId={activeTimer.category}
              title={activeTimer.title}
              elapsedSeconds={elapsedSeconds}
              onStop={handleStopPress}
            />
          ) : (
            <QuickAddBar onQuickStart={handleQuickStart} disabled={isRunning} />
          )}

          <RecentActivitiesRow
            activities={recentActivities}
            onResume={handleResume}
            disabled={isRunning}
          />
          <SuggestedNextRow
            suggestions={suggestedNext}
            onSelect={handleResume}
            disabled={isRunning}
          />

          <LifeLogFiltersBar filters={filters} onUpdate={updateFilter} onClear={clearFilters} />
          <LifeLogTimeline grouped={groupedLogs} dayTotals={dayTotals} />
        </ScrollView>
        <FloatingAddButton />
      </View>

      <StopTimerModal
        visible={stopModalOpen}
        defaultTitle={activeTimer?.title ?? ''}
        onSave={handleStopSave}
        onCancel={() => setStopModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});

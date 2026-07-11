import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { XPBadge } from '@/components/XPBadge';
import { ActiveTimerBar } from '@/components/life-log/ActiveTimerBar';
import { FloatingAddButton } from '@/components/life-log/FloatingAddButton';
import { ForgotToStopModal } from '@/components/life-log/ForgotToStopModal';
import { LifeLogFiltersBar } from '@/components/life-log/LifeLogFilters';
import { LifeLogTimeline } from '@/components/life-log/LifeLogTimeline';
import { PostStopSuggestionSheet } from '@/components/life-log/PostStopSuggestionSheet';
import { QuickAddBar } from '@/components/life-log/QuickAddBar';
import { RecentActivitiesRow } from '@/components/life-log/RecentActivitiesRow';
import { StopTimerModal } from '@/components/life-log/StopTimerModal';
import { SuggestedNextRow } from '@/components/life-log/SuggestedNextRow';
import { TimeSummary } from '@/components/life-log/TimeSummary';
import { PlanTomorrowSheet } from '@/components/plan/PlanTomorrowSheet';
import { NightlyReflectionModal } from '@/components/reflection/NightlyReflectionModal';
import { getPostStopSuggestions } from '@/constants/contextSuggestions';
import { getDefaultTitleForCategory } from '@/constants/lifeLogCategories';
import { calcActivityXp } from '@/constants/xp';
import { useNightlyReflection, usePlanTomorrow } from '@/hooks/useEngagementModals';
import { useForgotToStop } from '@/hooks/useForgotToStop';
import { useLifeLog } from '@/hooks/useLifeLog';
import { useTimer } from '@/hooks/useTimer';
import { useVoiceLogging } from '@/hooks/useVoiceLogging';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

export default function LifeLogScreen() {
  const params = useLocalSearchParams<{ action?: string }>();
  const pendingStopFromNotification = useStore((s) => s.pendingStopFromNotification);
  const setPendingStopFromNotification = useStore((s) => s.setPendingStopFromNotification);
  const stopTimerAt = useStore((s) => s.stopTimerAt);
  const discardTimer = useStore((s) => s.discardTimer);

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

  const { activeTimer, elapsedSeconds, isRunning, isPaused, start, stop, togglePause } = useTimer();
  const { showModal: showForgotModal, dismiss: dismissForgot } = useForgotToStop();
  const { showModal: showReflection, save: saveReflection, skip: skipReflection } =
    useNightlyReflection();
  const { showPlan, setShowPlan } = usePlanTomorrow();
  const { listening, error: voiceError, toggleListening, lastTranscript } = useVoiceLogging();

  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [postStopOpen, setPostStopOpen] = useState(false);
  const [postStopSuggestions, setPostStopSuggestions] = useState<
    ReturnType<typeof getPostStopSuggestions>
  >([]);
  const [lastStoppedTitle, setLastStoppedTitle] = useState('');
  const [lastXpEarned, setLastXpEarned] = useState(0);

  useEffect(() => {
    if (params.action === 'stop' || pendingStopFromNotification) {
      if (isRunning) setStopModalOpen(true);
      setPendingStopFromNotification(false);
    }
    if (params.action === 'plan') setShowPlan(true);
  }, [params.action, pendingStopFromNotification, isRunning, setPendingStopFromNotification, setShowPlan]);

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
    const timer = activeTimer;
    const xp = timer ? calcActivityXp(timer.category, data?.title ?? timer.title) : 0;
    const id = stop(data);
    setStopModalOpen(false);
    if (!id) {
      Alert.alert('Error', 'Could not save activity.');
      return;
    }
    if (timer) {
      setLastStoppedTitle(data?.title ?? timer.title);
      setPostStopSuggestions(getPostStopSuggestions(timer.category, timer.title));
      setLastXpEarned(xp);
      setPostStopOpen(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <View style={styles.body}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.topRow}>
            <XPBadge compact />
            <Pressable style={styles.planBtn} onPress={() => setShowPlan(true)}>
              <Text style={styles.planBtnText}>Plan Tomorrow</Text>
            </Pressable>
          </View>
          <XPBadge />

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
              isPaused={isPaused}
              onStop={handleStopPress}
              onTogglePause={togglePause}
            />
          ) : (
            <QuickAddBar onQuickStart={handleQuickStart} disabled={isRunning} />
          )}

          <Pressable
            style={[styles.voiceBtn, listening && styles.voiceBtnActive]}
            onPress={toggleListening}
          >
            <Text style={styles.voiceBtnText}>{listening ? '🎙 Listening...' : '🎙 Voice log'}</Text>
          </Pressable>
          {voiceError ? <Text style={styles.voiceError}>{voiceError}</Text> : null}
          {lastTranscript ? <Text style={styles.transcript}>&quot;{lastTranscript}&quot;</Text> : null}
          {lastXpEarned > 0 && !postStopOpen ? (
            <Text style={styles.xpToast}>+{lastXpEarned} XP</Text>
          ) : null}

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

      {activeTimer && (
        <ForgotToStopModal
          visible={showForgotModal}
          timer={activeTimer}
          onContinue={dismissForgot}
          onStopAt={(endTime) => {
            stopTimerAt(endTime);
            dismissForgot();
            setPostStopSuggestions(getPostStopSuggestions(activeTimer.category, activeTimer.title));
            setLastStoppedTitle(activeTimer.title);
            setPostStopOpen(true);
          }}
          onDiscard={() => {
            discardTimer();
            dismissForgot();
          }}
        />
      )}

      <PostStopSuggestionSheet
        visible={postStopOpen}
        activityTitle={lastStoppedTitle}
        suggestions={postStopSuggestions}
        onSelect={handleResume}
        onDismiss={() => setPostStopOpen(false)}
      />

      <PlanTomorrowSheet visible={showPlan} onClose={() => setShowPlan(false)} />

      <NightlyReflectionModal
        visible={showReflection}
        onSave={saveReflection}
        onSkip={skipReflection}
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
    paddingBottom: 100,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planBtn: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  planBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.text,
  },
  voiceBtn: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceBtnActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  voiceBtnText: {
    fontWeight: '700',
    color: theme.text,
    fontSize: 13,
  },
  voiceError: {
    fontSize: 11,
    color: theme.accent,
    marginBottom: 8,
  },
  transcript: {
    fontSize: 11,
    color: theme.textMuted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  xpToast: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.accent,
    marginBottom: 8,
  },
});

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/store';
import {
  CATEGORY_EMOJI,
  GOAL_CATEGORIES,
  GOAL_METRIC_TYPES,
} from '@/constants/goals';
import type { GoalCategory, GoalMetricType } from '@/store/goalTypes';
import { theme } from '@/constants/theme';

function resolveGoalId(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export default function EditGoalScreen() {
  const params = useLocalSearchParams<{ goalId?: string; id?: string }>();
  const goalId = resolveGoalId(params.goalId ?? params.id);

  const goal = useStore((s) =>
    goalId ? s.lifeGoals.find((g) => g.id === goalId) : undefined
  );
  const linkMissionsEnabled = useStore((s) =>
    goalId
      ? s.goalProgressRules.some(
          (r) => r.goalId === goalId && r.source === 'mission' && r.enabled
        )
      : false
  );
  const linkLifeLogEnabled = useStore((s) =>
    goalId
      ? s.goalProgressRules.some(
          (r) => r.goalId === goalId && r.source === 'life_log' && r.enabled
        )
      : false
  );
  const updateLifeGoalDetails = useStore((s) => s.updateLifeGoalDetails);

  const hydratedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [metricType, setMetricType] = useState<GoalMetricType>('count');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('times');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [motivationNote, setMotivationNote] = useState('');
  const [linkMissions, setLinkMissions] = useState(false);
  const [linkLifeLog, setLinkLifeLog] = useState(false);

  useEffect(() => {
    if (!goal || hydratedRef.current) return;
    hydratedRef.current = true;
    setTitle(goal.title);
    setCategory(goal.category);
    setMetricType(goal.metricType);
    setTargetValue(String(goal.targetValue));
    setUnit(goal.unit);
    setHasDeadline(!!goal.deadlineDate);
    setDeadlineDate(goal.deadlineDate ?? '');
    setMotivationNote(goal.motivationNote ?? '');
    setLinkMissions(linkMissionsEnabled);
    setLinkLifeLog(linkLifeLogEnabled);
    setReady(true);
  }, [goal, linkMissionsEnabled, linkLifeLogEnabled]);

  const emoji = useMemo(() => CATEGORY_EMOJI[category], [category]);

  if (!goalId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Missing goal id</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

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

  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={theme.accent} style={styles.loader} />
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    const target = parseFloat(targetValue);
    if (!title.trim() || !target || target <= 0) return;

    updateLifeGoalDetails(goalId, {
      title: title.trim(),
      emoji,
      category,
      metricType,
      targetValue: target,
      unit: unit.trim() || 'times',
      deadlineDate: hasDeadline ? deadlineDate : null,
      motivationNote: motivationNote.trim() || undefined,
      linkMissions,
      linkLifeLog,
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>← Cancel</Text>
          </Pressable>
          <Text style={styles.heading}>Edit Goal</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Goal title"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {GOAL_CATEGORIES.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.chip, category === c.id && styles.chipActive]}
                onPress={() => setCategory(c.id)}
              >
                <Text style={styles.chipText}>
                  {c.emoji} {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Metric</Text>
          <View style={styles.chipRow}>
            {GOAL_METRIC_TYPES.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.chip, metricType === m.id && styles.chipActive]}
                onPress={() => setMetricType(m.id)}
              >
                <Text style={styles.chipText}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Target</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targetValue}
                onChangeText={setTargetValue}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="companies"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          <Pressable style={styles.toggleRow} onPress={() => setHasDeadline(!hasDeadline)}>
            <Text style={styles.toggleLabel}>Deadline</Text>
            <Text style={styles.toggleValue}>{hasDeadline ? 'ON' : 'OFF'}</Text>
          </Pressable>
          {hasDeadline ? (
            <TextInput
              style={styles.input}
              value={deadlineDate}
              onChangeText={setDeadlineDate}
              placeholder="yyyy-MM-dd"
              placeholderTextColor={theme.textMuted}
            />
          ) : null}

          <Text style={styles.label}>Why it matters</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={motivationNote}
            onChangeText={setMotivationNote}
            placeholder="Optional motivation"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.sectionTitle}>Auto-count from</Text>
          <Pressable style={styles.toggleRow} onPress={() => setLinkMissions(!linkMissions)}>
            <Text style={styles.toggleLabel}>Missions</Text>
            <Text style={styles.toggleValue}>{linkMissions ? 'ON' : 'OFF'}</Text>
          </Pressable>
          <Pressable style={styles.toggleRow} onPress={() => setLinkLifeLog(!linkLifeLog)}>
            <Text style={styles.toggleLabel}>Life Log</Text>
            <Text style={styles.toggleValue}>{linkLifeLog ? 'ON' : 'OFF'}</Text>
          </Pressable>

          <Text style={styles.hint}>
            Progress you've already logged is kept. Changing target or deadline updates pace
            tracking only.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryBtn, !title.trim() && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={!title.trim()}
          >
            <Text style={styles.primaryBtnText}>Save changes</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  flex: { flex: 1 },
  loader: {
    marginTop: 48,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  back: {
    color: theme.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    fontSize: 12,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
    backgroundColor: theme.surface,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.surface,
  },
  chipActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.16)',
  },
  chipText: {
    color: theme.text,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginTop: 8,
  },
  toggleLabel: {
    color: theme.text,
    fontSize: 15,
  },
  toggleValue: {
    color: theme.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginTop: 20,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 18,
    marginTop: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  primaryBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 15,
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

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { addMonths, format } from 'date-fns';
import { useStore } from '@/store';
import {
  CATEGORY_EMOJI,
  GOAL_CATEGORIES,
  GOAL_EXAMPLES,
  GOAL_METRIC_TYPES,
} from '@/constants/goals';
import type { GoalCategory, GoalMetricType } from '@/store/goalTypes';
import { suggestKeywordsFromTitle } from '@/utils/goalMatching';
import {
  computeDailyTargetValue,
  computeWeeklyTargetValue,
} from '@/utils/goalDecomposition';
import { theme } from '@/constants/theme';

const STEPS = ['Define', 'Link', 'Launch'] as const;

function parseTargetFromTitle(title: string): { value: number; unit: string } | null {
  const m = title.match(/(\d[\d,]*)\s*(books?|companies?|pushups?|strangers?|kg|minutes?|mins?)?/i);
  if (!m) return null;
  const value = parseInt(m[1].replace(/,/g, ''), 10);
  let unit = m[2]?.toLowerCase() ?? 'times';
  if (unit.startsWith('book')) unit = 'books';
  if (unit.startsWith('compan')) unit = 'companies';
  if (unit.startsWith('pushup')) unit = 'pushups';
  if (unit.startsWith('stranger')) unit = 'strangers';
  if (unit.startsWith('min')) unit = 'minutes';
  return { value, unit };
}

function guessCategory(title: string): GoalCategory {
  const lower = title.toLowerCase();
  if (/apply|job|company|career|saas|build/.test(lower)) return 'career';
  if (/pushup|gym|workout|lose|kg|health|run/.test(lower)) return 'health';
  if (/read|book|learn|study/.test(lower)) return 'learning';
  if (/save|money|₹|rupee|finance/.test(lower)) return 'finance';
  if (/stranger|talk|social|network/.test(lower)) return 'social';
  return 'personal';
}

export default function CreateGoalScreen() {
  const addLifeGoal = useStore((s) => s.addLifeGoal);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [metricType, setMetricType] = useState<GoalMetricType>('count');
  const [targetValue, setTargetValue] = useState('24');
  const [unit, setUnit] = useState('times');
  const [hasDeadline, setHasDeadline] = useState(true);
  const [motivationNote, setMotivationNote] = useState('');
  const [linkMissions, setLinkMissions] = useState(true);
  const [linkLifeLog, setLinkLifeLog] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const defaultDeadline = format(addMonths(new Date(), 6), 'yyyy-MM-dd');
  const [deadlineDate, setDeadlineDate] = useState(defaultDeadline);

  const weeklyPreview = useMemo(() => {
    const target = parseFloat(targetValue) || 0;
    const remaining = target;
    return computeWeeklyTargetValue(remaining, hasDeadline ? deadlineDate : null, today);
  }, [targetValue, hasDeadline, deadlineDate, today]);
  const dailyPreview = useMemo(
    () => computeDailyTargetValue(weeklyPreview),
    [weeklyPreview]
  );
  const keywords = useMemo(
    () => suggestKeywordsFromTitle(title || 'goal'),
    [title]
  );

  const applyExample = (example: string) => {
    setTitle(example);
    const p = parseTargetFromTitle(example);
    if (p) {
      setTargetValue(String(p.value));
      setUnit(p.unit);
    }
    setCategory(guessCategory(example));
    if (/minute|duration|hour/.test(example.toLowerCase())) {
      setMetricType('duration_minutes');
    }
  };

  const handleTitleChange = (t: string) => {
    setTitle(t);
    const p = parseTargetFromTitle(t);
    if (p) {
      setTargetValue(String(p.value));
      setUnit(p.unit);
      setCategory(guessCategory(t));
    }
  };

  const handleCreate = () => {
    const target = parseFloat(targetValue);
    if (!title.trim() || !target || target <= 0) return;

    const rules = [];
    if (linkMissions) {
      rules.push({
        source: 'mission' as const,
        matchType: 'keyword' as const,
        matchValue: keywords,
        incrementValue: 1,
        enabled: true,
      });
    }
    if (linkLifeLog) {
      rules.push({
        source: 'life_log' as const,
        matchType: 'keyword' as const,
        matchValue: keywords,
        incrementValue: metricType === 'duration_minutes' ? 0 : 1,
        enabled: true,
      });
    }

    const id = addLifeGoal({
      title: title.trim(),
      emoji: CATEGORY_EMOJI[category],
      category,
      metricType,
      targetValue: target,
      unit: unit.trim() || 'times',
      deadlineDate: hasDeadline ? deadlineDate : null,
      motivationNote: motivationNote.trim() || undefined,
      progressRules: rules,
    });

    router.replace({ pathname: '/goals/[id]', params: { id } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.heading}>New Life Goal</Text>
          <View style={styles.stepRow}>
            {STEPS.map((s, i) => (
              <View
                key={s}
                style={[styles.stepDot, i <= step && styles.stepDotActive]}
              />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {step === 0 ? (
            <>
              <Text style={styles.label}>What do you want to achieve?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Read 24 books"
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={handleTitleChange}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examples}>
                {GOAL_EXAMPLES.map((ex) => (
                  <Pressable key={ex} style={styles.exampleChip} onPress={() => applyExample(ex)}>
                    <Text style={styles.exampleText}>{ex}</Text>
                  </Pressable>
                ))}
              </ScrollView>

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
                    onPress={() => {
                      setMetricType(m.id);
                      if (m.id === 'duration_minutes' && unit === 'times') setUnit('minutes');
                    }}
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
                    placeholder="books"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              <Pressable
                style={styles.toggleRow}
                onPress={() => setHasDeadline(!hasDeadline)}
              >
                <Text style={styles.toggleLabel}>Set deadline</Text>
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

              <Text style={styles.label}>Why does this matter?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                value={motivationNote}
                onChangeText={setMotivationNote}
                placeholder="Optional motivation note"
                placeholderTextColor={theme.textMuted}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={styles.sectionTitle}>Auto-count progress from</Text>
              <Pressable style={styles.toggleRow} onPress={() => setLinkMissions(!linkMissions)}>
                <Text style={styles.toggleLabel}>Missions (task completion)</Text>
                <Text style={styles.toggleValue}>{linkMissions ? 'ON' : 'OFF'}</Text>
              </Pressable>
              <Pressable style={styles.toggleRow} onPress={() => setLinkLifeLog(!linkLifeLog)}>
                <Text style={styles.toggleLabel}>Life Log (activity tracking)</Text>
                <Text style={styles.toggleValue}>{linkLifeLog ? 'ON' : 'OFF'}</Text>
              </Pressable>
              <Text style={styles.hint}>
                Matching keywords: {keywords.split('|').join(', ')}
              </Text>
              <Text style={styles.hint}>
                Completing missions or stopping timers with these words in the title will
                automatically count toward your goal.
              </Text>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={styles.sectionTitle}>Your plan</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryEmoji}>{CATEGORY_EMOJI[category]}</Text>
                <Text style={styles.summaryTitle}>{title || 'Untitled goal'}</Text>
                <Text style={styles.summaryMeta}>
                  Target: {targetValue || '—'} {unit}
                </Text>
                {hasDeadline ? (
                  <Text style={styles.summaryMeta}>Deadline: {deadlineDate}</Text>
                ) : (
                  <Text style={styles.summaryMeta}>No deadline</Text>
                )}
                <View style={styles.divider} />
                <Text style={styles.planLine}>~{weeklyPreview} {unit}/week</Text>
                <Text style={styles.planLine}>~{dailyPreview} {unit}/day (Mon–Fri)</Text>
                <Text style={styles.planHint}>
                  Daily actions will appear on your Missions board automatically.
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 ? (
            <Pressable style={styles.secondaryBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.flex} />
          )}
          {step < STEPS.length - 1 ? (
            <Pressable
              style={[styles.primaryBtn, !title.trim() && styles.primaryBtnDisabled]}
              onPress={() => setStep(step + 1)}
              disabled={!title.trim()}
            >
              <Text style={styles.primaryBtnText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.primaryBtn} onPress={handleCreate}>
              <Text style={styles.primaryBtnText}>Start Goal</Text>
            </Pressable>
          )}
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
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
  },
  stepDotActive: {
    backgroundColor: theme.accent,
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
  examples: {
    marginTop: 10,
    marginBottom: 4,
  },
  exampleChip: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: theme.surface,
  },
  exampleText: {
    color: theme.textMuted,
    fontSize: 12,
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
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 20,
    marginTop: 12,
  },
  summaryCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryMeta: {
    fontSize: 13,
    color: theme.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    width: '100%',
    marginVertical: 16,
  },
  planLine: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 6,
  },
  planHint: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  primaryBtn: {
    flex: 1,
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
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: theme.text,
    fontWeight: '600',
  },
});

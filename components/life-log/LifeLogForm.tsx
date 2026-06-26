import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LIFE_LOG_CATEGORIES } from '@/constants/lifeLogCategories';
import type { LifeLogIntent, LifeLogMood } from '@/store';
import { MOODS, MOOD_EMOJI, calcDurationMinutes, formatDuration } from '@/utils/lifeLog';
import { theme } from '@/constants/theme';
import { formatDateTimeLabel, openAndroidDateTimePicker } from './dateTimePicker';

export interface LifeLogFormValues {
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  notes: string;
  energyLevel: number | undefined;
  mood: LifeLogMood | undefined;
  intentType: LifeLogIntent;
}

interface LifeLogFormProps {
  initial: LifeLogFormValues;
  onSubmit: (values: LifeLogFormValues) => void;
  submitLabel?: string;
  extraActions?: React.ReactNode;
}

type PickerField = 'start' | 'end' | null;

export function LifeLogForm({
  initial,
  onSubmit,
  submitLabel = 'Save',
  extraActions,
}: LifeLogFormProps) {
  const [values, setValues] = useState<LifeLogFormValues>(initial);
  const [pickerField, setPickerField] = useState<PickerField>(null);

  const duration = calcDurationMinutes(values.startTime, values.endTime);

  const set = <K extends keyof LifeLogFormValues>(key: K, val: LifeLogFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const applyDateTime = (field: 'start' | 'end', date: Date) => {
    const iso = date.toISOString();
    if (field === 'start') set('startTime', iso);
    else set('endTime', iso);
  };

  const openPicker = (field: 'start' | 'end') => {
    if (Platform.OS === 'android') {
      const current = new Date(field === 'start' ? values.startTime : values.endTime);
      openAndroidDateTimePicker(current, (date) => applyDateTime(field, date));
      return;
    }
    setPickerField(field);
  };

  const handleIosPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setPickerField(null);
      return;
    }
    if (!date || !pickerField) return;
    applyDateTime(pickerField, date);
  };

  const pickerValue = pickerField
    ? new Date(pickerField === 'start' ? values.startTime : values.endTime)
    : new Date();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>ACTIVITY NAME</Text>
        <TextInput
          style={styles.input}
          value={values.title}
          onChangeText={(v) => set('title', v)}
          placeholder="What were you doing?"
          placeholderTextColor={theme.textMuted}
        />

        <Text style={styles.label}>CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {LIFE_LOG_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.catChip,
                values.category === cat.id && {
                  backgroundColor: `${cat.color}22`,
                  borderColor: cat.color,
                },
              ]}
              onPress={() => set('category', cat.id)}
            >
              <Text
                style={[
                  styles.catChipText,
                  values.category === cat.id && { color: cat.color },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>START & END TIME</Text>
        <View style={styles.timeRow}>
          <Pressable style={styles.timeBtn} onPress={() => openPicker('start')}>
            <Text style={styles.timeBtnLabel}>Start</Text>
            <Text style={styles.timeBtnValue}>{formatDateTimeLabel(values.startTime)}</Text>
          </Pressable>
          <Pressable style={styles.timeBtn} onPress={() => openPicker('end')}>
            <Text style={styles.timeBtnLabel}>End</Text>
            <Text style={styles.timeBtnValue}>{formatDateTimeLabel(values.endTime)}</Text>
          </Pressable>
        </View>
        <Text style={styles.duration}>Duration: {formatDuration(duration)}</Text>

        {Platform.OS === 'ios' && pickerField ? (
          <View style={styles.iosPickerWrap}>
            <DateTimePicker
              value={pickerValue}
              mode="datetime"
              display="spinner"
              onChange={handleIosPickerChange}
            />
            <Pressable style={styles.donePicker} onPress={() => setPickerField(null)}>
              <Text style={styles.donePickerText}>Done</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.label}>NOTES</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          value={values.notes}
          onChangeText={(v) => set('notes', v)}
          placeholder="Optional notes"
          placeholderTextColor={theme.textMuted}
          multiline
        />

        <Text style={styles.label}>ENERGY (1–5)</Text>
        <View style={styles.segmentRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              style={[styles.segment, values.energyLevel === n && styles.segmentOn]}
              onPress={() => set('energyLevel', values.energyLevel === n ? undefined : n)}
            >
              <Text style={[styles.segmentText, values.energyLevel === n && styles.segmentTextOn]}>
                {n}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>MOOD</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <Pressable
              key={m}
              style={[styles.moodChip, values.mood === m && styles.moodChipOn]}
              onPress={() => set('mood', values.mood === m ? undefined : m)}
            >
              <Text style={styles.moodEmoji}>{MOOD_EMOJI[m]}</Text>
              <Text style={[styles.moodText, values.mood === m && styles.moodTextOn]}>{m}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>INTENT</Text>
        <View style={styles.segmentRow}>
          {(['planned', 'unplanned'] as LifeLogIntent[]).map((intent) => (
            <Pressable
              key={intent}
              style={[styles.intentBtn, values.intentType === intent && styles.segmentOn]}
              onPress={() => set('intentType', intent)}
            >
              <Text
                style={[
                  styles.intentText,
                  values.intentType === intent && styles.segmentTextOn,
                ]}
              >
                {intent}
              </Text>
            </Pressable>
          ))}
        </View>

        {extraActions}

        <Pressable style={styles.saveBtn} onPress={() => onSubmit(values)}>
          <Text style={styles.saveBtnText}>{submitLabel}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
  },
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  catScroll: {
    marginBottom: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    backgroundColor: theme.surfaceLight,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeBtn: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
  },
  timeBtnLabel: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeBtnValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  duration: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 8,
    fontWeight: '600',
  },
  iosPickerWrap: {
    marginTop: 8,
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  donePicker: {
    alignSelf: 'flex-end',
    padding: 12,
  },
  donePickerText: {
    color: theme.accent,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceLight,
  },
  segmentOn: {
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderColor: theme.accent,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textMuted,
  },
  segmentTextOn: {
    color: theme.accent,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceLight,
    minWidth: 56,
  },
  moodChipOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.12)',
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodText: {
    fontSize: 9,
    color: theme.textMuted,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  moodTextOn: {
    color: theme.accent,
    fontWeight: '700',
  },
  intentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    backgroundColor: theme.surfaceLight,
  },
  intentText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'capitalize',
  },
  saveBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

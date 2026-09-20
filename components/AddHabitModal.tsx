import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useStore, type Habit } from '@/store';
import { theme } from '@/constants/theme';
import { ALL_ACTIVE_DAYS, WEEKDAY_LABELS, normalizeActiveDays } from '@/utils/habitSchedule';

const EMOJIS = [
  '😴',
  '🥗',
  '🏃',
  '📖',
  '🏋️',
  '🧘',
  '🚿',
  '✅',
  '📝',
  '⏰',
  '💧',
  '🧠',
  '🎯',
  '🎧',
  '🛌',
  '📚',
  '🛡️',
  '🌿',
  '🔥',
  '🎨',
];

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  habit?: Habit | null;
}

export function AddHabitModal({ visible, onClose, habit }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:30');
  const [activeDays, setActiveDays] = useState<number[]>([...ALL_ACTIVE_DAYS]);
  const addHabit = useStore((s) => s.addHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const isEdit = !!habit;

  useEffect(() => {
    if (!visible) return;
    if (habit) {
      setName(habit.name);
      setEmoji(habit.emoji);
      setNotificationsEnabled(!!habit.notificationsEnabled);
      setReminderTime(habit.reminderTime || '08:30');
      setActiveDays(normalizeActiveDays(habit.activeDays));
    } else {
      setName('');
      setEmoji(EMOJIS[0]);
      setNotificationsEnabled(false);
      setReminderTime('08:30');
      setActiveDays([...ALL_ACTIVE_DAYS]);
    }
  }, [visible, habit]);

  const toggleDay = (day: number) => {
    setActiveDays((prev) => {
      const has = prev.includes(day);
      if (has && prev.length === 1) return prev;
      return has ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b);
    });
  };

  const submit = () => {
    const t = name.trim();
    const cleanedTime = reminderTime.trim();
    const hasValidTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(cleanedTime);
    if (notificationsEnabled && !hasValidTime) {
      Alert.alert('Invalid time', 'Use 24h format HH:mm, e.g. 08:30');
      return;
    }
    if (!t) return;
    const payload = {
      name: t,
      emoji,
      notificationsEnabled,
      reminderTime: notificationsEnabled ? cleanedTime : null,
      activeDays: normalizeActiveDays(activeDays),
    };
    if (habit) updateHabit(habit.id, payload);
    else addHabit(payload);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.centered}
        >
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>{isEdit ? 'Edit habit' : 'Add habit'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Habit name"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
              />
              <Text style={styles.emojiLabel}>Emoji</Text>
              <View style={styles.emojiRow}>
                {EMOJIS.map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => setEmoji(e)}
                    style={[styles.emojiBtn, emoji === e && styles.emojiBtnSel]}
                  >
                    <Text style={styles.emoji}>{e}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.emojiLabel}>Or type / paste emoji</Text>
              <TextInput
                style={styles.emojiInput}
                placeholder="😀"
                placeholderTextColor={theme.textMuted}
                value={emoji}
                onChangeText={(t) => setEmoji(t.trim())}
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="default"
              />

              <Text style={styles.emojiLabel}>Active days</Text>
              <View style={styles.dayRow}>
                {WEEKDAY_LABELS.map((label, day) => {
                  const on = activeDays.includes(day);
                  return (
                    <Pressable
                      key={`${label}-${day}`}
                      onPress={() => toggleDay(day)}
                      style={[styles.dayBtn, on && styles.dayBtnOn]}
                    >
                      <Text style={[styles.dayBtnText, on && styles.dayBtnTextOn]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.notifyRow}>
                <Text style={styles.notifyLabel}>Habit reminder</Text>
                <Pressable
                  onPress={() => setNotificationsEnabled((v) => !v)}
                  style={[styles.toggleBtn, notificationsEnabled && styles.toggleBtnOn]}
                >
                  <Text style={styles.toggleBtnText}>
                    {notificationsEnabled ? 'ON' : 'OFF'}
                  </Text>
                </Pressable>
              </View>

              {notificationsEnabled ? (
                <TextInput
                  style={styles.timeInput}
                  placeholder="HH:mm"
                  placeholderTextColor={theme.textMuted}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  autoCorrect={false}
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              ) : null}

              <View style={styles.actions}>
                <Pressable onPress={onClose} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={submit} style={styles.submitBtn}>
                  <Text style={styles.submitText}>{isEdit ? 'Save' : 'Add'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  centered: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    color: theme.text,
    fontSize: 16,
    marginBottom: 16,
  },
  emojiLabel: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 8,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  emojiBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceLight,
  },
  emojiBtnSel: {
    backgroundColor: theme.accent,
  },
  emoji: {
    fontSize: 22,
  },
  emojiInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    color: theme.text,
    fontSize: 18,
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 4,
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceLight,
  },
  dayBtnOn: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  dayBtnText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  dayBtnTextOn: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  notifyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  notifyLabel: {
    color: theme.textMuted,
    fontSize: 14,
  },
  toggleBtn: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.surfaceLight,
  },
  toggleBtnOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.2)',
  },
  toggleBtnText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 10,
    color: theme.text,
    fontSize: 16,
    marginBottom: 16,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: theme.textMuted,
  },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.accent,
    borderRadius: 8,
  },
  submitText: {
    color: theme.text,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { LifeLogIntent, LifeLogMood } from '@/store';
import { MOODS, MOOD_EMOJI } from '@/utils/lifeLog';
import { theme } from '@/constants/theme';

interface StopTimerModalProps {
  visible: boolean;
  defaultTitle: string;
  onSave: (data: {
    title: string;
    notes?: string;
    mood?: LifeLogMood;
    energyLevel?: number;
    intentType?: LifeLogIntent;
  }) => void;
  onCancel: () => void;
}

export function StopTimerModal({ visible, defaultTitle, onSave, onCancel }: StopTimerModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<LifeLogMood | undefined>();
  const [energy, setEnergy] = useState<number | undefined>();
  const [intent, setIntent] = useState<LifeLogIntent>('unplanned');

  React.useEffect(() => {
    if (visible) {
      setTitle(defaultTitle);
      setNotes('');
      setMood(undefined);
      setEnergy(undefined);
      setIntent('unplanned');
    }
  }, [visible, defaultTitle]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Save activity</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Activity name"
              placeholderTextColor={theme.textMuted}
            />
            <TextInput
              style={[styles.input, styles.notes]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={theme.textMuted}
              multiline
            />
            <View style={styles.moodRow}>
              {MOODS.map((m) => (
                <Pressable
                  key={m}
                  style={[styles.moodChip, mood === m && styles.moodOn]}
                  onPress={() => setMood(mood === m ? undefined : m)}
                >
                  <Text>{MOOD_EMOJI[m]}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.energyRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  style={[styles.energyBtn, energy === n && styles.energyOn]}
                  onPress={() => setEnergy(energy === n ? undefined : n)}
                >
                  <Text style={styles.energyText}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.intentRow}>
              {(['planned', 'unplanned'] as LifeLogIntent[]).map((i) => (
                <Pressable
                  key={i}
                  style={[styles.intentBtn, intent === i && styles.intentOn]}
                  onPress={() => setIntent(i)}
                >
                  <Text style={[styles.intentText, intent === i && styles.intentTextOn]}>{i}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={styles.saveBtn}
              onPress={() =>
                onSave({
                  title: title.trim() || defaultTitle,
                  notes: notes.trim() || undefined,
                  mood,
                  energyLevel: energy,
                  intentType: intent,
                })
              }
            >
              <Text style={styles.saveText}>Save & stop</Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    color: theme.text,
    marginBottom: 10,
  },
  notes: {
    minHeight: 60,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  moodChip: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  moodOn: {
    borderColor: theme.accent,
  },
  energyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  energyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.12)',
  },
  energyText: {
    color: theme.text,
    fontWeight: '700',
  },
  intentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  intentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  intentOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.12)',
  },
  intentText: {
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  intentTextOn: {
    color: theme.accent,
  },
  saveBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
  },
});

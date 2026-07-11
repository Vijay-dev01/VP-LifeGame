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
import type { DistractionType } from '@/store';
import { theme } from '@/constants/theme';

const OPTIONS: { id: DistractionType; label: string }[] = [
  { id: 'meeting', label: 'Meeting' },
  { id: 'phone', label: 'Phone' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'nothing', label: 'Nothing' },
];

interface NightlyReflectionModalProps {
  visible: boolean;
  onSave: (distraction: DistractionType, note?: string) => void;
  onSkip: () => void;
}

export function NightlyReflectionModal({ visible, onSave, onSkip }: NightlyReflectionModalProps) {
  const [selected, setSelected] = useState<DistractionType | null>(null);
  const [note, setNote] = useState('');

  React.useEffect(() => {
    if (visible) {
      setSelected(null);
      setNote('');
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onSkip}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>What distracted you today?</Text>
            <View style={styles.chipRow}>
              {OPTIONS.map((opt) => (
                <Pressable
                  key={opt.id}
                  style={[styles.chip, selected === opt.id && styles.chipOn]}
                  onPress={() => setSelected(opt.id)}
                >
                  <Text style={[styles.chipText, selected === opt.id && styles.chipTextOn]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="Optional note..."
              placeholderTextColor={theme.textMuted}
            />
            <Pressable
              style={[styles.saveBtn, !selected && styles.saveBtnDisabled]}
              disabled={!selected}
              onPress={() => selected && onSave(selected, note.trim() || undefined)}
            >
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>Skip</Text>
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
    fontSize: 17,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.12)',
  },
  chipText: {
    fontWeight: '700',
    color: theme.textMuted,
  },
  chipTextOn: {
    color: theme.accent,
  },
  input: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    color: theme.text,
    marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    color: theme.textMuted,
    fontWeight: '600',
  },
});

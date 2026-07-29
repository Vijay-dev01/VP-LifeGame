import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

interface AddProgressSheetProps {
  visible: boolean;
  goalId: string;
  unit: string;
  initialAmount?: number;
  onClose: () => void;
}

export function AddProgressSheet({
  visible,
  goalId,
  unit,
  initialAmount = 1,
  onClose,
}: AddProgressSheetProps) {
  const addManualGoalProgress = useStore((s) => s.addManualGoalProgress);
  const [amount, setAmount] = useState(String(initialAmount));
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount(String(initialAmount));
      setNote('');
    }
  }, [visible, initialAmount]);

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    addManualGoalProgress(goalId, parsed, note.trim() || undefined);
    onClose();
  };

  const parsed = parseFloat(amount);
  const canSubmit = Number.isFinite(parsed) && parsed > 0;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Log Progress</Text>
      <Text style={styles.subtitle}>Add progress toward your goal</Text>

      <Text style={styles.label}>Amount ({unit})</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="1"
        placeholderTextColor={theme.textMuted}
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        value={note}
        onChangeText={setNote}
        placeholder="What did you accomplish?"
        placeholderTextColor={theme.textMuted}
        multiline
      />

      <View style={styles.actions}>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitText}>Log Progress</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.bg,
    marginBottom: 16,
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: theme.textMuted,
    fontWeight: '700',
    fontSize: 15,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 15,
  },
});

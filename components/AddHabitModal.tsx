import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

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

export function AddHabitModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const addHabit = useStore((s) => s.addHabit);

  const submit = () => {
    const t = name.trim();
    if (t) {
      addHabit({ name: t, emoji });
      setName('');
      setEmoji(EMOJIS[0]);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
        >
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Add habit</Text>
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

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submit} style={styles.submitBtn}>
                <Text style={styles.submitText}>Add</Text>
              </Pressable>
            </View>
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
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
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

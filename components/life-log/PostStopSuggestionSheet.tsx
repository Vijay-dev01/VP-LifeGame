import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ContextSuggestion } from '@/constants/contextSuggestions';
import { theme } from '@/constants/theme';

interface PostStopSuggestionSheetProps {
  visible: boolean;
  activityTitle: string;
  suggestions: ContextSuggestion[];
  onSelect: (category: string, title: string) => void;
  onDismiss: () => void;
}

export function PostStopSuggestionSheet({
  visible,
  activityTitle,
  suggestions,
  onSelect,
  onDismiss,
}: PostStopSuggestionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Nice work on {activityTitle}</Text>
          <Text style={styles.subtitle}>What&apos;s next?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {suggestions.map((s) => (
              <Pressable
                key={s.label}
                style={styles.chip}
                onPress={() => {
                  onSelect(s.category, s.title);
                  onDismiss();
                }}
              >
                <Text style={styles.chipText}>{s.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.skipBtn} onPress={onDismiss}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  },
  subtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 14,
    marginTop: 4,
  },
  row: {
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: {
    color: theme.textMuted,
    fontWeight: '600',
  },
});

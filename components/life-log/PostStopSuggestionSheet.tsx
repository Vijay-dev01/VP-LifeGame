import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ContextSuggestion } from '@/constants/contextSuggestions';
import { AddNextItemForm } from '@/components/life-log/AddNextItemForm';
import { useStore } from '@/store';
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
  const customNextItems = useStore((s) => s.customNextItems);
  const [adding, setAdding] = useState(false);

  const customs: ContextSuggestion[] = customNextItems.map((item) => ({
    label: item.title,
    category: item.category,
    title: item.title,
  }));
  const seen = new Set(customs.map((c) => c.title.trim().toLowerCase()));
  const merged = [
    ...customs,
    ...suggestions.filter((s) => !seen.has(s.title.trim().toLowerCase())),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Nice work on {activityTitle}</Text>
              <Text style={styles.subtitle}>What&apos;s next?</Text>
            </View>
            <Pressable style={styles.addIcon} onPress={() => setAdding((v) => !v)}>
              <Text style={styles.addIconText}>{adding ? '×' : '+'}</Text>
            </Pressable>
          </View>
          {adding ? <AddNextItemForm onAdded={() => setAdding(false)} /> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {merged.map((s, i) => (
              <Pressable
                key={`${s.label}-${i}`}
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconText: {
    color: theme.accent,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  row: {
    gap: 8,
    paddingBottom: 12,
    paddingTop: 8,
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

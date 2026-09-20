import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DEFAULT_SUGGESTIONS } from '@/constants/contextSuggestions';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

interface AddNextItemFormProps {
  defaultCategory?: string;
  onAdded?: () => void;
}

export function AddNextItemForm({ defaultCategory = 'deep-work', onAdded }: AddNextItemFormProps) {
  const addCustomNextItem = useStore((s) => s.addCustomNextItem);
  const [title, setTitle] = useState('');

  const save = (category: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    addCustomNextItem({ category, title: trimmed });
    setTitle('');
    onAdded?.();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Add what's next"
          placeholderTextColor={theme.textMuted}
          onSubmitEditing={() => save(defaultCategory, title)}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={() => save(defaultCategory, title)}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>
      <View style={styles.chips}>
        {DEFAULT_SUGGESTIONS.map((s) => (
          <Pressable key={s.label} style={styles.chip} onPress={() => save(s.category, s.title)}>
            <Text style={styles.chipText}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
  },
  addBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.surfaceLight,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.text,
  },
});

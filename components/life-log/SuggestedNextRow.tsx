import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddNextItemForm } from '@/components/life-log/AddNextItemForm';
import { useResolvedCategory } from '@/hooks/useResolvedCategories';
import { theme } from '@/constants/theme';

interface ActivityChip {
  category: string;
  title: string;
}

interface SuggestedNextRowProps {
  suggestions: ActivityChip[];
  onSelect: (category: string, title: string) => void;
  disabled?: boolean;
  title?: string;
  defaultCategory?: string;
}

function SuggestionChip({
  category,
  title,
  disabled,
  onSelect,
}: {
  category: string;
  title: string;
  disabled?: boolean;
  onSelect: (category: string, title: string) => void;
}) {
  const cat = useResolvedCategory(category);
  return (
    <Pressable
      style={[styles.chip, cat && { backgroundColor: `${cat.color}14` }]}
      disabled={disabled}
      onPress={() => onSelect(category, title)}
    >
      <Text style={styles.chipTitle} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

export function SuggestedNextRow({
  suggestions,
  onSelect,
  disabled,
  title = 'SUGGESTED NEXT',
  defaultCategory = 'deep-work',
}: SuggestedNextRowProps) {
  const [adding, setAdding] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable style={styles.addIcon} onPress={() => setAdding((v) => !v)} hitSlop={8}>
          <Text style={styles.addIconText}>{adding ? '×' : '+'}</Text>
        </Pressable>
      </View>
      {adding ? (
        <AddNextItemForm defaultCategory={defaultCategory} onAdded={() => setAdding(false)} />
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {suggestions.map((s, i) => (
          <SuggestionChip
            key={`${s.category}-${s.title}-${i}`}
            category={s.category}
            title={s.title}
            disabled={disabled}
            onSelect={onSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceLight,
  },
  addIconText: {
    color: theme.accent,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  row: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: theme.surfaceLight,
  },
  chipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
});

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCategoryById } from '@/constants/lifeLogCategories';
import { theme } from '@/constants/theme';

interface ActivityChip {
  category: string;
  title: string;
}

interface SuggestedNextRowProps {
  suggestions: ActivityChip[];
  onSelect: (category: string, title: string) => void;
  disabled?: boolean;
}

export function SuggestedNextRow({ suggestions, onSelect, disabled }: SuggestedNextRowProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>SUGGESTED NEXT</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {suggestions.map((s, i) => {
          const cat = getCategoryById(s.category);
          return (
            <Pressable
              key={`${s.category}-${i}`}
              style={[styles.chip, cat && { backgroundColor: `${cat.color}14` }]}
              disabled={disabled}
              onPress={() => onSelect(s.category, s.title)}
            >
              <Text style={styles.chipTitle} numberOfLines={1}>
                {s.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
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

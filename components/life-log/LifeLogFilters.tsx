import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LIFE_LOG_CATEGORIES } from '@/constants/lifeLogCategories';
import type { LifeLogFilters } from '@/hooks/useLifeLog';
import type { LifeLogIntent, LifeLogMood } from '@/store';
import { MOODS } from '@/utils/lifeLog';
import { theme } from '@/constants/theme';

interface LifeLogFiltersBarProps {
  filters: LifeLogFilters;
  onUpdate: <K extends keyof LifeLogFilters>(key: K, value: LifeLogFilters[K]) => void;
  onClear: () => void;
}

export function LifeLogFiltersBar({ filters, onUpdate, onClear }: LifeLogFiltersBarProps) {
  const hasFilters =
    filters.category || filters.mood || filters.intentType || filters.searchQuery.trim();

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.search}
        placeholder="Search activities..."
        placeholderTextColor={theme.textMuted}
        value={filters.searchQuery}
        onChangeText={(v) => onUpdate('searchQuery', v)}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {LIFE_LOG_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.chip,
              filters.category === cat.id && { backgroundColor: `${cat.color}33`, borderColor: cat.color },
            ]}
            onPress={() => onUpdate('category', filters.category === cat.id ? null : cat.id)}
          >
            <Text
              style={[
                styles.chipText,
                filters.category === cat.id && { color: cat.color },
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {MOODS.map((m) => (
          <Pressable
            key={m}
            style={[styles.chip, filters.mood === m && styles.chipOn]}
            onPress={() => onUpdate('mood', filters.mood === m ? null : m)}
          >
            <Text style={[styles.chipText, filters.mood === m && styles.chipTextOn]}>{m}</Text>
          </Pressable>
        ))}
        {(['planned', 'unplanned'] as LifeLogIntent[]).map((intent) => (
          <Pressable
            key={intent}
            style={[styles.chip, filters.intentType === intent && styles.chipOn]}
            onPress={() =>
              onUpdate('intentType', filters.intentType === intent ? null : intent)
            }
          >
            <Text style={[styles.chipText, filters.intentType === intent && styles.chipTextOn]}>
              {intent}
            </Text>
          </Pressable>
        ))}
        {hasFilters ? (
          <Pressable style={styles.clearChip} onPress={onClear}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    gap: 8,
  },
  search: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 14,
  },
  chips: {
    gap: 6,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceLight,
  },
  chipOn: {
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderColor: theme.accent,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'capitalize',
  },
  chipTextOn: {
    color: theme.accent,
  },
  clearChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
  },
});

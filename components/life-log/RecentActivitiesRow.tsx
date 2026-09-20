import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useResolvedCategory } from '@/hooks/useResolvedCategories';
import { theme } from '@/constants/theme';

interface ActivityChip {
  category: string;
  title: string;
}

interface RecentActivitiesRowProps {
  activities: ActivityChip[];
  onResume: (category: string, title: string) => void;
  disabled?: boolean;
}

function RecentChip({
  category,
  title,
  disabled,
  onResume,
}: {
  category: string;
  title: string;
  disabled?: boolean;
  onResume: (category: string, title: string) => void;
}) {
  const cat = useResolvedCategory(category);
  return (
    <Pressable
      style={[styles.chip, cat && { borderColor: `${cat.color}44` }]}
      disabled={disabled}
      onPress={() => onResume(category, title)}
    >
      <Text style={styles.chipTitle} numberOfLines={1}>
        {title}
      </Text>
      {cat ? <Text style={[styles.chipCat, { color: cat.color }]}>{cat.label}</Text> : null}
    </Pressable>
  );
}

export function RecentActivitiesRow({ activities, onResume, disabled }: RecentActivitiesRowProps) {
  if (activities.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>RECENT</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {activities.map((a) => (
          <RecentChip
            key={`${a.category}|${a.title}`}
            category={a.category}
            title={a.title}
            disabled={disabled}
            onResume={onResume}
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
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 140,
  },
  chipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  chipCat: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCategoryById } from '@/constants/lifeLogCategories';

interface CategoryBadgeProps {
  categoryId: string;
  compact?: boolean;
}

export function CategoryBadge({ categoryId, compact }: CategoryBadgeProps) {
  const cat = getCategoryById(categoryId);
  if (!cat) return null;
  const Icon = cat.icon;

  return (
    <View style={[styles.badge, { backgroundColor: `${cat.color}22`, borderColor: `${cat.color}55` }]}>
      <Icon size={compact ? 12 : 14} color={cat.color} />
      <Text style={[styles.label, { color: cat.color }, compact && styles.labelCompact]}>
        {cat.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  labelCompact: {
    fontSize: 10,
  },
});

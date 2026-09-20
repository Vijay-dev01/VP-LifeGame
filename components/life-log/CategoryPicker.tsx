import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CUSTOM_CATEGORY_COLORS } from '@/constants/lifeLogCategories';
import { useResolvedCategories } from '@/hooks/useResolvedCategories';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

interface CategoryPickerProps {
  value: string;
  onChange: (categoryId: string) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const categories = useResolvedCategories();
  const addCustom = useStore((s) => s.addCustomLifeLogCategory);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(CUSTOM_CATEGORY_COLORS[0]);

  const submitCustom = () => {
    const id = addCustom({ label, color });
    if (!id) return;
    onChange(id);
    setLabel('');
    setCreating(false);
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.catChip,
              value === cat.id && {
                backgroundColor: `${cat.color}22`,
                borderColor: cat.color,
              },
            ]}
            onPress={() => onChange(cat.id)}
          >
            <Text style={[styles.catChipText, value === cat.id && { color: cat.color }]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.catChip, creating && styles.newOn]}
          onPress={() => setCreating((v) => !v)}
        >
          <Text style={[styles.catChipText, creating && { color: theme.accent }]}>+ New</Text>
        </Pressable>
      </ScrollView>
      {creating ? (
        <View style={styles.createBox}>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Category name"
            placeholderTextColor={theme.textMuted}
          />
          <View style={styles.colorRow}>
            {CUSTOM_CATEGORY_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchOn]}
              />
            ))}
          </View>
          <Pressable style={styles.addBtn} onPress={submitCustom}>
            <Text style={styles.addBtnText}>Add category</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  catScroll: {
    marginBottom: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    backgroundColor: theme.surfaceLight,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
  },
  newOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.12)',
  },
  createBox: {
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  input: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchOn: {
    borderColor: '#fff',
  },
  addBtn: {
    alignSelf: 'flex-start',
    backgroundColor: theme.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});

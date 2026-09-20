import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AddHabitModal } from '@/components/AddHabitModal';
import { TabScreen } from '@/components/layout/TabScreen';
import { StatsCards } from '@/components/StatsCards';
import { HabitGrid } from '@/components/HabitGrid';
import { XPBadge } from '@/components/XPBadge';
import { GoalFocusWidget } from '@/components/goals/GoalFocusWidget';
import { theme } from '@/constants/theme';
import type { Habit } from '@/store';

export default function DashboardScreen() {
  const [modalHabit, setModalHabit] = useState<Habit | null | undefined>(undefined);

  return (
    <TabScreen>
      <XPBadge />
      <GoalFocusWidget />
      <View style={styles.topRow}>
        <Pressable style={styles.addBtn} onPress={() => setModalHabit(null)}>
          <Text style={styles.addBtnText}>+ Add habit</Text>
        </Pressable>
      </View>
      <StatsCards />
      <HabitGrid onEditHabit={(habit) => setModalHabit(habit)} />
      <AddHabitModal
        visible={modalHabit !== undefined}
        habit={modalHabit ?? undefined}
        onClose={() => setModalHabit(undefined)}
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.accent,
    borderRadius: 8,
  },
  addBtnText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AddHabitModal } from '@/components/AddHabitModal';
import { TabScreen } from '@/components/layout/TabScreen';
import { StatsCards } from '@/components/StatsCards';
import { HabitGrid } from '@/components/HabitGrid';
import { XPBadge } from '@/components/XPBadge';
import { GoalFocusWidget } from '@/components/goals/GoalFocusWidget';
import { theme } from '@/constants/theme';

export default function DashboardScreen() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <TabScreen>
      <XPBadge />
      <GoalFocusWidget />
      <View style={styles.topRow}>
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Text style={styles.addBtnText}>+ Add habit</Text>
        </Pressable>
      </View>
      <StatsCards />
      <HabitGrid />
      <AddHabitModal visible={addOpen} onClose={() => setAddOpen(false)} />
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

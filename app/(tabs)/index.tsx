import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { StatsCards } from '@/components/StatsCards';
import { HabitGrid } from '@/components/HabitGrid';
import { AddHabitModal } from '@/components/AddHabitModal';
import { theme } from '@/constants/theme';

export default function DashboardScreen() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Text style={styles.addBtnText}>+ Add habit</Text>
        </Pressable>
        <StatsCards />
        <HabitGrid />
      </ScrollView>
      <AddHabitModal visible={addOpen} onClose={() => setAddOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  addBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
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

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { StatsCards } from '@/components/StatsCards';
import { HabitGrid } from '@/components/HabitGrid';
import { AddHabitModal } from '@/components/AddHabitModal';
import { theme } from '@/constants/theme';
import { useStore } from '@/store';

export default function DashboardScreen() {
  const [addOpen, setAddOpen] = useState(false);
  const notificationSettings = useStore((s) => s.notificationSettings);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);
  const setWeeklySummaryEnabled = useStore((s) => s.setWeeklySummaryEnabled);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.notificationInline}>
            <Text style={styles.notificationLabel}>Notifications</Text>
            <Pressable
              onPress={() => setNotificationsEnabled(!notificationSettings.enabled)}
              style={[styles.compactToggle, notificationSettings.enabled && styles.compactToggleOn]}
            >
              <Text style={styles.compactToggleText}>
                All {notificationSettings.enabled ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setWeeklySummaryEnabled(!notificationSettings.weeklySummaryEnabled)}
              style={[
                styles.compactToggle,
                notificationSettings.weeklySummaryEnabled && styles.compactToggleOn,
              ]}
            >
              <Text style={styles.compactToggleText}>
                Sun {notificationSettings.weeklySummaryEnabled ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <Text style={styles.addBtnText}>+ Add habit</Text>
          </Pressable>
        </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
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
  notificationInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  notificationLabel: {
    color: theme.textMuted,
    fontSize: 12,
    marginRight: 'auto',
  },
  compactToggle: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: theme.surface,
  },
  compactToggleOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.16)',
  },
  compactToggleText: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 11,
  },
});

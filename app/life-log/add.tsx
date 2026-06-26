import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LifeLogForm, type LifeLogFormValues } from '@/components/life-log/LifeLogForm';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

function defaultFormValues(): LifeLogFormValues {
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 60 * 1000);
  return {
    title: '',
    category: 'deep-work',
    startTime: now.toISOString(),
    endTime: end.toISOString(),
    notes: '',
    energyLevel: undefined,
    mood: undefined,
    intentType: 'planned',
  };
}

export default function AddLifeLogScreen() {
  const addLifeLog = useStore((s) => s.addLifeLog);

  const handleSubmit = (values: LifeLogFormValues) => {
    const title = values.title.trim();
    if (!title) {
      Alert.alert('Required', 'Enter an activity name.');
      return;
    }
    const id = addLifeLog({
      title,
      category: values.category,
      startTime: values.startTime,
      endTime: values.endTime,
      notes: values.notes.trim() || undefined,
      energyLevel: values.energyLevel,
      mood: values.mood,
      intentType: values.intentType,
    });
    if (!id) {
      Alert.alert('Invalid times', 'End time must be after start time.');
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Add Activity</Text>
        <View style={styles.spacer} />
      </View>
      <LifeLogForm initial={defaultFormValues()} onSubmit={handleSubmit} submitLabel="Save" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    color: theme.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  spacer: {
    width: 60,
  },
});

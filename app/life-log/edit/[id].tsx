import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LifeLogForm, type LifeLogFormValues } from '@/components/life-log/LifeLogForm';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

export default function EditLifeLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const log = useStore((s) => s.lifeLogs.find((l) => l.id === id));
  const updateLifeLog = useStore((s) => s.updateLifeLog);
  const deleteLifeLog = useStore((s) => s.deleteLifeLog);
  const duplicateLifeLog = useStore((s) => s.duplicateLifeLog);

  if (!log) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Activity not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const initial: LifeLogFormValues = {
    title: log.title,
    category: log.category,
    startTime: log.startTime,
    endTime: log.endTime,
    notes: log.notes ?? '',
    energyLevel: log.energyLevel,
    mood: log.mood,
    intentType: log.intentType,
  };

  const handleSubmit = (values: LifeLogFormValues) => {
    const title = values.title.trim();
    if (!title) {
      Alert.alert('Required', 'Enter an activity name.');
      return;
    }
    const ok = updateLifeLog(log.id, {
      title,
      category: values.category,
      startTime: values.startTime,
      endTime: values.endTime,
      notes: values.notes.trim() || undefined,
      energyLevel: values.energyLevel,
      mood: values.mood,
      intentType: values.intentType,
    });
    if (!ok) {
      Alert.alert('Invalid times', 'End time must be after start time.');
      return;
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete activity', `Remove "${log.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteLifeLog(log.id);
          router.back();
        },
      },
    ]);
  };

  const handleDuplicate = () => {
    const newId = duplicateLifeLog(log.id);
    if (newId) {
      Alert.alert('Duplicated', 'A copy was created with adjusted times.');
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Edit Activity</Text>
        <View style={styles.spacer} />
      </View>
      <LifeLogForm
        initial={initial}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
        extraActions={
          <View style={styles.actions}>
            <Pressable style={styles.dupBtn} onPress={handleDuplicate}>
              <Text style={styles.dupText}>Duplicate</Text>
            </Pressable>
            <Pressable style={styles.delBtn} onPress={handleDelete}>
              <Text style={styles.delText}>Delete</Text>
            </Pressable>
          </View>
        }
      />
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
  notFound: {
    color: theme.text,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  backLink: {
    color: theme.accent,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  dupBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    backgroundColor: theme.surfaceLight,
  },
  dupText: {
    color: theme.text,
    fontWeight: '700',
  },
  delBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.35)',
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.12)',
  },
  delText: {
    color: theme.accent,
    fontWeight: '700',
  },
});

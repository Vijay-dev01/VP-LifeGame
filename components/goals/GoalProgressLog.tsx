import React, { memo, useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { GoalProgressEntry } from '@/store/goalTypes';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

interface GoalProgressLogProps {
  entries: GoalProgressEntry[];
  unit: string;
  onAddPress?: () => void;
}

interface ProgressLogRowProps {
  entry: GoalProgressEntry;
  unit: string;
  onDelete: (entry: GoalProgressEntry) => void;
}

const ProgressLogRow = memo(function ProgressLogRow({
  entry,
  unit,
  onDelete,
}: ProgressLogRowProps) {
  const isManual = entry.source === 'manual';

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      'Delete progress entry?',
      `Remove +${entry.amount} ${unit} logged on ${entry.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry) },
      ]
    );
  }, [entry, unit, onDelete]);

  return (
    <View style={styles.logRow}>
      <Text style={styles.logAmount}>+{entry.amount}</Text>
      <View style={styles.logBody}>
        <Text style={styles.logNote}>{entry.note ?? entry.source}</Text>
        <Text style={styles.logDate}>
          {entry.date} · {entry.source}
        </Text>
      </View>
      {isManual ? (
        <Pressable
          style={styles.deleteBtn}
          onPress={handleDeletePress}
          hitSlop={8}
          accessibilityLabel="Delete progress entry"
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </Pressable>
      ) : (
        <Text style={styles.lockIcon}>🔒</Text>
      )}
    </View>
  );
});

export const GoalProgressLog = memo(function GoalProgressLog({
  entries,
  unit,
  onAddPress,
}: GoalProgressLogProps) {
  const deleteGoalProgressEntry = useStore((s) => s.deleteGoalProgressEntry);
  const [showAll, setShowAll] = useState(false);

  const handleDelete = useCallback(
    (entry: GoalProgressEntry) => {
      deleteGoalProgressEntry(entry.id);
    },
    [deleteGoalProgressEntry]
  );

  const visibleEntries = showAll ? entries : entries.slice(0, 20);
  const hasMore = entries.length > 20;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Progress log</Text>
      {entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyLog}>No progress logged yet</Text>
          {onAddPress ? (
            <Pressable style={styles.emptyBtn} onPress={onAddPress}>
              <Text style={styles.emptyBtnText}>Log your first entry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <>
          {visibleEntries.map((e) => (
            <ProgressLogRow key={e.id} entry={e} unit={unit} onDelete={handleDelete} />
          ))}
          {hasMore && !showAll ? (
            <Pressable style={styles.showAllBtn} onPress={() => setShowAll(true)}>
              <Text style={styles.showAllText}>Show all ({entries.length})</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 12,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  logAmount: {
    color: theme.accent,
    fontWeight: '700',
    fontSize: 14,
    minWidth: 36,
  },
  logBody: {
    flex: 1,
  },
  logNote: {
    color: theme.text,
    fontSize: 14,
  },
  logDate: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
  },
  lockIcon: {
    fontSize: 14,
    opacity: 0.5,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  emptyLog: {
    color: theme.textMuted,
    fontSize: 13,
  },
  emptyBtn: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyBtnText: {
    color: theme.accent,
    fontWeight: '600',
    fontSize: 13,
  },
  showAllBtn: {
    paddingTop: 12,
    alignItems: 'center',
  },
  showAllText: {
    color: theme.accent,
    fontWeight: '600',
    fontSize: 13,
  },
});

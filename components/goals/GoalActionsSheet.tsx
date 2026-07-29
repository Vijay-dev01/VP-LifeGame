import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { theme } from '@/constants/theme';

interface GoalActionsSheetProps {
  visible: boolean;
  goalTitle: string;
  onClose: () => void;
  onLogProgress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function GoalActionsSheet({
  visible,
  goalTitle,
  onClose,
  onLogProgress,
  onEdit,
  onDelete,
}: GoalActionsSheetProps) {
  const run = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="45%">
      <Text style={styles.title} numberOfLines={2}>
        {goalTitle}
      </Text>
      <View style={styles.list}>
        <Pressable style={styles.row} onPress={() => run(onLogProgress)}>
          <Text style={styles.rowPrimary}>Log progress</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => run(onEdit)}>
          <Text style={styles.rowText}>Edit goal</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => run(onDelete)}>
          <Text style={styles.rowDestructive}>Delete goal</Text>
        </Pressable>
        <Pressable style={[styles.row, styles.rowCancel]} onPress={onClose}>
          <Text style={styles.rowCancelText}>Cancel</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  list: {
    gap: 4,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  rowPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.accent,
  },
  rowText: {
    fontSize: 16,
    color: theme.text,
  },
  rowDestructive: {
    fontSize: 16,
    color: theme.accent,
    fontWeight: '600',
  },
  rowCancel: {
    borderBottomWidth: 0,
    marginTop: 8,
    alignItems: 'center',
  },
  rowCancelText: {
    fontSize: 15,
    color: theme.textMuted,
    fontWeight: '600',
  },
});

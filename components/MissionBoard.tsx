import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

export function MissionBoard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const dayTasks = useStore((s) => s.dayTasks);
  const addTask = useStore((s) => s.addTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const [newTitle, setNewTitle] = useState('');
  const tasks = useMemo(() => dayTasks[today] ?? [], [dayTasks, today]);

  const handleAdd = () => {
    const t = newTitle.trim();
    if (t) {
      addTask(today, t);
      setNewTitle('');
    }
  };

  const sorted = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>DAILY MISSION BOARD</Text>
      <Text style={styles.date}>{format(new Date(today + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a task..."
          placeholderTextColor={theme.textMuted}
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.list}>
        {sorted.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <Pressable
              style={[styles.check, task.done && styles.checkChecked]}
              onPress={() => toggleTask(task.id)}
            >
              {task.done && <Text style={styles.checkMark}>✓</Text>}
            </Pressable>
            <Text style={[styles.taskTitle, task.done && styles.taskDone]} numberOfLines={1}>
              {task.title}
            </Text>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Delete task',
                  `Remove "${task.title}"?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
                  ]
                )
              }
              style={styles.delBtn}
            >
              <Text style={styles.delText}>✕</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      {sorted.length === 0 && (
        <Text style={styles.empty}>No tasks for today. Add one above.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    color: theme.text,
    fontSize: 16,
  },
  addBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.accent,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addBtnText: {
    color: theme.text,
    fontWeight: '600',
  },
  list: {
    maxHeight: 320,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 12,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkChecked: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
  },
  taskDone: {
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
  delBtn: {
    padding: 4,
  },
  delText: {
    color: theme.textMuted,
    fontSize: 16,
  },
  empty: {
    color: theme.textMuted,
    fontSize: 14,
    paddingVertical: 16,
  },
});

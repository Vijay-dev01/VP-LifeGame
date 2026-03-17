import React, { useMemo, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { addDays, startOfMonth, endOfMonth, getDate, format, isSameDay } from 'date-fns';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

const CELL = 38;
const LABEL_W = 160;

// Subscribes only to this cell's checked state so only this cell re-renders on toggle
const HabitCell = memo(function HabitCell({
  habitId,
  dateStr,
  date,
  isToday,
}: {
  habitId: string;
  dateStr: string;
  date: Date;
  isToday: boolean;
}) {
  const checked = useStore(
    (s) => (s.completions[dateStr] ?? []).includes(habitId)
  );
  const toggleHabitDay = useStore((s) => s.toggleHabitDay);
  return (
    <Pressable
      style={[
        styles.cell,
        styles.dayCell,
        isToday && styles.todayCell,
      ]}
      onPress={() => toggleHabitDay(habitId, dateStr)}
    >
      <View
        style={[
          styles.check,
          checked && {
            backgroundColor: theme.accent,
            borderColor: theme.accent,
          },
        ]}
      >
        {checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
    </Pressable>
  );
});

export function HabitGrid() {
  const currentMonth = useStore((s) => s.currentMonth);
  const habits = useStore((s) => s.habits);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const today = useMemo(() => new Date(), []);

  const start = startOfMonth(new Date(currentMonth + 'T12:00:00'));
  const end = endOfMonth(start);
  const daysInMonth = getDate(end);
  const dates = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => addDays(start, i)),
    [start, daysInMonth]
  );

  const sortedHabits = useMemo(
    () => [...habits].sort((a, b) => a.order - b.order),
    [habits]
  );

  if (habits.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No habits yet. Add one to start.</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={styles.scroll}>
      <View style={[styles.table, { minWidth: LABEL_W + dates.length * CELL }]}>
        <View style={styles.headerRow}>
          <View style={[styles.cell, styles.labelCell]}>
            <Text style={styles.headerText}>HABIT NAME</Text>
          </View>
          {dates.map((d) => (
            <View
              key={d.toISOString()}
              style={[
                styles.cell,
                styles.dayCell,
                isSameDay(d, today) && styles.todayCell,
              ]}
            >
              <Text style={styles.dayAbbr} numberOfLines={1}>
                {format(d, 'EEE')}
              </Text>
              <Text style={styles.dayNum}>{getDate(d)}</Text>
            </View>
          ))}
        </View>
        {sortedHabits.map((habit) => (
          <View key={habit.id} style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text style={styles.habitName} numberOfLines={1}>
                {habit.emoji} {habit.name}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() =>
                  Alert.alert(
                    'Delete habit',
                    `Remove "${habit.name}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habit.id) },
                    ]
                  )
                }
                style={styles.deleteBtn}
              >
                <Trash2 size={20} color={theme.accent} />
              </Pressable>
            </View>
            {dates.map((d) => (
              <HabitCell
                key={d.toISOString()}
                habitId={habit.id}
                dateStr={format(d, 'yyyy-MM-dd')}
                date={d}
                isToday={isSameDay(d, today)}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  table: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.surfaceLight,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.border,
  },
  labelCell: {
    width: LABEL_W,
    minWidth: LABEL_W,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitName: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: '600',
  },
  dayCell: {
    width: CELL,
    minWidth: CELL,
    alignItems: 'center',
  },
  todayCell: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  dayAbbr: {
    fontSize: 10,
    color: theme.textMuted,
  },
  dayNum: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    marginTop: 2,
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
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 14,
  },
});

import React, { useMemo, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { EllipsisVertical } from 'lucide-react-native';
import { addDays, startOfMonth, endOfMonth, getDate, format, isSameDay, subMonths } from 'date-fns';
import { useStore, type Habit } from '@/store';
import { theme } from '@/constants/theme';
import { isHabitScheduledOn } from '@/utils/habitSchedule';
import { EMPTY_HABITS } from '@/utils/habitsByMonth';

const CELL = 38;
const LABEL_W = 176;
const HEADER_MIN_H = 54;
const ROW_MIN_H = 44;

// Subscribes only to this cell's checked state so only this cell re-renders on toggle
const HabitCell = memo(function HabitCell({
  habitId,
  dateStr,
  date,
  isToday,
  scheduled,
}: {
  habitId: string;
  dateStr: string;
  date: Date;
  isToday: boolean;
  scheduled: boolean;
}) {
  const checked = useStore(
    (s) => (s.completions[dateStr] ?? []).includes(habitId)
  );
  const toggleHabitDay = useStore((s) => s.toggleHabitDay);
  return (
    <Pressable
      disabled={!scheduled}
      style={[
        styles.cell,
        styles.dayCell,
        isToday && styles.todayCell,
        !scheduled && styles.restCell,
      ]}
      onPress={() => scheduled && toggleHabitDay(habitId, dateStr)}
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

export function HabitGrid({ onEditHabit }: { onEditHabit?: (habit: Habit) => void }) {
  const currentMonth = useStore((s) => s.currentMonth);
  const habits = useStore((s) => s.habitsByMonth[s.currentMonth] ?? EMPTY_HABITS);
  const prevMonth = format(subMonths(new Date(currentMonth + 'T12:00:00'), 1), 'yyyy-MM-dd');
  const prevHabits = useStore((s) => s.habitsByMonth[prevMonth] ?? EMPTY_HABITS);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const copyHabitsFromMonth = useStore((s) => s.copyHabitsFromMonth);
  const today = useMemo(() => new Date(), []);
  const [tooltip, setTooltip] = React.useState<{
    habitId: string;
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const habitLabelLayouts = React.useRef<Record<string, { x: number; y: number }>>({});
  const rightScrollRef = React.useRef<ScrollView | null>(null);
  const lastMonthKeyRef = React.useRef<string | null>(null);

  const confirmDelete = (habit: Habit) => {
    Alert.alert('Delete habit', `Remove "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteHabit(habit.id),
      },
    ]);
  };

  const openHabitMenu = (habit: Habit) => {
    Alert.alert(`${habit.emoji} ${habit.name}`, undefined, [
      { text: '✏️ Edit habit', onPress: () => onEditHabit?.(habit) },
      { text: '🗑 Delete habit', style: 'destructive', onPress: () => confirmDelete(habit) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

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
  const rightMinWidth = dates.length * CELL;
  const todayIndex = dates.findIndex((d) => isSameDay(d, today));

  // On initial load (and when month changes), scroll so "today" is at the left edge.
  // Keep this hook *before* any early return so hook count never changes.
  React.useEffect(() => {
    const monthKey = String(currentMonth);
    if (lastMonthKeyRef.current === monthKey) return;
    lastMonthKeyRef.current = monthKey;
    if (todayIndex < 0) return;

    requestAnimationFrame(() => {
      rightScrollRef.current?.scrollTo({
        x: todayIndex * CELL,
        y: 0,
        animated: false,
      });
    });
  }, [currentMonth, todayIndex]);

  if (habits.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No habits configured for this month.</Text>
        {prevHabits.length > 0 ? (
          <Pressable style={styles.copyBtn} onPress={() => copyHabitsFromMonth(prevMonth)}>
            <Text style={styles.copyBtnText}>Copy previous month</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={styles.tableInner}>
        {/* Fixed left column */}
        <View style={styles.leftCol}>
          <View style={styles.headerRow}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text style={styles.headerText}>HABIT NAME</Text>
            </View>
          </View>

          {sortedHabits.map((habit) => (
            <View key={habit.id} style={styles.row}>
              <View style={[styles.cell, styles.labelCell]}>
                <Pressable
                  onLayout={(e) => {
                    const { x, y } = e.nativeEvent.layout;
                    habitLabelLayouts.current[habit.id] = { x, y };
                  }}
                  onLongPress={() => {
                    const layout = habitLabelLayouts.current[habit.id];
                    if (!layout) return;
                    setTooltip({
                      habitId: habit.id,
                      text: `${habit.emoji} ${habit.name}`,
                      x: layout.x,
                      y: layout.y,
                    });
                  }}
                  onPressOut={() => setTooltip(null)}
                  // Expo Web supports hover props; keep this isolated so mobile still works.
                  {...(Platform.OS === 'web'
                    ? ({
                        onMouseEnter: () => {
                          const layout = habitLabelLayouts.current[habit.id];
                          if (!layout) return;
                          setTooltip({
                            habitId: habit.id,
                            text: `${habit.emoji} ${habit.name}`,
                            x: layout.x,
                            y: layout.y,
                          });
                        },
                        onMouseLeave: () => setTooltip(null),
                      } as any)
                    : {})}
                  style={styles.habitNameBtn}
                >
                  <Text style={styles.habitName} numberOfLines={1} ellipsizeMode="tail">
                    {habit.emoji} {habit.name}
                  </Text>
                </Pressable>
                <Pressable
                  hitSlop={8}
                  onPress={() => openHabitMenu(habit)}
                  style={styles.menuBtn}
                  accessibilityLabel={`Actions for ${habit.name}`}
                >
                  <EllipsisVertical size={18} color={theme.textMuted} />
                </Pressable>
              </View>
            </View>
          ))}

          {tooltip ? (
            <View
              pointerEvents="none"
              style={[
                styles.tooltip,
                {
                  left: tooltip.x,
                  top: tooltip.y + 30,
                },
              ]}
            >
              <Text style={styles.tooltipText} numberOfLines={5}>
                {tooltip.text}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Scrollable right side */}
        <View style={styles.rightCol}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            ref={(r) => {
              rightScrollRef.current = r;
            }}
          >
            <View style={{ minWidth: rightMinWidth }}>
              <View style={styles.headerRow}>
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
                  {dates.map((d) => (
                    <HabitCell
                      key={d.toISOString()}
                      habitId={habit.id}
                      dateStr={format(d, 'yyyy-MM-dd')}
                      date={d}
                      isToday={isSameDay(d, today)}
                      scheduled={isHabitScheduledOn(habit.activeDays, format(d, 'yyyy-MM-dd'))}
                    />
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableInner: {
    flexDirection: 'row',
  },
  leftCol: {
    width: LABEL_W,
    minWidth: LABEL_W,
    position: 'relative',
  },
  rightCol: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.surfaceLight,
    minHeight: HEADER_MIN_H,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    minHeight: ROW_MIN_H,
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
    gap: 4,
  },
  habitNameBtn: {
    flex: 1,
    minWidth: 0,
  },
  habitName: {
    fontSize: 14,
    color: theme.text,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    width: CELL,
    minWidth: CELL,
    alignItems: 'center',
  },
  todayCell: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  restCell: {
    opacity: 0.32,
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
  copyBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceLight,
  },
  copyBtnText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 10,
    width: LABEL_W - 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tooltipText: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
});

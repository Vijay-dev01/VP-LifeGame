import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';
import type { DayTask } from '@/store';

const CARD_W = 280;
const CARD_GAP = 12;
const CARD_STRIDE = CARD_W + CARD_GAP;
const RING_SIZE = 116;
const RING_STROKE = 12;
const R = (RING_SIZE - RING_STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function progressColor(percent: number) {
  if (percent >= 100) return '#16a34a';
  if (percent >= 50) return '#f59e0b';
  return '#dc2626';
}

function ProgressRing({ percent }: { percent: number }) {
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: percent,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [percent, animated]);

  const dashOffset = animated.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRC, 0],
    extrapolate: 'clamp',
  });

  const color = progressColor(percent);

  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={R}
          stroke={theme.border}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={R}
          stroke={color}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <Text style={styles.ringText}>{percent}%</Text>
    </View>
  );
}

export function MissionBoard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const dayTasks = useStore((s) => s.dayTasks);
  const addTask = useStore((s) => s.addTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const [selectedDate, setSelectedDate] = useState(today);
  const [newTitle, setNewTitle] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const contentWidthRef = useRef(0);

  // Current month only — same scope as the habit grid (chronological, scroll for past/future in-month).
  const missionDays = useMemo(() => {
    const now = new Date();
    return eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  }, [today]);

  const todayIndex = useMemo(() => {
    const i = missionDays.findIndex((d) => format(d, 'yyyy-MM-dd') === today);
    return i >= 0 ? i : 0;
  }, [missionDays, today]);

  useEffect(() => {
    const keys = missionDays.map((d) => format(d, 'yyyy-MM-dd'));
    setSelectedDate((prev) => (keys.includes(prev) ? prev : today));
  }, [today, missionDays]);

  const scrollToToday = useCallback(() => {
    scrollRef.current?.scrollTo({
      x: todayIndex * CARD_STRIDE,
      y: 0,
      animated: false,
    });
  }, [todayIndex]);

  // Align today to the leading edge (same idea as HabitGrid scrolling to today).
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToToday);
    });
  }, [today, scrollToToday]);

  const handleAdd = () => {
    const t = newTitle.trim();
    if (t) {
      addTask(selectedDate, t);
      setNewTitle('');
    }
  };

  const cardData = useMemo(
    () =>
      missionDays.map((dateObj) => {
        const dateKey = format(dateObj, 'yyyy-MM-dd');
        const tasks = [...(dayTasks[dateKey] ?? [])].sort((a, b) => a.order - b.order);
        const done = tasks.filter((t) => t.done).length;
        const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
        return {
          dateObj,
          dateKey,
          tasks,
          percent: pct,
        };
      }),
    [dayTasks, missionDays]
  );

  return (
    <View>
      <Text style={styles.helperText}>Tap a day card to set where new tasks will be added.</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add task to selected day..."
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

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
        onContentSizeChange={(w) => {
          if (w <= 0 || w === contentWidthRef.current) return;
          contentWidthRef.current = w;
          scrollToToday();
        }}
      >
        {cardData.map(({ dateObj, dateKey, tasks, percent }) => {
          const selected = dateKey === selectedDate;
          return (
            <Pressable
              key={dateKey}
              style={[styles.dayCard, selected && styles.dayCardSelected]}
              onPress={() => setSelectedDate(dateKey)}
            >
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{format(dateObj, 'EEEE')}</Text>
                <Text style={styles.dayDate}>{format(dateObj, 'dd.MM.yyyy')}</Text>
              </View>

              <ProgressRing percent={percent} />

              <Text style={styles.tasksHeading}>Tasks</Text>
              <View style={styles.tasksList}>
                {tasks.length === 0 ? (
                  <Text style={styles.empty}>No tasks</Text>
                ) : (
                  tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTask(task.id)}
                      onDelete={() =>
                        Alert.alert('Delete task', `Remove "${task.title}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteTask(task.id),
                          },
                        ])
                      }
                    />
                  ))
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: DayTask;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.taskRow}>
      <Pressable style={[styles.check, task.done && styles.checkChecked]} onPress={onToggle}>
        {task.done && <Text style={styles.checkMark}>✓</Text>}
      </Pressable>
      <Text style={[styles.taskTitle, task.done && styles.taskDone]} numberOfLines={1}>
        {task.title}
      </Text>
      <Pressable onPress={onDelete} style={styles.delBtn}>
        <Text style={styles.delText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  helperText: {
    color: theme.textMuted,
    fontSize: 12,
    marginBottom: 10,
    paddingHorizontal: 2,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
    backgroundColor: '#0f1117',
  },
  addBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: theme.accent,
    borderRadius: 12,
    justifyContent: 'center',
    shadowColor: theme.accent,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  addBtnText: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 15,
  },
  cardsRow: {
    gap: 12,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  dayCard: {
    width: CARD_W,
    backgroundColor: '#12141b',
    borderWidth: 1,
    borderColor: '#2a2f3a',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  dayCardSelected: {
    borderColor: theme.accent,
    shadowColor: theme.accent,
    shadowOpacity: 0.35,
  },
  dayHeader: {
    backgroundColor: '#b91c1c',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  dayName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  dayDate: {
    color: '#fde7d7',
    fontSize: 13,
    marginTop: 2,
  },
  ringWrap: {
    marginTop: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  tasksHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#cbd5e1',
    paddingHorizontal: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tasksList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#262b36',
    gap: 8,
  },
  check: {
    width: 22,
    height: 22,
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
    fontSize: 13,
    fontWeight: '700',
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    color: '#e2e8f0',
  },
  taskDone: {
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
  delBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  delText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  empty: {
    color: theme.textMuted,
    fontSize: 13,
    paddingVertical: 10,
  },
});

import React, { memo, useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { getCategoryById } from '@/constants/lifeLogCategories';
import { theme } from '@/constants/theme';
import { useStore, type DayPlanItem } from '@/store';
import { formatPlanTime } from '@/utils/formatPlanTime';

interface TodayScheduleRowProps {
  onStart: (category: string, title: string) => void;
  onPlanPress: () => void;
  disabled?: boolean;
}

const PlanItemRow = memo(function PlanItemRow({
  item,
  disabled,
  onStart,
  onToggleDone,
}: {
  item: DayPlanItem;
  disabled?: boolean;
  onStart: (category: string, title: string) => void;
  onToggleDone: (id: string) => void;
}) {
  const cat = getCategoryById(item.category);

  const handlePress = () => {
    if (item.done) return;
    if (disabled) {
      Alert.alert('Timer running', 'Stop the current timer before starting a new one.');
      return;
    }
    onStart(item.category, item.title);
  };

  return (
    <View style={styles.itemRow}>
      <Pressable
        style={[styles.check, item.done && styles.checkChecked]}
        onPress={() => onToggleDone(item.id)}
        hitSlop={8}
      >
        {item.done && <Text style={styles.checkMark}>✓</Text>}
      </Pressable>
      <Pressable style={styles.itemBody} onPress={handlePress} onLongPress={() => onToggleDone(item.id)}>
        <Text style={[styles.itemTime, item.done && styles.itemDoneText]}>
          {formatPlanTime(item.time)}
        </Text>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, item.done && styles.itemDoneText]} numberOfLines={1}>
            {item.title}
          </Text>
          {cat ? (
            <Text style={[styles.itemCat, { color: cat.color }]}>{cat.label}</Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
});

export function TodayScheduleRow({ onStart, onPlanPress, disabled }: TodayScheduleRowProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const dayPlans = useStore((s) => s.dayPlans);
  const togglePlanItemDone = useStore((s) => s.togglePlanItemDone);
  const dailyGoalScore = useStore((s) => s.dailyGoalScore);

  const items = dayPlans[today] ?? [];
  const doneCount = items.filter((p) => p.done).length;

  const handleToggleDone = useCallback(
    (id: string) => {
      togglePlanItemDone(today, id);
    },
    [today, togglePlanItemDone]
  );

  if (items.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>TODAY&apos;S PLAN</Text>
        <Pressable style={styles.empty} onPress={onPlanPress}>
          <Text style={styles.emptyText}>No plan yet — Plan Tomorrow tonight</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>TODAY&apos;S PLAN</Text>
        <View style={styles.badges}>
          <Text style={styles.progressBadge}>
            {doneCount}/{items.length}
          </Text>
          <Text style={styles.goalBadge}>Goal {dailyGoalScore}</Text>
        </View>
      </View>
      {items.map((item) => (
        <PlanItemRow
          key={item.id}
          item={item}
          disabled={disabled}
          onStart={onStart}
          onToggleDone={handleToggleDone}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surface,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  progressBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.text,
    backgroundColor: theme.surfaceLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  goalBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  empty: {
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 13,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
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
  itemBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemTime: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.accent,
    width: 62,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  itemCat: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  itemDoneText: {
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
});

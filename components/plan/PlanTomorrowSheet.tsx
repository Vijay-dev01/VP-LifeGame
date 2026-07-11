import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, format } from 'date-fns';
import { useStore } from '@/store';
import { LIFE_LOG_CATEGORIES } from '@/constants/lifeLogCategories';
import { theme } from '@/constants/theme';

interface PlanTomorrowSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function PlanTomorrowSheet({ visible, onClose }: PlanTomorrowSheetProps) {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dayPlans = useStore((s) => s.dayPlans);
  const dailyGoalScore = useStore((s) => s.dailyGoalScore);
  const addPlanItem = useStore((s) => s.addPlanItem);
  const removePlanItem = useStore((s) => s.removePlanItem);
  const setDailyGoalScore = useStore((s) => s.setDailyGoalScore);

  const items = dayPlans[tomorrow] ?? [];
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('deep-work');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) return;
    addPlanItem(tomorrow, {
      title: title.trim(),
      category,
      time: format(time, 'HH:mm'),
    });
    setTitle('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.heading}>Plan Tomorrow</Text>
          <Text style={styles.dateLabel}>{format(addDays(new Date(), 1), 'EEEE, MMM d')}</Text>

          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Goal: Reach {dailyGoalScore} Score</Text>
            <View style={styles.goalBtns}>
              <Pressable style={styles.goalBtn} onPress={() => setDailyGoalScore(dailyGoalScore - 5)}>
                <Text style={styles.goalBtnText}>−</Text>
              </Pressable>
              <Pressable style={styles.goalBtn} onPress={() => setDailyGoalScore(dailyGoalScore + 5)}>
                <Text style={styles.goalBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.list}>
            {items.map((item) => (
              <View key={item.id} style={styles.planItem}>
                <Text style={styles.planTime}>{item.time}</Text>
                <Text style={styles.planTitle}>{item.title}</Text>
                <Pressable onPress={() => removePlanItem(tomorrow, item.id)}>
                  <Text style={styles.remove}>×</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <View style={styles.addRow}>
            <Pressable style={styles.timePick} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.timePickText}>{format(time, 'h:mm a')}</Text>
            </Pressable>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Activity"
              placeholderTextColor={theme.textMuted}
            />
            <Pressable style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {LIFE_LOG_CATEGORIES.slice(0, 5).map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.catChip, category === cat.id && styles.catChipOn]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.catChipText}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (date) setTime(date);
              }}
            />
          )}

          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  dateLabel: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 14,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  goalBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  goalBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBtnText: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 16,
  },
  list: {
    maxHeight: 160,
    marginBottom: 12,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  planTime: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.accent,
    width: 52,
  },
  planTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  remove: {
    fontSize: 20,
    color: theme.textMuted,
    paddingHorizontal: 8,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  timePick: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  timePickText: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 12,
  },
  input: {
    flex: 1,
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    color: theme.text,
  },
  addBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  catRow: {
    marginBottom: 14,
  },
  catChip: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  catChipOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.text,
  },
  doneBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: {
    color: '#fff',
    fontWeight: '800',
  },
});

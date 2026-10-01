import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CategoryPicker } from '@/components/life-log/CategoryPicker';
import { useStore } from '@/store';
import { theme } from '@/constants/theme';

interface ScheduleTodoSheetProps {
  visible: boolean;
  defaultDate: string;
  onClose: () => void;
}

type PickerField = 'date' | 'start' | 'end' | 'reminder' | null;

function localDateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 9, 0, 0, 0);
}

function withTime(base: Date, hours: number, minutes: number): Date {
  const next = new Date(base);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function ScheduleTodoSheet({ visible, defaultDate, onClose }: ScheduleTodoSheetProps) {
  const addPlanItem = useStore((s) => s.addPlanItem);
  const [title, setTitle] = useState('');
  const [dateKey, setDateKey] = useState(defaultDate);
  const [start, setStart] = useState(() => localDateFromKey(defaultDate));
  const [end, setEnd] = useState(() => withTime(localDateFromKey(defaultDate), 10, 0));
  const [reminderOn, setReminderOn] = useState(false);
  const [reminder, setReminder] = useState(() => withTime(localDateFromKey(defaultDate), 8, 30));
  const [category, setCategory] = useState('deep-work');
  const [picker, setPicker] = useState<PickerField>(null);

  useEffect(() => {
    if (!visible) {
      setPicker(null);
      return;
    }
    const base = localDateFromKey(defaultDate);
    setTitle('');
    setDateKey(defaultDate);
    setStart(base);
    setEnd(withTime(base, 10, 0));
    setReminderOn(false);
    setReminder(withTime(base, 8, 30));
    setCategory('deep-work');
  }, [visible, defaultDate]);

  const openAndroidPicker = (field: Exclude<PickerField, null>) => {
    const value =
      field === 'date' ? localDateFromKey(dateKey) : field === 'start' ? start : field === 'end' ? end : reminder;
    DateTimePickerAndroid.open({
      value,
      mode: field === 'date' ? 'date' : 'time',
      is24Hour: false,
      onChange: (event, selected) => {
        if (event.type !== 'set' || !selected) return;
        if (field === 'date') setDateKey(format(selected, 'yyyy-MM-dd'));
        else if (field === 'start') setStart(selected);
        else if (field === 'end') setEnd(selected);
        else setReminder(selected);
      },
    });
  };

  const openPicker = (field: Exclude<PickerField, null>) => {
    if (Platform.OS === 'android') {
      openAndroidPicker(field);
      return;
    }
    setPicker(field);
  };

  const pickerValue =
    picker === 'date'
      ? localDateFromKey(dateKey)
      : picker === 'start'
        ? start
        : picker === 'end'
          ? end
          : reminder;

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Enter a todo title.');
      return;
    }
    const startHm = format(start, 'HH:mm');
    const endHm = format(end, 'HH:mm');
    if (endHm <= startHm) {
      Alert.alert('Invalid time', 'End time must be after start time.');
      return;
    }
    addPlanItem(dateKey, {
      title: trimmed,
      category,
      time: startHm,
      endTime: endHm,
      reminderTime: reminderOn ? format(reminder, 'HH:mm') : null,
    });
    Keyboard.dismiss();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        <Text style={styles.heading}>Schedule</Text>
        <Text style={styles.sub}>Timed todo with optional reminder</Text>

        <Text style={styles.label}>TODO</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="What do you need to do?"
          placeholderTextColor={theme.textMuted}
        />

        <Text style={styles.label}>DATE</Text>
        <Pressable style={styles.timeBtn} onPress={() => openPicker('date')}>
          <Text style={styles.timeBtnValue}>{format(localDateFromKey(dateKey), 'EEEE, MMM d')}</Text>
        </Pressable>

        <View style={styles.timeRow}>
          <Pressable style={styles.timeBtn} onPress={() => openPicker('start')}>
            <Text style={styles.timeBtnLabel}>Start</Text>
            <Text style={styles.timeBtnValue}>{format(start, 'h:mm a')}</Text>
          </Pressable>
          <Pressable style={styles.timeBtn} onPress={() => openPicker('end')}>
            <Text style={styles.timeBtnLabel}>End</Text>
            <Text style={styles.timeBtnValue}>{format(end, 'h:mm a')}</Text>
          </Pressable>
        </View>

        <View style={styles.reminderRow}>
          <Text style={styles.labelInline}>Reminder</Text>
          <Pressable
            style={[styles.toggle, reminderOn && styles.toggleOn]}
            onPress={() => {
              if (!reminderOn) setReminder(start);
              setReminderOn((v) => !v);
            }}
          >
            <Text style={styles.toggleText}>{reminderOn ? 'ON' : 'OFF'}</Text>
          </Pressable>
        </View>
        {reminderOn ? (
          <Pressable style={styles.timeBtn} onPress={() => openPicker('reminder')}>
            <Text style={styles.timeBtnValue}>{format(reminder, 'h:mm a')}</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>CATEGORY</Text>
        <CategoryPicker value={category} onChange={setCategory} />

        {picker && Platform.OS === 'ios' ? (
          <View style={styles.iosPicker}>
            <DateTimePicker
              value={pickerValue}
              mode={picker === 'date' ? 'date' : 'time'}
              display="spinner"
              onChange={(_, date) => {
                if (!date) return;
                if (picker === 'date') setDateKey(format(date, 'yyyy-MM-dd'));
                else if (picker === 'start') setStart(date);
                else if (picker === 'end') setEnd(date);
                else setReminder(date);
              }}
            />
            <Pressable style={styles.pickerDone} onPress={() => setPicker(null)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderWidth: 1,
    borderColor: theme.border,
  },
  body: {
    paddingBottom: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  sub: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 14,
    marginTop: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 10,
  },
  labelInline: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  input: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    color: theme.text,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  timeBtn: {
    flex: 1,
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  timeBtnLabel: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeBtnValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  toggle: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.surfaceLight,
  },
  toggleOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.2)',
  },
  toggleText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  iosPicker: {
    marginTop: 8,
    marginBottom: 8,
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  pickerDoneText: {
    color: theme.accent,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
  },
});

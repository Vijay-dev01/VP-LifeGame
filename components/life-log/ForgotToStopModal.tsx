import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import type { ActiveTimer } from '@/store';
import { useStore } from '@/store';
import { openAndroidDateTimePicker } from '@/components/life-log/dateTimePicker';
import { theme } from '@/constants/theme';

interface ForgotToStopModalProps {
  visible: boolean;
  timer: ActiveTimer;
  onContinue: () => void;
  onStopAt: (endTimeIso: string) => void;
  onDiscard: () => void;
}

function guessStopTime(
  timer: ActiveTimer,
  logs: { category: string; duration: number }[]
): Date {
  const sessionStart = parseISO(timer.sessionStartTime ?? timer.startTime);
  const sameCategory = logs.filter((l) => l.category === timer.category);
  if (sameCategory.length > 0) {
    const durations = sameCategory.map((l) => l.duration).sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)];
    return new Date(sessionStart.getTime() + median * 60 * 1000);
  }
  return new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000);
}

export function ForgotToStopModal({
  visible,
  timer,
  onContinue,
  onStopAt,
  onDiscard,
}: ForgotToStopModalProps) {
  const lifeLogs = useStore((s) => s.lifeLogs);
  const defaultStop = useMemo(() => guessStopTime(timer, lifeLogs), [timer, lifeLogs]);
  const [stopTime, setStopTime] = useState(defaultStop);
  const [showPicker, setShowPicker] = useState(false);

  React.useEffect(() => {
    if (visible) setStopTime(guessStopTime(timer, lifeLogs));
  }, [visible, timer, lifeLogs]);

  const sessionStart = parseISO(timer.sessionStartTime ?? timer.startTime);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Are you still {timer.title}?</Text>
          <Text style={styles.subtitle}>
            Started {format(sessionStart, 'h:mm a')} · Now {format(new Date(), 'h:mm a')}
          </Text>

          <Pressable
            style={styles.timeBtn}
            onPress={() => {
              if (Platform.OS === 'android') {
                openAndroidDateTimePicker(stopTime, setStopTime);
              } else {
                setShowPicker(true);
              }
            }}
          >
            <Text style={styles.timeLabel}>Stop at</Text>
            <Text style={styles.timeValue}>{format(stopTime, 'h:mm a')}</Text>
          </Pressable>

          {showPicker && Platform.OS === 'ios' && (
            <DateTimePicker
              value={stopTime}
              mode="datetime"
              display="spinner"
              onChange={(_, date) => {
                if (date) setStopTime(date);
              }}
            />
          )}

          <Pressable style={styles.primaryBtn} onPress={() => onStopAt(stopTime.toISOString())}>
            <Text style={styles.primaryText}>Stop at {format(stopTime, 'h:mm a')}</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onContinue}>
            <Text style={styles.secondaryText}>Continue</Text>
          </Pressable>
          <Pressable style={styles.discardBtn} onPress={onDiscard}>
            <Text style={styles.discardText}>Discard</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 16,
  },
  timeBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 12,
  },
  timeLabel: {
    color: theme.textMuted,
    fontWeight: '600',
  },
  timeValue: {
    color: theme.text,
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '800',
  },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  secondaryText: {
    color: theme.text,
    fontWeight: '700',
  },
  discardBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  discardText: {
    color: theme.textMuted,
    fontWeight: '600',
  },
});

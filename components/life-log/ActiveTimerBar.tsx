import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { getCategoryById } from '@/constants/lifeLogCategories';
import { theme } from '@/constants/theme';
import { formatElapsed } from '@/hooks/useTimer';

interface ActiveTimerBarProps {
  categoryId: string;
  title: string;
  elapsedSeconds: number;
  onStop: () => void;
}

export function ActiveTimerBar({ categoryId, title, elapsedSeconds, onStop }: ActiveTimerBarProps) {
  const cat = getCategoryById(categoryId);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.bar, pulseStyle, cat && { borderColor: `${cat.color}66` }]}>
      <View style={styles.left}>
        <Text style={styles.label}>TIMER RUNNING</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.time, cat && { color: cat.color }]}>{formatElapsed(elapsedSeconds)}</Text>
      </View>
      <Pressable style={styles.stopBtn} onPress={onStop}>
        <Text style={styles.stopText}>STOP</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  time: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  stopBtn: {
    backgroundColor: theme.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  stopText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

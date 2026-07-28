import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface GoalProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  current?: number;
  target?: number;
  unit?: string;
}

function ringColor(percent: number) {
  if (percent >= 100) return '#16a34a';
  if (percent >= 50) return '#f59e0b';
  return theme.accent;
}

export function GoalProgressRing({
  percent,
  size = 80,
  strokeWidth = 8,
  current,
  target,
  unit,
}: GoalProgressRingProps) {
  const animated = useRef(new Animated.Value(0)).current;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: percent,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [percent, animated]);

  const dashOffset = animated.interpolate({
    inputRange: [0, 100],
    outputRange: [circ, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ringColor(percent)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        {current !== undefined && target !== undefined ? (
          <>
            <Text style={[styles.value, { fontSize: size * 0.2 }]}>
              {current}/{target}
            </Text>
            {unit ? (
              <Text style={[styles.unit, { fontSize: size * 0.11 }]}>{unit}</Text>
            ) : null}
          </>
        ) : (
          <Text style={[styles.value, { fontSize: size * 0.22 }]}>{percent}%</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    fontWeight: '700',
    color: theme.text,
  },
  unit: {
    color: theme.textMuted,
    marginTop: 1,
  },
});

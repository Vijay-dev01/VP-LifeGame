import React, { useEffect, useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function progressRingColor(percent: number): string {
  if (percent >= 100) return '#16a34a';
  if (percent >= 50) return '#f59e0b';
  return theme.accent;
}

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  center?: ReactNode;
  showPercent?: boolean;
}

export function ProgressRing({
  percent,
  size = 80,
  strokeWidth = 8,
  center,
  showPercent = false,
}: ProgressRingProps) {
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
          stroke={progressRingColor(percent)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        {center ??
          (showPercent ? (
            <Text style={[styles.percent, { fontSize: size * 0.22 }]}>{percent}%</Text>
          ) : null)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontWeight: '800',
    color: theme.text,
  },
});

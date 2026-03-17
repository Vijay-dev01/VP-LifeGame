import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useStore } from '@/store';
import { computeConsistencyTrend } from '@/store';
import { theme } from '@/constants/theme';

const W = Dimensions.get('window').width - 80;
const H = 180;
const PAD = { l: 32, r: 16, t: 16, b: 28 };

export function ConsistencyChart() {
  const completions = useStore((s) => s.completions);
  const currentMonth = useStore((s) => s.currentMonth);
  const data = useMemo(
    () => computeConsistencyTrend(completions, currentMonth),
    [completions, currentMonth]
  );
  const max = Math.max(1, ...data.map((d) => d.count));

  const x = (i: number) =>
    data.length <= 1 ? PAD.l : PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (max ? (v / max) * (H - PAD.t - PAD.b) : 0);

  const pathD =
    data.length > 0
      ? data
          .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.count)}`)
          .join(' ') + ` L ${x(data.length - 1)} ${H - PAD.b} L ${PAD.l} ${H - PAD.b} Z`
      : '';

  const lineD =
    data.length > 0
      ? data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.count)}`).join(' ')
      : '';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>CONSISTENCY TREND</Text>
      <Svg width={W + PAD.l + PAD.r} height={H} style={styles.svg}>
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.accent} stopOpacity={0.4} />
            <Stop offset="1" stopColor={theme.accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <Line
            key={i}
            x1={PAD.l}
            y1={y((max * i) / 4)}
            x2={W + PAD.l}
            y2={y((max * i) / 4)}
            stroke={theme.border}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}
        <Path d={pathD} fill="url(#fill)" />
        <Path d={lineD} stroke={theme.accent} strokeWidth={2} fill="none" />
      </Svg>
      <View style={styles.xLabels}>
        {[1, 8, 15, 22, 31].map((d) => (
          <Text key={d} style={styles.xLabel}>
            {d}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  svg: {
    marginLeft: -PAD.l,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PAD.l - 8,
    marginTop: 4,
  },
  xLabel: {
    fontSize: 10,
    color: theme.textMuted,
  },
});

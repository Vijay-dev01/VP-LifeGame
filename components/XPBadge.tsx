import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStore } from '@/store';
import { xpProgressInLevel } from '@/utils/leveling';
import { theme } from '@/constants/theme';

interface XPBadgeProps {
  compact?: boolean;
}

export function XPBadge({ compact }: XPBadgeProps) {
  const xpTotal = useStore((s) => s.xpTotal);
  const progress = xpProgressInLevel(xpTotal);

  if (compact) {
    return (
      <View style={styles.compact}>
        <Text style={styles.compactLevel}>Lv {progress.level}</Text>
        <Text style={styles.compactTitle}>{progress.title}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.level}>Level {progress.level}</Text>
        <Text style={styles.title}>{progress.title}</Text>
        <Text style={styles.xp}>{xpTotal.toLocaleString()} XP</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${progress.percent}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {progress.current} / {progress.needed} XP to next level
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  level: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.accent,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
  },
  xp: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
  },
  barBg: {
    height: 6,
    backgroundColor: theme.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 6,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactLevel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.accent,
  },
  compactTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
  },
});

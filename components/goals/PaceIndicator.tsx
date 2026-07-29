import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PACE_LABELS } from '@/constants/goals';
import type { GoalPaceStatus } from '@/store/goalTypes';
import { theme } from '@/constants/theme';

interface PaceIndicatorProps {
  status: GoalPaceStatus;
  hint?: string;
  compact?: boolean;
}

export function PaceIndicator({ status, hint, compact }: PaceIndicatorProps) {
  const config = PACE_LABELS[status];
  const isRisk = status === 'at_risk' || status === 'behind';

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <Text style={styles.emoji}>{config.emoji}</Text>
      <View style={styles.textWrap}>
        <Text style={[styles.label, isRisk && styles.labelRisk]}>{config.label}</Text>
        {hint && !compact ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

interface GoalHealthBadgeProps {
  score: number;
  hasProgress?: boolean;
}

function healthLabel(score: number, hasProgress: boolean): string {
  if (!hasProgress && score === 0) return 'START';
  if (score >= 80) return 'STRONG';
  if (score >= 60) return 'OK';
  if (score >= 30) return 'LOW';
  return 'AT RISK';
}

export function GoalHealthBadge({ score, hasProgress = true }: GoalHealthBadgeProps) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#f59e0b' : theme.accent;
  const label = healthLabel(score, hasProgress);
  return (
    <View style={[styles.healthBadge, { borderColor: color }]}>
      <Text style={[styles.healthScore, { color }]}>{score}</Text>
      <Text style={[styles.healthLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  compact: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 12,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
  labelRisk: {
    color: '#f59e0b',
  },
  hint: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  healthBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 52,
  },
  healthScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  healthLabel: {
    fontSize: 9,
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

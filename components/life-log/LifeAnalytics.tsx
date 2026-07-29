import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLifeAnalytics } from '@/hooks/useLifeAnalytics';
import { getCategoryById } from '@/constants/lifeLogCategories';
import { theme } from '@/constants/theme';
import { formatDurationHours } from '@/utils/lifeLog';
import { useStore } from '@/store';
import { computeReflectionInsights, formatReflectionInsight } from '@/utils/reflectionInsights';
import { fetchAiDistractionInsight } from '@/utils/aiInsights';
import { getSecureApiKey } from '@/utils/secureAiKey';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function LifeAnalytics() {
  const { metrics, insights } = useLifeAnalytics();
  const reflections = useStore((s) => s.reflections);
  const aiEnabled = useStore((s) => s.aiSettings.enabled);
  const reflectionInsight = computeReflectionInsights(reflections);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!aiEnabled) {
      setAiInsight(null);
      return;
    }

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      getSecureApiKey().then((apiKey) => {
        if (!apiKey || controller.signal.aborted) return;
        fetchAiDistractionInsight(apiKey, reflections, controller.signal).then((result) => {
          if (!controller.signal.aborted) setAiInsight(result);
        });
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [aiEnabled, reflections]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>LIFE ANALYTICS</Text>

      <View style={styles.statsGrid}>
        <StatCard label="This week" value={formatDurationHours(metrics.weekTotalMinutes)} />
        <StatCard label="This month" value={formatDurationHours(metrics.monthTotalMinutes)} />
        <StatCard label="Focus score" value={`${metrics.focusScore}%`} />
        <StatCard label="Distraction" value={`${metrics.distractionScore}%`} />
        <StatCard label="Intentionality" value={`${metrics.intentionalityScore}%`} />
        <StatCard label="Consistency" value={`${metrics.consistencyScore}%`} />
      </View>

      <View style={styles.subStats}>
        <Text style={styles.subStat}>
          Avg deep work/day: {formatDurationHours(metrics.avgDeepWorkMinutesPerDay)}
        </Text>
        <Text style={styles.subStat}>
          Avg distraction/day: {formatDurationHours(metrics.avgDistractionMinutesPerDay)}
        </Text>
        <Text style={styles.subStat}>
          Sleep avg: {formatDurationHours(metrics.avgSleepMinutes)}
        </Text>
        <Text style={styles.subStat}>
          Daily activities: {metrics.avgDailyActivityCount}
        </Text>
        {metrics.mostUsedCategory ? (
          <Text style={styles.subStat}>
            Top category: {getCategoryById(metrics.mostUsedCategory)?.label ?? '—'}
          </Text>
        ) : null}
      </View>

      {metrics.categoryBreakdown.length > 0 ? (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>CATEGORY BREAKDOWN</Text>
          {metrics.categoryBreakdown.slice(0, 6).map((item) => {
            const cat = getCategoryById(item.categoryId);
            return (
              <View key={item.categoryId} style={styles.barRow}>
                <Text style={styles.barName} numberOfLines={1}>
                  {cat?.label ?? item.categoryId}
                </Text>
                <View style={styles.barWrap}>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${item.percent}%`,
                          backgroundColor: cat?.color ?? theme.accent,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barPct}>{item.percent}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {reflections.length > 0 ? (
        <View style={styles.insights}>
          <Text style={styles.breakdownTitle}>DISTRACTION PATTERNS</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>{formatReflectionInsight(reflectionInsight)}</Text>
          </View>
          {aiInsight ? (
            <View style={styles.insightCard}>
              <Text style={styles.insightText}>{aiInsight}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {insights.length > 0 ? (
        <View style={styles.insights}>
          <Text style={styles.breakdownTitle}>INSIGHTS</Text>
          {insights.map((msg, i) => (
            <View key={i} style={styles.insightCard}>
              <Text style={styles.insightText}>{msg}</Text>
            </View>
          ))}
        </View>
      ) : null}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: theme.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 10,
    minWidth: 90,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  subStats: {
    gap: 4,
    marginBottom: 12,
  },
  subStat: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
  },
  breakdown: {
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  barName: {
    flex: 1,
    fontSize: 13,
    color: theme.text,
  },
  barWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 110,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: theme.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barPct: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    width: 32,
    textAlign: 'right',
  },
  insights: {
    gap: 6,
  },
  insightCard: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)',
    borderRadius: 8,
    padding: 10,
  },
  insightText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
});

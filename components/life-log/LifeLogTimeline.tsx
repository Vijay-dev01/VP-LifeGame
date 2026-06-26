import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LifeLog } from '@/store';
import type { GroupedLifeLogs } from '@/hooks/useLifeLog';
import { LifeLogCard } from './LifeLogCard';
import { theme } from '@/constants/theme';
import { formatDurationHours } from '@/utils/lifeLog';

interface LifeLogTimelineProps {
  grouped: GroupedLifeLogs;
  dayTotals: (logs: LifeLog[]) => number;
}

interface Section {
  key: string;
  title: string;
  logs: LifeLog[];
}

export function LifeLogTimeline({ grouped, dayTotals }: LifeLogTimelineProps) {
  const sections: Section[] = [
    { key: 'today', title: 'TODAY', logs: grouped.today },
    { key: 'yesterday', title: 'YESTERDAY', logs: grouped.yesterday },
    { key: 'thisWeek', title: 'THIS WEEK', logs: grouped.thisWeek },
    { key: 'older', title: 'OLDER', logs: grouped.older },
  ].filter((s) => s.logs.length > 0);

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No activities logged yet</Text>
        <Text style={styles.emptySub}>Tap a quick start button or + to log your first activity.</Text>
      </View>
    );
  }

  let cardIndex = 0;

  return (
    <View style={styles.wrap}>
      {sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>{formatDurationHours(dayTotals(section.logs))}</Text>
          </View>
          {section.logs.map((log) => {
            const idx = cardIndex++;
            return <LifeLogCard key={log.id} log={log} index={idx} />;
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 80,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  sectionTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  emptySub: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

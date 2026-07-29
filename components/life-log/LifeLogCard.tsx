import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import type { LifeLog } from '@/store';
import { CategoryBadge } from './CategoryBadge';
import { theme } from '@/constants/theme';
import { formatDuration, MOOD_EMOJI } from '@/utils/lifeLog';

interface LifeLogCardProps {
  log: LifeLog;
}

export const LifeLogCard = memo(function LifeLogCard({ log }: LifeLogCardProps) {
  const timeLabel = format(parseISO(log.startTime), 'h:mm a');

  const handlePress = useCallback(() => {
    router.push({ pathname: '/life-log/edit/[id]', params: { id: log.id } });
  }, [log.id]);

  return (
    <Pressable style={styles.card} onPress={handlePress}>
        <View style={styles.timeCol}>
          <Text style={styles.time}>{timeLabel}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {log.title}
          </Text>
          <View style={styles.meta}>
            <CategoryBadge categoryId={log.category} compact />
            <Text style={styles.duration}>{formatDuration(log.duration)}</Text>
            {log.mood ? <Text style={styles.mood}>{MOOD_EMOJI[log.mood]}</Text> : null}
            {log.energyLevel ? (
              <View style={styles.energy}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.energyDot, i < log.energyLevel! && styles.energyDotOn]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  timeCol: {
    width: 72,
  },
  time: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  duration: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
  },
  mood: {
    fontSize: 14,
  },
  energy: {
    flexDirection: 'row',
    gap: 3,
  },
  energyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.border,
  },
  energyDotOn: {
    backgroundColor: theme.accent,
  },
});

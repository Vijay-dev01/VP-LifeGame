import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { useBuddyOptional } from '@/hooks/useBuddyAssistant';

export function BuddyOverlay() {
  const buddy = useBuddyOptional();
  if (!buddy?.enabled) return null;

  const active =
    buddy.mode === 'commandListening' ||
    buddy.mode === 'wakeListening' ||
    buddy.mode === 'speaking';

  const overlayStatus =
    buddy.lockScreenStatusLabel && buddy.lockScreenStatus !== 'off'
      ? buddy.lockScreenStatusLabel
      : buddy.statusLabel;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        style={[styles.pill, active && styles.pillActive]}
        onPress={buddy.toggleManualCommand}
      >
        <Text style={styles.icon}>{active ? '🎙' : '🤖'}</Text>
        <View style={styles.textWrap}>
          <Text style={styles.label}>Hey Buddy</Text>
          <Text style={styles.status} numberOfLines={1}>
            {overlayStatus}
          </Text>
        </View>
      </Pressable>
      {buddy.error ? <Text style={styles.error}>{buddy.error}</Text> : null}
      {buddy.lastTranscript ? (
        <Text style={styles.transcript} numberOfLines={2}>
          &quot;{buddy.lastTranscript}&quot;
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    bottom: 88,
    right: 80,
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pillActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.12)',
  },
  icon: {
    fontSize: 18,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: 0.3,
  },
  status: {
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 2,
  },
  error: {
    marginTop: 6,
    fontSize: 10,
    color: theme.accent,
  },
  transcript: {
    marginTop: 4,
    fontSize: 10,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
});

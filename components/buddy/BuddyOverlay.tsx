import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useBuddyOptional } from '@/hooks/useBuddyAssistant';

const TAB_BAR_HEIGHT = 49;
const FAB_CLEARANCE = 72;

export const BuddyOverlay = memo(function BuddyOverlay() {
  const buddy = useBuddyOptional();
  const insets = useSafeAreaInsets();

  if (!buddy?.enabled) return null;

  const active =
    buddy.mode === 'commandListening' ||
    buddy.mode === 'wakeListening' ||
    buddy.mode === 'speaking';

  const overlayStatus =
    buddy.lockScreenStatusLabel && buddy.lockScreenStatus !== 'off'
      ? buddy.lockScreenStatusLabel
      : buddy.statusLabel;

  const bottom = TAB_BAR_HEIGHT + insets.bottom + 8;

  return (
    <View style={[styles.wrap, { bottom, left: 12 }]} pointerEvents="box-none">
      {active ? (
        <View style={styles.activeBlock}>
          <Pressable
            style={[styles.pill, styles.pillActive]}
            onPress={buddy.toggleManualCommand}
          >
            <Text style={styles.icon}>{buddy.mode === 'speaking' ? '🔊' : '🎙'}</Text>
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
      ) : (
        <Pressable
          style={styles.iconBtn}
          onPress={buddy.toggleManualCommand}
          accessibilityLabel="Hey Buddy"
          accessibilityRole="button"
        >
          <Text style={styles.iconOnly}>🤖</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 100,
    maxWidth: '100%',
    paddingRight: FAB_CLEARANCE,
  },
  activeBlock: {
    maxWidth: '100%',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  iconOnly: {
    fontSize: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    fontSize: 16,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
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

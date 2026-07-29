import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useBuddyOptional } from '@/hooks/useBuddyAssistant';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 49 : 56;
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

  const feedbackBlock = (
    <>
      {buddy.error ? <Text style={styles.error}>{buddy.error}</Text> : null}
      {buddy.lastTranscript ? (
        <Text style={styles.transcript} numberOfLines={2}>
          &quot;{buddy.lastTranscript}&quot;
        </Text>
      ) : null}
    </>
  );

  return (
    <View style={[styles.wrap, { bottom, left: 12 }]} pointerEvents="box-none">
      {active ? (
        <View style={styles.activeBlock}>
          <Pressable
            style={({ pressed }) => [styles.pill, styles.pillActive, pressed && styles.pressed]}
            onPress={buddy.toggleManualCommand}
            hitSlop={12}
            android_ripple={{ color: 'rgba(220,38,38,0.2)', borderless: false }}
          >
            <Text style={styles.icon}>{buddy.mode === 'speaking' ? '🔊' : '🎙'}</Text>
            <View style={styles.textWrap}>
              <Text style={styles.label}>Hey Buddy</Text>
              <Text style={styles.status} numberOfLines={1}>
                {overlayStatus}
              </Text>
            </View>
          </Pressable>
          {feedbackBlock}
        </View>
      ) : (
        <View style={styles.idleBlock}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            onPress={buddy.toggleManualCommand}
            accessibilityLabel="Hey Buddy"
            accessibilityRole="button"
            hitSlop={12}
            android_ripple={{ color: 'rgba(220,38,38,0.2)', borderless: true }}
          >
            <Text style={styles.iconOnly}>🤖</Text>
          </Pressable>
          {feedbackBlock}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 200,
    maxWidth: '100%',
    paddingRight: FAB_CLEARANCE,
  },
  activeBlock: {
    maxWidth: '100%',
  },
  idleBlock: {
    alignItems: 'flex-start',
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
    elevation: 8,
  },
  pressed: {
    opacity: 0.75,
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
    elevation: 8,
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
    maxWidth: 220,
  },
  transcript: {
    marginTop: 4,
    fontSize: 10,
    color: theme.textMuted,
    fontStyle: 'italic',
    maxWidth: 220,
  },
});

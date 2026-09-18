import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { TogglePill } from '@/components/ui/TogglePill';
import { theme } from '@/constants/theme';
import { useBuddyOptional } from '@/hooks/useBuddyAssistant';
import { useStore } from '@/store';

const VOICE_COMMANDS = [
  { phrase: '"Hey buddy"', action: 'Wake up (lock screen mode)' },
  { phrase: '"Hey buddy start coding"', action: 'Start timer in one phrase' },
  { phrase: '"Start coding" / "coding"', action: 'Start timer (tap-to-talk)' },
  { phrase: '"Stop"', action: 'Stop active timer' },
  { phrase: '"Add tomorrow buy milk"', action: 'Add tasks for tomorrow' },
  { phrase: '"Groceries complete"', action: 'Mark task done' },
];

export function BuddySettingsCard() {
  const buddySettings = useStore((s) => s.buddySettings);
  const setBuddySettings = useStore((s) => s.setBuddySettings);
  const buddy = useBuddyOptional();
  const [commandsOpen, setCommandsOpen] = useState(false);
  const lockScreenStatusLabel =
    buddy?.lockScreenStatusLabel && buddy.lockScreenStatus !== 'off'
      ? buddy.lockScreenStatusLabel
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Hey Buddy</Text>
        <TogglePill
          on={buddySettings.enabled}
          onPress={() => setBuddySettings({ enabled: !buddySettings.enabled })}
        />
      </View>

      {buddySettings.enabled ? (
        <>
          <Text style={styles.hint}>
            Voice assistant for timers and tasks. Tap the bot icon on any tab, or use lock screen
            listen on Android. Does not use your OpenAI API key.
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={buddySettings.userName}
              onChangeText={(userName) => setBuddySettings({ userName })}
              placeholder="Vijay"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {Platform.OS === 'android' ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Lock screen</Text>
                <TogglePill
                  on={buddySettings.lockScreenListen}
                  onPress={() =>
                    setBuddySettings({ lockScreenListen: !buddySettings.lockScreenListen })
                  }
                />
              </View>
              {buddySettings.lockScreenListen && lockScreenStatusLabel ? (
                <Text style={styles.lockStatus}>{lockScreenStatusLabel}</Text>
              ) : null}
            </>
          ) : null}

          {buddy?.error ? <Text style={styles.error}>{buddy.error}</Text> : null}

          <Pressable
            style={styles.commandsToggle}
            onPress={() => setCommandsOpen((open) => !open)}
          >
            <Text style={styles.commandsToggleText}>
              {commandsOpen ? 'Hide voice commands' : 'Show voice commands'}
            </Text>
          </Pressable>

          {commandsOpen ? (
            <View style={styles.commandsList}>
              {VOICE_COMMANDS.map((item) => (
                <View key={item.phrase} style={styles.commandRow}>
                  <Text style={styles.commandPhrase}>{item.phrase}</Text>
                  <Text style={styles.commandAction}>{item.action}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
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
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 11,
    color: theme.textMuted,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  input: {
    flex: 1,
    maxWidth: 140,
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: theme.text,
    fontSize: 13,
    textAlign: 'right',
  },
  lockStatus: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: -2,
  },
  error: {
    fontSize: 11,
    color: theme.accent,
    fontWeight: '600',
  },
  commandsToggle: {
    alignSelf: 'flex-start',
  },
  commandsToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
  },
  commandsList: {
    gap: 8,
    paddingTop: 4,
  },
  commandRow: {
    gap: 2,
  },
  commandPhrase: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  commandAction: {
    fontSize: 11,
    color: theme.textMuted,
  },
});

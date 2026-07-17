import React from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '@/constants/theme';
import { useBuddyLockScreenStatusLabel } from '@/hooks/useBuddyLockScreenStatusLabel';
import { useStore } from '@/store';

function Toggle({
  on,
  onPress,
  disabled,
}: {
  on: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.toggle, on && styles.toggleOn, disabled && styles.toggleDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.toggleText}>{on ? 'ON' : 'OFF'}</Text>
    </Pressable>
  );
}

export function BuddySettingsCard() {
  const buddySettings = useStore((s) => s.buddySettings);
  const setBuddySettings = useStore((s) => s.setBuddySettings);
  const lockScreenStatusLabel = useBuddyLockScreenStatusLabel();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Hey Buddy</Text>
        <Toggle
          on={buddySettings.enabled}
          onPress={() => setBuddySettings({ enabled: !buddySettings.enabled })}
        />
      </View>

      {buddySettings.enabled ? (
        <>
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
                <Toggle
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
  toggle: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  toggleDisabled: {
    opacity: 0.45,
  },
  toggleText: {
    fontWeight: '700',
    color: theme.text,
    fontSize: 12,
  },
  lockStatus: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: -2,
  },
});

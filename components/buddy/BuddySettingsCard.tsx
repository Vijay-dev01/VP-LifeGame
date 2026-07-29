import React from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { TogglePill } from '@/components/ui/TogglePill';
import { theme } from '@/constants/theme';
import { useBuddyOptional } from '@/hooks/useBuddyAssistant';
import { useStore } from '@/store';

export function BuddySettingsCard() {
  const buddySettings = useStore((s) => s.buddySettings);
  const setBuddySettings = useStore((s) => s.setBuddySettings);
  const buddy = useBuddyOptional();
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
  lockStatus: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: -2,
  },
});

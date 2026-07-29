import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { TogglePill } from '@/components/ui/TogglePill';
import { BuddySettingsCard } from '@/components/buddy/BuddySettingsCard';
import { theme } from '@/constants/theme';
import { useStore } from '@/store';

interface SettingsSectionProps {
  aiEnabled: boolean;
  onAiToggle: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function SettingsSection({
  aiEnabled,
  onAiToggle,
  apiKey,
  onApiKeyChange,
}: SettingsSectionProps) {
  const notificationSettings = useStore((s) => s.notificationSettings);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);
  const setWeeklySummaryEnabled = useStore((s) => s.setWeeklySummaryEnabled);
  const setDailyNotificationLimit = useStore((s) => s.setDailyNotificationLimit);
  const reportRecipient = useStore((s) => s.reportRecipient);
  const setReportRecipient = useStore((s) => s.setReportRecipient);
  const autoEmailMonthlyReport = useStore((s) => s.autoEmailMonthlyReport);
  const setAutoEmailMonthlyReport = useStore((s) => s.setAutoEmailMonthlyReport);
  const forgotToStopState = useStore((s) => s.forgotToStopState);
  const setForgotToStopThreshold = useStore((s) => s.setForgotToStopThreshold);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>SETTINGS</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.label}>All reminders</Text>
          <TogglePill
            compact
            on={notificationSettings.enabled}
            onPress={() => setNotificationsEnabled(!notificationSettings.enabled)}
            label={notificationSettings.enabled ? 'ON' : 'OFF'}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Weekly summary (Sun)</Text>
          <TogglePill
            compact
            on={notificationSettings.weeklySummaryEnabled}
            onPress={() =>
              setWeeklySummaryEnabled(!notificationSettings.weeklySummaryEnabled)
            }
            label={notificationSettings.weeklySummaryEnabled ? 'ON' : 'OFF'}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Daily limit</Text>
          <View style={styles.limitRow}>
            <TogglePill
              compact
              on={notificationSettings.dailyLimit === 2}
              onPress={() => setDailyNotificationLimit(2)}
              label="2"
            />
            <TogglePill
              compact
              on={notificationSettings.dailyLimit === 3}
              onPress={() => setDailyNotificationLimit(3)}
              label="3"
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reports</Text>
        <Text style={styles.hint}>Email recipient for monthly PDF</Text>
        <TextInput
          style={styles.input}
          value={reportRecipient}
          onChangeText={setReportRecipient}
          placeholder="you@email.com"
          placeholderTextColor={theme.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.row}>
          <Text style={styles.label}>Auto-email monthly report</Text>
          <TogglePill
            compact
            on={autoEmailMonthlyReport}
            onPress={() => setAutoEmailMonthlyReport(!autoEmailMonthlyReport)}
            label={autoEmailMonthlyReport ? 'ON' : 'OFF'}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Life Log</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Forgot-to-stop alert (hours)</Text>
          <View style={styles.limitRow}>
            {[3, 4, 6].map((hours) => (
              <TogglePill
                key={hours}
                compact
                on={forgotToStopState.thresholdHours === hours}
                onPress={() => setForgotToStopThreshold(hours)}
                label={String(hours)}
              />
            ))}
          </View>
        </View>
      </View>

      <BuddySettingsCard />

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>AI Insights (optional)</Text>
          <TogglePill on={aiEnabled} onPress={onAiToggle} />
        </View>
        {aiEnabled ? (
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={onApiKeyChange}
            placeholder="OpenAI API key (stored securely)"
            placeholderTextColor={theme.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  cardTitle: {
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
    flex: 1,
  },
  hint: {
    fontSize: 12,
    color: theme.textMuted,
  },
  input: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 10,
    color: theme.text,
    fontSize: 12,
  },
  limitRow: {
    flexDirection: 'row',
    gap: 8,
  },
});

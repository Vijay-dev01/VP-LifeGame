import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { TogglePill } from '@/components/ui/TogglePill';
import { BuddySettingsCard } from '@/components/buddy/BuddySettingsCard';
import { theme } from '@/constants/theme';
import { getAiSettingsStatus } from '@/hooks/useAiSettings';
import { useStore } from '@/store';

interface SettingsSectionProps {
  aiEnabled: boolean;
  onAiToggle: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  aiLoaded: boolean;
  aiTestStatus: 'idle' | 'testing' | 'ok' | 'error';
  aiTestError: string | null;
  onTestApiKey: () => void;
}

export function SettingsSection({
  aiEnabled,
  onAiToggle,
  apiKey,
  onApiKeyChange,
  aiLoaded,
  aiTestStatus,
  aiTestError,
  onTestApiKey,
}: SettingsSectionProps) {
  const notificationSettings = useStore((s) => s.notificationSettings);
  const reflections = useStore((s) => s.reflections);
  const aiStatus = getAiSettingsStatus({
    enabled: aiEnabled,
    apiKey,
    loaded: aiLoaded,
    reflectionCount: reflections.length,
    testStatus: aiTestStatus,
    testError: aiTestError,
  });
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
          <>
            <Text style={styles.hint}>
              Adds an AI coaching line under Distraction Patterns in Life Analytics. Requires
              nightly reflections — does not power Hey Buddy voice.
            </Text>
            <View style={styles.aiStatusRow}>
              <Text style={styles.aiStatusLabel}>Status</Text>
              <Text
                style={[
                  styles.aiStatusValue,
                  aiStatus.status === 'error' && styles.aiStatusError,
                  aiStatus.status === 'ready' && styles.aiStatusReady,
                ]}
              >
                {aiStatus.label}
              </Text>
            </View>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={onApiKeyChange}
              placeholder="OpenAI API key (stored securely)"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />
            <Pressable
              style={[styles.testBtn, aiTestStatus === 'testing' && styles.testBtnDisabled]}
              onPress={onTestApiKey}
              disabled={aiTestStatus === 'testing'}
            >
              <Text style={styles.testBtnText}>
                {aiTestStatus === 'testing' ? 'Testing…' : 'Test connection'}
              </Text>
            </Pressable>
            {aiTestError ? <Text style={styles.aiError}>{aiTestError}</Text> : null}
            {aiTestStatus === 'ok' ? (
              <Text style={styles.aiSuccess}>API key verified.</Text>
            ) : null}
          </>
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
  aiStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
  },
  aiStatusValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  aiStatusReady: {
    color: '#22c55e',
  },
  aiStatusError: {
    color: theme.accent,
  },
  testBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceLight,
  },
  testBtnDisabled: {
    opacity: 0.6,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  aiError: {
    fontSize: 11,
    color: theme.accent,
    fontWeight: '600',
  },
  aiSuccess: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
});

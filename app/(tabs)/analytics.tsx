import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { TabScreen } from '@/components/layout/TabScreen';
import { ConsistencyChart } from '@/components/ConsistencyChart';
import { HabitBreakdown } from '@/components/HabitBreakdown';
import { LifeAnalytics } from '@/components/life-log/LifeAnalytics';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { theme } from '@/constants/theme';
import { useAiSettings } from '@/hooks/useAiSettings';
import { useStore } from '@/store';
import { clearSecureApiKey } from '@/utils/secureAiKey';
import { emailMonthlyPdf, shareMonthlyPdf } from '@/utils/monthlyReport';
import { format } from 'date-fns';

export default function AnalyticsScreen() {
  const currentMonth = useStore((s) => s.currentMonth);
  const reportRecipient = useStore((s) => s.reportRecipient);
  const resetAllData = useStore((s) => s.resetAllData);
  const { enabled: aiEnabled, apiKey, setApiKey, toggleEnabled } = useAiSettings();

  const [reportModalOpen, setReportModalOpen] = useState(false);

  const monthLabel = format(new Date(currentMonth + 'T12:00:00'), 'MMMM yyyy');

  const handleGenerate = async () => {
    try {
      await shareMonthlyPdf(currentMonth);
      setReportModalOpen(false);
    } catch {
      Alert.alert('Failed', 'Could not generate PDF report.');
    }
  };

  const handleEmail = async () => {
    try {
      await emailMonthlyPdf(currentMonth, reportRecipient);
      setReportModalOpen(false);
    } catch {
      Alert.alert('Failed', 'Could not open email composer.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset all data?',
      'This permanently clears habits, missions, life logs, goals, XP, reflections, plans, buddy settings, and AI preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            resetAllData();
            await clearSecureApiKey();
            setReportModalOpen(false);
          },
        },
      ]
    );
  };

  return (
    <>
      <TabScreen scrollProps={{ contentContainerStyle: styles.content }}>
        <Pressable onPress={() => setReportModalOpen(true)} style={styles.reportBtn}>
          <Text style={styles.reportBtnText}>REPORT (PDF / EMAIL / RESET)</Text>
        </Pressable>

        <ConsistencyChart />
        <HabitBreakdown />
        <SettingsSection
          aiEnabled={aiEnabled}
          onAiToggle={toggleEnabled}
          apiKey={apiKey}
          onApiKeyChange={(key) => void setApiKey(key)}
        />
        <LifeAnalytics />
      </TabScreen>

      <Modal
        visible={reportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setReportModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>Monthly Report</Text>
              <Pressable onPress={() => setReportModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>{monthLabel}</Text>

            <Pressable onPress={handleReset} style={[styles.modalBtn, styles.modalBtnDanger]}>
              <Text style={[styles.modalBtnText, styles.modalBtnTextDanger]}>Reset All Data</Text>
            </Pressable>

            <Pressable onPress={handleEmail} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Email Report</Text>
            </Pressable>

            <Pressable onPress={handleGenerate} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Generate PDF</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 6,
  },
  reportBtn: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  reportBtnText: {
    color: theme.text,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  modalSubtitle: {
    color: theme.textMuted,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalCloseText: {
    color: theme.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 10,
  },
  modalBtnDanger: {
    backgroundColor: 'rgba(220,38,38,0.12)',
    borderColor: 'rgba(220,38,38,0.35)',
  },
  modalBtnText: {
    color: theme.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalBtnTextDanger: {
    color: theme.accent,
  },
});

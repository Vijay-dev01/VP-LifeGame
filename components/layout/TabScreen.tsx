import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { theme } from '@/constants/theme';

interface TabScreenProps {
  children: ReactNode;
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  showHeader?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function TabScreen({
  children,
  scroll = true,
  scrollProps,
  showHeader = true,
  edges = ['top'],
}: TabScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={edges}>
      {showHeader ? <Header /> : null}
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});

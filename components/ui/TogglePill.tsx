import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface TogglePillProps {
  on: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function TogglePill({
  on,
  onPress,
  label,
  disabled,
  style,
  compact,
}: TogglePillProps) {
  const text = label ?? (on ? 'ON' : 'OFF');

  return (
    <Pressable
      style={[
        compact ? styles.compact : styles.toggle,
        on && styles.toggleOn,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={compact ? styles.compactText : styles.toggleText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compact: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: theme.surface,
  },
  toggleOn: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(220,38,38,0.16)',
  },
  disabled: {
    opacity: 0.45,
  },
  toggleText: {
    fontWeight: '700',
    color: theme.text,
    fontSize: 12,
  },
  compactText: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 11,
  },
});

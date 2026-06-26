import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { QUICK_ADD_CATEGORY_IDS, getCategoryById } from '@/constants/lifeLogCategories';
import { theme } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface QuickAddBarProps {
  onQuickStart: (categoryId: string) => void;
  disabled?: boolean;
}

export function QuickAddBar({ onQuickStart, disabled }: QuickAddBarProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>QUICK START</Text>
      <View style={styles.row}>
        {QUICK_ADD_CATEGORY_IDS.map((id) => {
          const cat = getCategoryById(id);
          if (!cat) return null;
          const Icon = cat.icon;
          return (
            <QuickAddButton
              key={id}
              label={cat.label.split(' ')[0]}
              color={cat.color}
              icon={<Icon size={18} color={cat.color} />}
              onPress={() => onQuickStart(id)}
              disabled={disabled}
            />
          );
        })}
      </View>
    </View>
  );
}

function QuickAddButton({
  label,
  color,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={[styles.btn, { borderColor: `${color}55`, backgroundColor: `${color}18` }, animStyle]}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.94);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.btnLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  btnLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
});

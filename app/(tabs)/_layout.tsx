import React from 'react';
import { Tabs } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { Text } from 'react-native';
import { theme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.bg, borderTopColor: theme.border },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⊞</Text>,
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'Missions',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✓</Text>,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎯</Text>,
        }}
      />
      <Tabs.Screen
        name="life-log"
        options={{
          title: 'Life Log',
          tabBarIcon: ({ color }) => <Clock size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>▤</Text>,
        }}
      />
    </Tabs>
  );
}

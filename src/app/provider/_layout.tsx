import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

// ─── Professional Geometric Icons (No Emojis) ─────────────────────────────

// Inbox/Requests icon (tray with arrow down)
const InboxIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Tray body */}
    <View style={{
      position: 'absolute', bottom: 0,
      width: 20, height: 9,
      borderLeftWidth: focused ? 2 : 1.5, borderRightWidth: focused ? 2 : 1.5, borderBottomWidth: focused ? 2 : 1.5,
      borderColor: color,
      backgroundColor: focused ? color + '15' : 'transparent',
      borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    }} />
    {/* Down arrow */}
    <View style={{ position: 'absolute', top: 1, width: 1.5, height: 8, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ position: 'absolute', top: 6, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color }} />
  </View>
);

// Briefcase/Offerings icon
const BriefcaseIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Body */}
    <View style={{
      width: 20, height: 13,
      borderWidth: focused ? 2 : 1.5, borderColor: color,
      borderRadius: 3,
      backgroundColor: focused ? color + '15' : 'transparent',
      position: 'absolute', bottom: 1,
    }} />
    {/* Handle */}
    <View style={{
      position: 'absolute', top: 1,
      width: 10, height: 6,
      borderTopWidth: focused ? 2 : 1.5, borderLeftWidth: focused ? 2 : 1.5, borderRightWidth: focused ? 2 : 1.5,
      borderColor: color,
      borderTopLeftRadius: 3, borderTopRightRadius: 3,
    }} />
    {/* Center line */}
    <View style={{ position: 'absolute', bottom: 7, width: 20, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

// Person icon for Profile
const ProfileIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      position: 'absolute', top: 1,
      width: 11, height: 11, borderRadius: 5.5,
      borderWidth: focused ? 2 : 1.5, borderColor: color,
      backgroundColor: focused ? color + '20' : 'transparent',
    }} />
    <View style={{
      position: 'absolute', bottom: 0,
      width: 18, height: 9,
      borderTopLeftRadius: 9, borderTopRightRadius: 9,
      borderLeftWidth: focused ? 2 : 1.5, borderRightWidth: focused ? 2 : 1.5, borderTopWidth: focused ? 2 : 1.5,
      borderColor: color,
      backgroundColor: focused ? color + '10' : 'transparent',
    }} />
  </View>
);

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function ProviderLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#bae6fd',
          paddingBottom: 32,
          paddingTop: 8,
          height: 88,
          shadowColor: '#0ea5e9',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, focused }) => <InboxIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Offerings',
          tabBarIcon: ({ color, focused }) => <BriefcaseIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
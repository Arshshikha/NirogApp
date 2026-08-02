import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

// ─── Professional Geometric Icons (No Emojis) ─────────────────────────────

// Calendar/Bookings icon
const CalendarIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 18, height: 16, borderWidth: focused ? 2 : 1.5, borderColor: color,
      borderRadius: 3, backgroundColor: focused ? color + '15' : 'transparent',
      alignItems: 'center',
    }}>
      {/* Header bar */}
      <View style={{ width: '100%', height: 5, backgroundColor: color, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      {/* Grid dots */}
      <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
        <View style={{ width: 3, height: 3, backgroundColor: color, borderRadius: 1, opacity: 0.7 }} />
        <View style={{ width: 3, height: 3, backgroundColor: color, borderRadius: 1, opacity: 0.7 }} />
        <View style={{ width: 3, height: 3, backgroundColor: color, borderRadius: 1, opacity: 0.7 }} />
      </View>
    </View>
    {/* Top rings */}
    <View style={{ position: 'absolute', top: 0, left: 4, width: 3, height: 4, borderWidth: 1.5, borderColor: color, borderRadius: 2, backgroundColor: '#fff' }} />
    <View style={{ position: 'absolute', top: 0, right: 4, width: 3, height: 4, borderWidth: 1.5, borderColor: color, borderRadius: 2, backgroundColor: '#fff' }} />
  </View>
);

// Clock/Slots icon
const ClockIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 20, height: 20, borderRadius: 10,
      borderWidth: focused ? 2 : 1.5, borderColor: color,
      backgroundColor: focused ? color + '15' : 'transparent',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <View style={{ position: 'absolute', width: 1.5, height: 6, backgroundColor: color, top: 3, borderRadius: 1 }} />
      <View style={{ position: 'absolute', width: 5, height: 1.5, backgroundColor: color, left: 10, top: 9, borderRadius: 1 }} />
    </View>
  </View>
);

// Pen/Write icon for Hub Creator
const PenIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Pen body */}
    <View style={{
      position: 'absolute', top: 1, right: 2,
      width: 5, height: 12,
      borderWidth: focused ? 2 : 1.5, borderColor: color,
      borderRadius: 2,
      backgroundColor: focused ? color + '20' : 'transparent',
      transform: [{ rotate: '-35deg' }],
    }} />
    {/* Pen tip */}
    <View style={{
      position: 'absolute', bottom: 3, left: 3,
      width: 0, height: 0,
      borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6,
      borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color,
      transform: [{ rotate: '-35deg' }],
    }} />
    {/* Baseline */}
    <View style={{ position: 'absolute', bottom: 1, left: 0, right: 0, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

// Person/Profile icon
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

export default function DoctorLayout() {
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
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => <CalendarIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="slots"
        options={{
          title: 'Slots',
          tabBarIcon: ({ color, focused }) => <ClockIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          title: 'Hub Creator',
          tabBarIcon: ({ color, focused }) => <PenIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
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
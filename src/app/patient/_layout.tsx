import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

// ─── Custom Professional Icon Components (Zero Emojis) ───────────────────────

// Home icon: geometric house shape
const HomeIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Roof triangle */}
    <View style={{
      position: 'absolute', top: 0,
      width: 0, height: 0,
      borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 10,
      borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
    }} />
    {/* House body */}
    <View style={{
      position: 'absolute', bottom: 0,
      width: 14, height: 12,
      borderWidth: focused ? 2 : 1.5, borderColor: color,
      backgroundColor: focused ? color + '20' : 'transparent',
      borderTopWidth: 0,
    }} />
    {/* Door */}
    <View style={{
      position: 'absolute', bottom: 0,
      width: 4, height: 6,
      borderWidth: 1.5, borderColor: color,
      borderBottomWidth: 0,
      backgroundColor: 'transparent',
    }} />
  </View>
);

// Hospital icon: building with cross
const HospitalIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Building body */}
    <View style={{
      width: 17, height: 17,
      borderWidth: focused ? 2 : 1.5, borderColor: color,
      backgroundColor: focused ? color + '15' : 'transparent',
      borderRadius: 2, alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Horizontal bar of cross */}
      <View style={{ width: 9, height: 2.5, backgroundColor: color, position: 'absolute', borderRadius: 1 }} />
      {/* Vertical bar of cross */}
      <View style={{ width: 2.5, height: 9, backgroundColor: color, position: 'absolute', borderRadius: 1 }} />
    </View>
  </View>
);

// Lab/Flask icon
const LabIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Flask neck */}
    <View style={{
      position: 'absolute', top: 1,
      width: 6, height: 7,
      borderLeftWidth: 1.5, borderRightWidth: 1.5, borderTopWidth: 1.5,
      borderColor: color, borderTopLeftRadius: 1, borderTopRightRadius: 1,
    }} />
    {/* Flask body */}
    <View style={{
      position: 'absolute', bottom: 1,
      width: 16, height: 10,
      borderLeftWidth: focused ? 2 : 1.5,
      borderRightWidth: focused ? 2 : 1.5,
      borderBottomWidth: focused ? 2 : 1.5,
      borderColor: color,
      backgroundColor: focused ? color + '15' : 'transparent',
      borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    }} />
  </View>
);

// Learning Hub / Open book icon
const HubIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Left page */}
    <View style={{
      position: 'absolute', left: 1, top: 3,
      width: 9, height: 15,
      borderLeftWidth: focused ? 2 : 1.5, borderTopWidth: focused ? 2 : 1.5, borderBottomWidth: focused ? 2 : 1.5,
      borderColor: color,
      backgroundColor: focused ? color + '10' : 'transparent',
      borderTopLeftRadius: 2, borderBottomLeftRadius: 2,
    }} />
    {/* Spine */}
    <View style={{ width: 2, height: 15, backgroundColor: color, position: 'absolute', top: 3, borderRadius: 1 }} />
    {/* Right page */}
    <View style={{
      position: 'absolute', right: 1, top: 3,
      width: 9, height: 15,
      borderRightWidth: focused ? 2 : 1.5, borderTopWidth: focused ? 2 : 1.5, borderBottomWidth: focused ? 2 : 1.5,
      borderColor: color,
      backgroundColor: focused ? color + '10' : 'transparent',
      borderTopRightRadius: 2, borderBottomRightRadius: 2,
    }} />
  </View>
);

// Profile / Person icon
const ProfileIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Head */}
    <View style={{
      position: 'absolute', top: 1,
      width: 11, height: 11, borderRadius: 5.5,
      borderWidth: focused ? 2 : 1.5, borderColor: color,
      backgroundColor: focused ? color + '20' : 'transparent',
    }} />
    {/* Shoulders arc */}
    <View style={{
      position: 'absolute', bottom: 0,
      width: 18, height: 9,
      borderTopLeftRadius: 9, borderTopRightRadius: 9,
      borderLeftWidth: focused ? 2 : 1.5,
      borderRightWidth: focused ? 2 : 1.5,
      borderTopWidth: focused ? 2 : 1.5,
      borderColor: color,
      backgroundColor: focused ? color + '10' : 'transparent',
    }} />
  </View>
);

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0284c7',     // Sky-600 – active blue
        tabBarInactiveTintColor: '#94a3b8',   // Slate-400 – inactive
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#bae6fd',           // Light-blue top border
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
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <HomeIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="hospitals"
        options={{
          title: 'Hospitals',
          tabBarIcon: ({ color, focused }) => <HospitalIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="labs"
        options={{
          title: 'Labs',
          tabBarIcon: ({ color, focused }) => <LabIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          title: 'Learning Hub',
          tabBarIcon: ({ color, focused }) => <HubIcon color={color} focused={focused} />,
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
          href: null, // Hidden from tab bar
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
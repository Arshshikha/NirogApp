import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

// ─── Professional Geometric Icons (No Emojis) ─────────────────────────────

// Open Book icon for Learning Hub
const BookIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      position: 'absolute', left: 1, top: 3,
      width: 9, height: 15,
      borderLeftWidth: focused ? 2 : 1.5, borderTopWidth: focused ? 2 : 1.5, borderBottomWidth: focused ? 2 : 1.5,
      borderColor: color,
      backgroundColor: focused ? color + '10' : 'transparent',
      borderTopLeftRadius: 2, borderBottomLeftRadius: 2,
    }} />
    <View style={{ width: 2, height: 15, backgroundColor: color, position: 'absolute', top: 3, borderRadius: 1 }} />
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

// Graduation cap icon for My Courses
const GradCapIcon = ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    {/* Diamond top */}
    <View style={{
      position: 'absolute', top: 2,
      width: 18, height: 7,
      backgroundColor: focused ? color + '20' : 'transparent',
      borderWidth: focused ? 2 : 1.5, borderColor: color,
      transform: [{ scaleX: 1.1 }],
      borderRadius: 1,
    }} />
    {/* Brim */}
    <View style={{
      position: 'absolute', top: 6,
      width: 20, height: 3, backgroundColor: color, borderRadius: 1,
    }} />
    {/* Body below */}
    <View style={{
      position: 'absolute', bottom: 2,
      width: 12, height: 8,
      borderLeftWidth: focused ? 2 : 1.5, borderRightWidth: focused ? 2 : 1.5, borderBottomWidth: focused ? 2 : 1.5,
      borderColor: color,
      backgroundColor: focused ? color + '10' : 'transparent',
      borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
    }} />
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

export default function StudentLayout() {
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
          title: 'Learning Hub',
          tabBarIcon: ({ color, focused }) => <BookIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'My Courses',
          tabBarIcon: ({ color, focused }) => <GradCapIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
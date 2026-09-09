import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0284c7',     // Sky-600 – active blue
        tabBarInactiveTintColor: '#64748b',   // Slate-500 – crisp, highly visible inactive
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: Platform.OS === 'ios' ? 28 : 14,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 72,
          shadowColor: '#000000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          paddingBottom: 2,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hospitals"
        options={{
          title: 'Hospitals',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'business' : 'business-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="labs"
        options={{
          title: 'Labs',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flask' : 'flask-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          href: null, // Removed from Patient view
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
    </Tabs>
  );
}
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getSession } from '../../utils/authStore';

interface TimeSlot {
  id: string;
  time: string;
  isActive: boolean;
}

export default function DoctorSlotsScreen() {
  const router = useRouter();
  const session = getSession();
  const [slots, setSlots] = useState<TimeSlot[]>([
    { id: 's1', time: '10:00 AM', isActive: true },
    { id: 's2', time: '11:00 AM', isActive: false },
    { id: 's3', time: '12:00 PM', isActive: true },
    { id: 's4', time: '02:00 PM', isActive: false },
    { id: 's5', time: '04:00 PM', isActive: true },
  ]);
  const [newTime, setNewTime] = useState('');

  const toggleSlot = (id: string) => {
    setSlots(prev => prev.map(slot => slot.id === id ? { ...slot, isActive: !slot.isActive } : slot));
  };

  const addSlot = () => {
    if (!newTime.trim()) {
      Alert.alert('Invalid Time', 'Please enter a valid time (e.g. 05:00 PM)');
      return;
    }
    setSlots(prev => [...prev, { id: `s_${Date.now()}`, time: newTime.trim(), isActive: true }]);
    setNewTime('');
    Alert.alert('Slot Added', `Consulting slot at ${newTime} has been created.`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#bae6fd',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#0ea5e9', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,marginTop:-36,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 36, height: 36, borderRadius: 10, backgroundColor: '#0ea5e9',
            alignItems: 'center', justifyContent: 'center', marginRight: 10,
            shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,marginTop:28,
          }}>
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }}>S</Text>
          </View>
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3,marginTop:28 }}>
              CONSULTATION <Text style={{ color: '#10b981', fontWeight: '700' }}>SLOTS</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Daily Availability Schedule
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/doctor/profile')}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#0ea5e9',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1, marginTop: 28,
          }}
        >
          <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '900' }}>
            {session.name ? session.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'D'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Add Slot Form */}
        <View style={{
          backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
          borderRadius: 20, padding: 18, marginBottom: 20,
          shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ color: '#0f172a', fontSize: 13, fontWeight: '800', marginBottom: 14 }}>Add Custom Slot</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              placeholder="e.g. 05:00 PM"
              placeholderTextColor="#94a3b8"
              value={newTime}
              onChangeText={setNewTime}
              style={{
                flex: 1, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd',
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                color: '#0f172a', fontWeight: '600', fontSize: 13,
              }}
            />
            <TouchableOpacity
              onPress={addSlot}
              style={{ backgroundColor: '#0ea5e9', paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
          Current Slots ({slots.length})
        </Text>

        {slots.map(slot => (
          <View key={slot.id} style={{
            backgroundColor: '#ffffff', borderWidth: 1,
            borderColor: slot.isActive ? '#d1fae5' : '#e2e8f0',
            borderRadius: 16, padding: 16, marginBottom: 10,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
          }}>
            <View>
              <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15 }}>{slot.time}</Text>
              <Text style={{
                color: slot.isActive ? '#059669' : '#94a3b8',
                fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 0.5, marginTop: 2,
              }}>
                {slot.isActive ? 'Active & Bookable' : 'Inactive'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => toggleSlot(slot.id)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
                backgroundColor: slot.isActive ? '#ecfdf5' : '#f8fafc',
                borderColor: slot.isActive ? '#a7f3d0' : '#e2e8f0',
              }}
            >
              <Text style={{ fontWeight: '700', fontSize: 11, color: slot.isActive ? '#059669' : '#64748b' }}>
                {slot.isActive ? 'Disable' : 'Enable'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getSession } from '../../utils/authStore';
import { getProviders, subscribeProviders, addProviderService, toggleProviderService, RegisteredProvider } from '../../utils/providerStore';

interface MedicalService {
  id: string;
  name: string;
  price: number;
  duration: string;
  isActive: boolean;
}

// Clock icon (no emoji)
const ClockIcon = ({ size = 10, color = '#94a3b8' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', width: 1.5, height: size * 0.35, backgroundColor: color, top: size * 0.12, borderRadius: 1 }} />
    <View style={{ position: 'absolute', width: size * 0.3, height: 1.5, backgroundColor: color, left: size * 0.5, top: size * 0.43, borderRadius: 1 }} />
  </View>
);

export default function ProviderServicesScreen() {
  const router = useRouter();
  const session = getSession();
  const [providers, setProviders] = useState<RegisteredProvider[]>(() => getProviders());

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('');

  useEffect(() => {
    const update = () => setProviders(getProviders());
    const unsubscribe = subscribeProviders(update);
    return () => unsubscribe();
  }, []);

  const myProvider = providers.find(p => p.id === session.profileId || p.userId === session.id);
  const myServices = myProvider?.dbServices || [];

  const services: MedicalService[] = myServices.map((s: any) => ({
    id: s.id,
    name: s.name,
    price: parseFloat(s.price) || 0,
    duration: s.availableSlot || 'Not Specified',
    isActive: s.isActive
  }));

  const toggleService = async (id: string) => {
    const s = services.find(item => item.id === id);
    if (!s) return;
    try {
      await toggleProviderService(id, !s.isActive);
    } catch (e) {
      Alert.alert('Error', 'Failed to toggle service status.');
    }
  };

  const handleAddService = async () => {
    if (!newName.trim() || !newPrice.trim() || !newDuration.trim()) {
      Alert.alert('Missing Info', 'Please enter a name, price, and available time slot.'); return;
    }
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum)) { Alert.alert('Invalid Price', 'Please enter a numeric price.'); return; }

    const profileId = session.profileId || myProvider?.id;
    if (!profileId) {
      Alert.alert('Error', 'Provider profile not found.');
      return;
    }

    try {
      await addProviderService(profileId, newName.trim(), priceNum, newDuration.trim());
      setNewName(''); setNewPrice(''); setNewDuration('');
      Alert.alert('Service Added', `${newName.trim()} has been added to your offerings.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to add service.');
    }
  };

  const inputStyle = {
    backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: '#0f172a', fontWeight: '600' as const, fontSize: 13,
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
            width: 36, height: 36, borderRadius: 10, backgroundColor: '#10b981',
            alignItems: 'center', justifyContent: 'center', marginRight: 10,
            shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,marginTop:28,
          }}>
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '900', }}>O</Text>
          </View>
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3 ,marginTop:28,}}>
              SERVICE <Text style={{ color: '#0ea5e9', fontWeight: '700' }}>OFFERINGS</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Manage Diagnostic Tests
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/provider/profile')}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#0ea5e9',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1, marginTop: 28
          }}
        >
          <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '900' }}>
            {session.name ? session.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'P'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Add Service Form */}
        <View style={{
          backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
          borderRadius: 20, padding: 18, marginBottom: 20,
          shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '800', marginBottom: 16 }}>Configure New Offering</Text>

          <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Test / Service Name</Text>
          <TextInput
            placeholder="e.g. Kidney Function Test (KFT)"
            placeholderTextColor="#94a3b8"
            value={newName}
            onChangeText={setNewName}
            style={{ ...inputStyle, marginBottom: 14 }}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Price (₹)</Text>
              <TextInput
                placeholder="e.g. 500"
                placeholderTextColor="#94a3b8"
                value={newPrice}
                onChangeText={setNewPrice}
                keyboardType="numeric"
                style={inputStyle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Available Slot</Text>
              <TextInput
                placeholder="e.g. 9 am to 10 pm"
                placeholderTextColor="#94a3b8"
                value={newDuration}
                onChangeText={setNewDuration}
                style={inputStyle}
              />
            </View>
          </View>

          {/* Quick Timing Options */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Quick Slot Presets</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {['9 am to 10 pm', '12 pm to 2 pm', '9 am to 1 pm', '2 pm to 6 pm'].map((slotOption) => (
                <TouchableOpacity
                  key={slotOption}
                  onPress={() => setNewDuration(slotOption)}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 6,
                    backgroundColor: newDuration === slotOption ? '#bae6fd' : '#f0f9ff',
                    borderWidth: 1, borderColor: newDuration === slotOption ? '#0ea5e9' : '#bae6fd',
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 10, color: newDuration === slotOption ? '#0369a1' : '#64748b', fontWeight: '700' }}>
                    {slotOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleAddService}
            style={{ backgroundColor: '#0ea5e9', paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Add New Offering</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
          Current Offerings ({services.length})
        </Text>

        {services.map(item => (
          <View key={item.id} style={{
            backgroundColor: '#ffffff', borderWidth: 1,
            borderColor: item.isActive ? '#d1fae5' : '#e2e8f0',
            borderRadius: 16, padding: 16, marginBottom: 10,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
          }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14 }}>{item.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#f0fdf4', borderRadius: 6, borderWidth: 1, borderColor: '#a7f3d0' }}>
                  <Text style={{ color: '#059669', fontSize: 10, fontWeight: '800' }}>₹{item.price}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ClockIcon size={10} color="#94a3b8" />
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>Slot: {item.duration}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => toggleService(item.id)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
                backgroundColor: item.isActive ? '#ecfdf5' : '#f8fafc',
                borderColor: item.isActive ? '#a7f3d0' : '#e2e8f0',
              }}
            >
              <Text style={{ fontWeight: '700', fontSize: 11, color: item.isActive ? '#059669' : '#64748b' }}>
                {item.isActive ? 'Suspend' : 'Resume'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
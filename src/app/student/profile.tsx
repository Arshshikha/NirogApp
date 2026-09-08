import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSession, subscribeSession, updateProfile } from '../../utils/authStore';

// Shield icon (no emoji)
const ShieldIcon = ({ size = 14, color = '#059669' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size * 1.1, alignItems: 'center' }}>
    <View style={{ width: size, height: size * 0.7, borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0, backgroundColor: color + '20' }} />
    <View style={{ width: 0, height: 0, borderLeftWidth: size / 2, borderRightWidth: size / 2, borderTopWidth: size * 0.4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color }} />
  </View>
);

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
];

interface StudentProfileProps { onLogout?: () => void; }

export default function StudentProfileScreen({ onLogout }: StudentProfileProps) {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());

  // Edit Profile States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(session.name || '');
    setEditEmail(session.email || '');
    setEditPhone(session.phone || '');
    setEditAddress(session.address || '');
    setEditCollege(session.collegeName || '');
    setEditAge(session.age || '');
    setEditAvatar(session.avatar || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }
    if (!editEmail.trim()) {
      Alert.alert('Validation Error', 'Email address is required.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
        collegeName: editCollege.trim() || undefined,
        age: editAge.trim() || undefined,
        avatar: editAvatar.trim() || undefined,
      });
      setSession(getSession());
      Alert.alert('Profile Updated', 'Your student profile has been successfully saved.');
      setEditModalVisible(false);
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Could not update profile details.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    const update = () => setSession(getSession());
    const unsubscribe = subscribeSession(update);
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { if (onLogout) onLogout(); else router.replace('/'); } },
    ]);
  };

  const getInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const DetailRow = ({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#f0f9ff' }}>
      <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );

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
          <Image
            source={require('../../../assets/images/logo.png')}
            style={{
              width: 36, height: 36, borderRadius: 10, marginRight: 10, marginTop: 28
            }}
            resizeMode="contain"
          />
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3 ,marginTop:28,}}>
              MY <Text style={{ color: '#10b981', fontWeight: '700' }}>PROFILE</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Student Account
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleOpenEditModal}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 12, paddingVertical: 6,
            backgroundColor: '#0ea5e9', borderRadius: 20,
            shadowColor: '#0ea5e9', shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
            marginTop: 28
          }}
        >
          <Ionicons name="pencil" size={12} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', marginTop: 28, marginBottom: 24 }}>
          <View style={{ position: 'relative' }}>
            <View style={{
              width: 96, height: 96, borderRadius: 48,
              backgroundColor: '#e0f2fe', borderWidth: 3, borderColor: '#7dd3fc',
              alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              shadowColor: '#0ea5e9', shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
              overflow: 'hidden'
            }}>
              {session.avatar ? (
                <Image source={{ uri: session.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ color: '#0369a1', fontSize: 32, fontWeight: '900' }}>
                  {getInitials(session.name)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleOpenEditModal}
              style={{
                position: 'absolute', bottom: 12, right: -2,
                backgroundColor: '#0ea5e9', width: 28, height: 28, borderRadius: 14,
                borderWidth: 2, borderColor: '#ffffff',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3
              }}
            >
              <Ionicons name="camera" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#0f172a', fontSize: 22, fontWeight: '800' }}>{session.name}</Text>
          <Text style={{ color: '#0ea5e9', fontSize: 13, fontWeight: '700', marginTop: 4 }}>Medical Student</Text>
          <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Roll: NIROG-STU-8821</Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', marginBottom: 20, gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1fae5', padding: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
            <Text style={{ color: '#10b981', fontSize: 22, fontWeight: '900' }}>12</Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 }}>Modules Done</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe', padding: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
            <Text style={{ color: '#0ea5e9', fontSize: 22, fontWeight: '900' }}>34h</Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 }}>Study Hours</Text>
          </View>
        </View>

        {/* Details */}
        <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe', borderRadius: 20, paddingHorizontal: 18, marginBottom: 20, shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          <DetailRow label="College Name" value={session.collegeName || 'N/A'} />
          <DetailRow label="Age" value={session.age || 'N/A'} />
          <DetailRow label="Phone No." value={session.phone || 'N/A'} />
          <DetailRow label="Address" value={session.address || 'N/A'} />
          <DetailRow label="ID Card File" value={session.documentName || 'N/A'} />
          <DetailRow label="Registered Email" value={session.email} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Verification Status</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <ShieldIcon size={12} color="#059669" />
              <Text style={{ color: '#059669', fontSize: 11, fontWeight: '800' }}>Approved & Active</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff1f2', paddingVertical: 16, borderRadius: 18, alignItems: 'center' }}
        >
          <Text style={{ color: '#e11d48', fontWeight: '800', fontSize: 13 }}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderTopWidth: 1, borderTopColor: '#bae6fd',
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            maxHeight: '90%',
            shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 25
          }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14,
              borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
            }}>
              <View>
                <Text style={{ color: '#0f172a', fontSize: 17, fontWeight: '800' }}>Edit Student Profile</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>Update contact & college information</Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 36 }}>
              {/* Avatar Selector Section */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>Choose Avatar / Profile Photo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 }}>
                  {PRESET_AVATARS.map((url, idx) => {
                    const isSelected = editAvatar === url;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setEditAvatar(url)}
                        style={{
                          width: 52, height: 52, borderRadius: 26,
                          borderWidth: 3, borderColor: isSelected ? '#0ea5e9' : '#e2e8f0',
                          overflow: 'hidden',
                          shadowColor: '#0ea5e9', shadowOpacity: isSelected ? 0.3 : 0, shadowRadius: 4, elevation: isSelected ? 3 : 0
                        }}
                      >
                        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} />
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => setEditAvatar('')}
                    style={{
                      width: 52, height: 52, borderRadius: 26,
                      borderWidth: 2, borderColor: editAvatar === '' ? '#0ea5e9' : '#e2e8f0',
                      backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '800' }}>Initials</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Custom Image URL Input */}
              <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600', marginBottom: 4 }}>Or Custom Photo URL</Text>
              <TextInput
                value={editAvatar}
                onChangeText={setEditAvatar}
                placeholder="https://example.com/photo.jpg"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 12, color: '#0f172a', marginBottom: 16
                }}
              />

              {/* Full Name */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Student Name *</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Your Full Name"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* Email */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Email Address *</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="student@college.edu"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* Phone */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Phone Number</Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="+91 98765 43210"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* College Name */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Medical College / Institution</Text>
              <TextInput
                value={editCollege}
                onChangeText={setEditCollege}
                placeholder="e.g. AIIMS Delhi / Grant Medical College"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* Address */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Residential Address</Text>
              <TextInput
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Hostel/Room No, Street, City, State"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* Age */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Age</Text>
              <TextInput
                value={editAge}
                onChangeText={setEditAge}
                keyboardType="numeric"
                placeholder="e.g. 21"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 24, fontWeight: '600'
                }}
              />

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
                style={{
                  backgroundColor: '#0ea5e9',
                  paddingVertical: 15,
                  borderRadius: 16,
                  alignItems: 'center',
                  marginBottom: 10,
                  shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                  flexDirection: 'row', justifyContent: 'center', gap: 8
                }}
              >
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Save Student Profile</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                disabled={isSavingProfile}
                style={{
                  borderWidth: 1, borderColor: '#e2e8f0',
                  backgroundColor: '#f8fafc',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 12 }}>Cancel & Go Back</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getSession, subscribeSession, updateProfile } from '../../utils/authStore';
import { apiGet } from '../../utils/api';

// Shield icon (no emoji)
const ShieldIcon = ({ size = 14, color = '#059669' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size * 1.1, alignItems: 'center' }}>
    <View style={{ width: size, height: size * 0.7, borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0, backgroundColor: color + '20' }} />
    <View style={{ width: 0, height: 0, borderLeftWidth: size / 2, borderRightWidth: size / 2, borderTopWidth: size * 0.4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color }} />
  </View>
);

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=200&auto=format&fit=crop&q=80',
];

export default function ProviderProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Edit Profile States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(session.name || '');
    setEditEmail(session.email || '');
    setEditPhone(session.phone || '');
    setEditAddress(session.address || '');
    setEditAge(session.age || '');
    setEditExperience(session.experience || '');
    setEditAvatar(session.avatar || '');
    setEditModalVisible(true);
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to select a facility logo or photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEditAvatar(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to select image from gallery.');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Facility / Business Name is required.');
      return;
    }
    if (!editEmail.trim()) {
      Alert.alert('Validation Error', 'Business Email is required.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
        age: editAge.trim() || undefined,
        experience: editExperience.trim() || undefined,
        avatar: editAvatar.trim() || undefined,
      });
      setSession(getSession());
      Alert.alert('Profile Updated', 'Your lab / facility profile has been successfully saved.');
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

    const fetchReviews = async () => {
      if (!session.profileId) return;
      setLoadingReviews(true);
      try {
        const res = await apiGet(`/reviews?providerProfileId=${session.profileId}`);
        setReviews(res);
      } catch (err) {
        console.warn('Failed to fetch provider reviews', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();

    return () => unsubscribe();
  }, [session.profileId]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => router.replace('/') },
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
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3, marginTop: 28 }}>
              LAB <Text style={{ color: '#10b981', fontWeight: '700' }}>PROFILE</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' ,}}>
              Provider Account
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
              backgroundColor: '#ecfdf5', borderWidth: 3, borderColor: '#34d399',
              alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              shadowColor: '#10b981', shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
              overflow: 'hidden'
            }}>
              {session.avatar ? (
                <Image source={{ uri: session.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ color: '#059669', fontSize: 32, fontWeight: '900' }}>
                  {getInitials(session.name)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleOpenEditModal}
              style={{
                position: 'absolute', bottom: 12, right: -2,
                backgroundColor: '#10b981', width: 28, height: 28, borderRadius: 14,
                borderWidth: 2, borderColor: '#ffffff',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3
              }}
            >
              <Ionicons name="camera" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#0f172a', fontSize: 22, fontWeight: '800' }}>{session.name}</Text>
          <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '700', marginTop: 4 }}>Speciality Diagnostic & Lab Center</Text>
          <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Reg No: ND-98012-L</Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', marginBottom: 20, gap: 12 }}>
          <View style={{
            flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
            padding: 16, borderRadius: 18, alignItems: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
          }}>
            <Text style={{ color: '#0ea5e9', fontSize: 22, fontWeight: '900' }}>{reviews.length}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 }}>Total Reviews</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fef08a',
            padding: 16, borderRadius: 18, alignItems: 'center',
            shadowColor: '#eab308', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
          }}>
            <Text style={{ color: '#ca8a04', fontSize: 22, fontWeight: '900' }}>
              {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '5.0'} ★
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 }}>Average Rating</Text>
          </View>
        </View>

        {/* Details */}
        <View style={{
          backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
          borderRadius: 20, paddingHorizontal: 18, marginBottom: 20,
          shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f9ff' }}>
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Verification Status</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <ShieldIcon size={12} color="#059669" />
              <Text style={{ color: '#059669', fontSize: 11, fontWeight: '800' }}>Verified & Active</Text>
            </View>
          </View>
          <DetailRow label="Establishment Age" value={session.age || 'N/A'} />
          <DetailRow label="Company Experience" value={session.experience || 'N/A'} />
          <DetailRow label="Phone No." value={session.phone || 'N/A'} />
          <DetailRow label="Lab Address" value={session.address || 'N/A'} />
          <DetailRow label="Business File" value={session.documentName || 'N/A'} />
          <DetailRow label="Business Email" value={session.email} isLast />
        </View>

        {/* Patient Reviews & Ratings List */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
            Patient Reviews & Ratings
          </Text>
          {loadingReviews ? (
            <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe', borderRadius: 20, padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#0ea5e9" />
            </View>
          ) : reviews.length === 0 ? (
            <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe', borderRadius: 20, padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>No reviews submitted yet.</Text>
            </View>
          ) : (
            reviews.map((rev) => {
              const patientName = rev.patientProfile?.user?.profile
                ? `${rev.patientProfile.user.profile.firstName} ${rev.patientProfile.user.profile.lastName}`
                : 'Anonymous Patient';
              return (
                <View
                  key={rev.id}
                  style={{
                    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
                    borderRadius: 18, padding: 14, marginBottom: 10,
                    shadowColor: '#0ea5e9', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 12 }}>
                      {patientName}
                    </Text>
                    <Text style={{ color: '#eab308', fontSize: 11, fontWeight: '900' }}>
                      {Array(rev.rating).fill('★').join('')}
                      <Text style={{ color: '#cbd5e1' }}>{Array(5 - rev.rating).fill('★').join('')}</Text>
                    </Text>
                  </View>
                  {rev.comment && (
                    <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600', marginTop: 4 }}>
                      "{rev.comment}"
                    </Text>
                  )}
                  <Text style={{ fontSize: 8, color: '#94a3b8', fontWeight: '600', marginTop: 6, alignSelf: 'flex-end' }}>
                    {new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              );
            })
          )}
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
                <Text style={{ color: '#0f172a', fontSize: 17, fontWeight: '800' }}>Edit Facility / Lab Profile</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>Update provider & business information</Text>
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
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>Choose Avatar / Facility Logo</Text>
              
              {/* Gallery Pick Button */}
              <TouchableOpacity
                onPress={handlePickFromGallery}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  backgroundColor: '#ecfdf5', borderWidth: 1.5, borderColor: '#6ee7b7',
                  borderRadius: 14, paddingVertical: 12, marginBottom: 12,
                }}
              >
                <Ionicons name="images-outline" size={20} color="#059669" />
                <Text style={{ color: '#047857', fontSize: 12, fontWeight: '800' }}>
                  Choose Photo from Phone Gallery
                </Text>
              </TouchableOpacity>

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
                          borderWidth: 3, borderColor: isSelected ? '#10b981' : '#e2e8f0',
                          overflow: 'hidden',
                          shadowColor: '#10b981', shadowOpacity: isSelected ? 0.3 : 0, shadowRadius: 4, elevation: isSelected ? 3 : 0
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
                      borderWidth: 2, borderColor: editAvatar === '' ? '#10b981' : '#e2e8f0',
                      backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <Text style={{ color: '#059669', fontSize: 11, fontWeight: '800' }}>Initials</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Custom Image URL Input */}
              <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600', marginBottom: 4 }}>Or Custom Photo URL</Text>
              <TextInput
                value={editAvatar}
                onChangeText={setEditAvatar}
                placeholder="https://example.com/lab-logo.jpg"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 12, color: '#0f172a', marginBottom: 16
                }}
              />

              {/* Full Name / Facility Name */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Facility / Lab Center Name *</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Apex Diagnostics & Pathology"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* Email */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Business Email *</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="contact@labcenter.com"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* Phone */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Contact Phone Number</Text>
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

              {/* Lab Address */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Facility Physical Address</Text>
              <TextInput
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Building No, Sector/Street, City, State"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* Experience */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Years in Operation / Experience</Text>
              <TextInput
                value={editExperience}
                onChangeText={setEditExperience}
                placeholder="e.g. 10+ Years"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* Age */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Establishment Age / Founded</Text>
              <TextInput
                value={editAge}
                onChangeText={setEditAge}
                placeholder="e.g. Est. 2015"
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
                  backgroundColor: '#10b981',
                  paddingVertical: 15,
                  borderRadius: 16,
                  alignItems: 'center',
                  marginBottom: 10,
                  shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                  flexDirection: 'row', justifyContent: 'center', gap: 8
                }}
              >
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Save Facility Profile</Text>
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

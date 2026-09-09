import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getSession, subscribeSession, updateProfile } from '../../utils/authStore';
import { getEarningsApi, EarningsResult } from '../../utils/paymentStore';
import { apiGet } from '../../utils/api';

// Shield icon (no emoji)
const ShieldIcon = ({ size = 14, color = '#059669' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size * 1.1, alignItems: 'center' }}>
    <View style={{
      width: size, height: size * 0.7,
      borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3,
      borderWidth: 1.5, borderColor: color, borderBottomWidth: 0,
      backgroundColor: color + '20',
    }} />
    <View style={{
      width: 0, height: 0,
      borderLeftWidth: size / 2, borderRightWidth: size / 2, borderTopWidth: size * 0.4,
      borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color,
    }} />
  </View>
);

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813624-9dfc19c8f2d7?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&auto=format&fit=crop&q=80',
];

export default function DoctorProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  const [earnings, setEarnings] = useState<EarningsResult | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Edit Profile States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(session.name || '');
    setEditEmail(session.email || '');
    setEditPhone(session.phone || '');
    setEditAddress(session.address || '');
    setEditAge(session.age || '');
    setEditFee(session.fee ? session.fee.toString() : '');
    setEditAvatar(session.avatar || '');
    setEditModalVisible(true);
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to select a profile photo.');
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
        age: editAge.trim() || undefined,
        fee: editFee ? parseFloat(editFee) : undefined,
        avatar: editAvatar.trim() || undefined,
      });
      setSession(getSession());
      Alert.alert('Profile Updated', 'Your doctor profile has been successfully saved.');
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

    const fetchEarnings = async () => {
      try {
        const res = await getEarningsApi();
        setEarnings(res);
      } catch (err) {
        console.warn('Failed to fetch doctor earnings', err);
      }
    };
    fetchEarnings();

    const fetchReviews = async () => {
      if (!session.profileId) return;
      setLoadingReviews(true);
      try {
        const res = await apiGet(`/reviews?doctorProfileId=${session.profileId}`);
        setReviews(res);
      } catch (err) {
        console.warn('Failed to fetch doctor reviews', err);
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
    // Strip "Dr. " prefix if present when computing initials
    const cleanName = fullName.replace(/^dr\.\s+/i, '');
    return cleanName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const DetailRow = ({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#f0f9ff' }}>
      <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '5.0';

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
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.03, marginTop:28,}}>
              MY <Text style={{ color: '#10b981', fontWeight: '700' }}>PROFILE</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Doctor Account
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
        {/* Avatar + Name */}
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
          <Text style={{ color: '#0ea5e9', fontSize: 13, fontWeight: '700', marginTop: 4 }}>{session.category || 'Specialist Doctor'}</Text>
          <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Reg No: MCA-48201-N</Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
          <View style={{
            flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
            padding: 12, borderRadius: 16, alignItems: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
          }}>
            <Text style={{ color: '#0ea5e9', fontSize: 18, fontWeight: '900' }}>1.2k</Text>
            <Text style={{ color: '#94a3b8', fontSize: 8, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 }}>Patients</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1fae5',
            padding: 12, borderRadius: 16, alignItems: 'center',
            shadowColor: '#10b981', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
          }}>
            <Text style={{ color: '#10b981', fontSize: 18, fontWeight: '900' }}>{session.experience || 'N/A'}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 8, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 }}>Experience</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fef08a',
            padding: 12, borderRadius: 16, alignItems: 'center',
            shadowColor: '#eab308', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
          }}>
            <Text style={{ color: '#ca8a04', fontSize: 18, fontWeight: '900' }}>{avgRating} ★</Text>
            <Text style={{ color: '#94a3b8', fontSize: 8, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 }}>Rating ({totalReviews})</Text>
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
          <DetailRow label="Age" value={session.age || 'N/A'} />
          <DetailRow label="Phone No." value={session.phone || 'N/A'} />
          <DetailRow label="Medical Background" value={session.category || 'N/A'} />
          <DetailRow label="Consultation Fee" value={session.fee ? `₹${session.fee}` : 'N/A'} />
          <DetailRow label="Consultation Mode" value={session.consultationMode === 'Offline' ? 'In-Person' : session.consultationMode || 'Both'} />
          {(session.consultationMode === 'Online' || session.consultationMode === 'Both' || !session.consultationMode) && (
            <DetailRow label="Online Slots" value={session.onlineSlots && session.onlineSlots.length > 0 ? session.onlineSlots.join(', ') : '09:00 AM, 11:00 AM, 03:00 PM'} />
          )}
          {(session.consultationMode === 'Offline' || session.consultationMode === 'Both' || !session.consultationMode) && (
            <DetailRow label="In-Person Slots" value={session.offlineSlots && session.offlineSlots.length > 0 ? session.offlineSlots.join(', ') : '10:00 AM, 12:00 PM, 04:00 PM'} />
          )}
          <DetailRow label="Clinic Address" value={session.address || 'N/A'} />
          <DetailRow label="License File" value={session.documentName || 'N/A'} />
          <DetailRow label="Practice Email" value={session.email} isLast />
        </View>

        {/* Earnings Summary Dashboard */}
        <View style={{ marginBottom: 24, marginTop: 24 }}>
          <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
            Consultation Earnings & Splits
          </Text>
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 24, padding: 18, shadowColor: '#0ea5e9', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 }}>
            
            {/* Total Earnings Highlight */}
            <View style={{ alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f9ff', paddingBottom: 16, marginBottom: 16 }}>
              <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Earnings (Received)</Text>
              <Text style={{ color: '#10b981', fontSize: 32, fontWeight: '900', marginTop: 4 }}>₹{earnings ? earnings.totalEarnings.toFixed(2) : '0.00'}</Text>
            </View>

            {/* Split Breakdown */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Gross Revenue</Text>
                <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '800', marginTop: 4 }}>₹{earnings ? earnings.totalGross.toFixed(2) : '0.00'}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Platform (10%)</Text>
                <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '800', marginTop: 4 }}>₹{earnings ? earnings.totalCommission.toFixed(2) : '0.00'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payout Transactions List */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
            Recent Earning Settlements
          </Text>
          {(!earnings || earnings.payouts.length === 0) ? (
            <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe', borderRadius: 20, padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>No earning logs recorded yet.</Text>
            </View>
          ) : (
            earnings.payouts.map((p) => (
              <View
                key={p.id}
                style={{
                  backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
                  borderRadius: 18, padding: 14, marginBottom: 10,
                  shadowColor: '#0ea5e9', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 12 }}>
                    Consultation Earning
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>
                    {new Date(p.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 8, marginTop: 4 }}>
                  <View>
                    <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '600' }}>Patient Paid: ₹{parseFloat(p.amount.toString()).toFixed(2)}</Text>
                    <Text style={{ fontSize: 9, color: '#ef4444', fontWeight: '600', marginTop: 1 }}>Platform Fee (10%): -₹{parseFloat(p.platformFee.toString()).toFixed(2)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '900' }}>+₹{parseFloat(p.netAmount.toString()).toFixed(2)}</Text>
                    <Text style={{ fontSize: 8, color: '#059669', fontWeight: '800', textTransform: 'uppercase', marginTop: 2 }}>Settled</Text>
                  </View>
                </View>
              </View>
            ))
          )}
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
                <Text style={{ color: '#0f172a', fontSize: 17, fontWeight: '800' }}>Edit Doctor Profile</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>Update contact & clinic information</Text>
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
              
              {/* Gallery Pick Button */}
              <TouchableOpacity
                onPress={handlePickFromGallery}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  backgroundColor: '#f0f9ff', borderWidth: 1.5, borderColor: '#7dd3fc',
                  borderRadius: 14, paddingVertical: 12, marginBottom: 12,
                }}
              >
                <Ionicons name="images-outline" size={20} color="#0284c7" />
                <Text style={{ color: '#0369a1', fontSize: 12, fontWeight: '800' }}>
                  Choose Photo from Phone Gallery
                </Text>
              </TouchableOpacity>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
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
              <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600', marginBottom: 4 }}>Or Custom Photo URL / Selected URI</Text>
              <TextInput
                value={editAvatar}
                onChangeText={setEditAvatar}
                placeholder="https://example.com/doctor-photo.jpg"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 12, color: '#0f172a', marginBottom: 16
                }}
              />

              {/* Full Name */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Doctor Name *</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Dr. Full Name"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* Email */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Practice Email *</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="doctor@clinic.com"
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

              {/* Clinic Address */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Clinic / Hospital Address</Text>
              <TextInput
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Hospital/Clinic Name, Floor, Street, City"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                style={{
                  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 13, color: '#0f172a', marginBottom: 16, fontWeight: '600'
                }}
              />

              {/* Fee */}
              <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Consultation Fee (₹)</Text>
              <TextInput
                value={editFee}
                onChangeText={setEditFee}
                keyboardType="numeric"
                placeholder="e.g. 500"
                placeholderTextColor="#94a3b8"
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
                placeholder="e.g. 42"
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
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Save Doctor Profile</Text>
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
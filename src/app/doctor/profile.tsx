import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSession, subscribeSession } from '../../utils/authStore';
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

export default function DoctorProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  const [earnings, setEarnings] = useState<EarningsResult | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

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
          <View style={{
            width: 36, height: 36, borderRadius: 10, backgroundColor: '#0ea5e9',
            alignItems: 'center', justifyContent: 'center', marginRight: 10,
            shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,marginTop:28,
          }}>
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }}>P</Text>
          </View>
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.03, marginTop:28,}}>
              MY <Text style={{ color: '#10b981', fontWeight: '700' }}>PROFILE</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Doctor Account
            </Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#e0f2fe', borderRadius: 20, borderWidth: 1, borderColor: '#7dd3fc' ,marginTop:28,}}>
          <Text style={{ color: '#0369a1', fontSize: 10, fontWeight: '700' }}>Profile</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar + Name */}
        <View style={{ alignItems: 'center', marginTop: 28, marginBottom: 24 }}>
          <View style={{
            width: 88, height: 88, borderRadius: 44,
            backgroundColor: '#e0f2fe', borderWidth: 3, borderColor: '#7dd3fc',
            alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            shadowColor: '#0ea5e9', shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
          }}>
            <Text style={{ color: '#0369a1', fontSize: 28, fontWeight: '900' }}>
              {getInitials(session.name)}
            </Text>
          </View>
          <Text style={{ color: '#0f172a', fontSize: 22, fontWeight: '800' }}>{session.name}</Text>
          <Text style={{ color: '#0ea5e9', fontSize: 13, fontWeight: '700', marginTop: 4 }}>Senior Cardiologist</Text>
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
    </SafeAreaView>
  );
}
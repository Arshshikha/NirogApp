import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSession, subscribeSession } from '../../utils/authStore';
import { getBookings, subscribeBookings, refreshBookings, Booking, updateBookingStatus } from '../../utils/bookingStore';
import { getDoctors } from '../../utils/doctorStore';
import { getProviders } from '../../utils/providerStore';
import { loadConversationsFromApi, getActiveChats, subscribeActiveChats, ActiveChat, isConversationUnread } from '../../utils/chatStore';
import { apiPost } from '../../utils/api';

// Custom Shield/Verification Icon
const ShieldIcon = ({ size = 12, color = '#059669' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size * 1.1, alignItems: 'center' }}>
    <View style={{ width: size, height: size * 0.7, borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0, backgroundColor: color + '20' }} />
    <View style={{ width: 0, height: 0, borderLeftWidth: size / 2, borderRightWidth: size / 2, borderTopWidth: size * 0.4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color }} />
  </View>
);

export default function PatientProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  const [bookings, setBookings] = useState<Booking[]>(() => getBookings());
  const [patientActiveChats, setPatientActiveChats] = useState<ActiveChat[]>(() => getActiveChats());
  const [selectedTab, setSelectedTab] = useState<'Upcoming' | 'Completed' | 'Cancelled' | 'Previous'>('Upcoming');

  // Review & Rating Modal States
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const handleOpenReviewModal = (booking: Booking) => {
    setSelectedBookingForReview(booking);
    setRating(5);
    setComment('');
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview) return;
    setIsSubmittingReview(true);
    try {
      await apiPost('/reviews', {
        bookingId: selectedBookingForReview.id,
        rating: rating,
        comment: comment.trim() || null
      });
      Alert.alert(
        'Feedback Submitted',
        'Thank you! Your rating and review has been successfully submitted.',
        [{ text: 'OK' }]
      );
      setReviewModalVisible(false);
      refreshBookings();
    } catch (e: any) {
      Alert.alert('Submission Failed', e.message || 'Could not save your review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    const update = () => setSession(getSession());
    const unsubscribe = subscribeSession(update);

    const updateB = () => setBookings(getBookings());
    const unsubscribeB = subscribeBookings(updateB);
    refreshBookings();

    const updateChats = () => setPatientActiveChats(getActiveChats());
    const unsubscribeChats = subscribeActiveChats(updateChats);
    loadConversationsFromApi();

    return () => {
      unsubscribe();
      unsubscribeB();
      unsubscribeChats();
    };
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => router.replace('/')
        }
      ]
    );
  };

  const getInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
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
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }}>P</Text>
          </View>
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3, marginTop: 28 }}>
              MY <Text style={{ color: '#10b981', fontWeight: '700' }}>PROFILE</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Secure Health Profile
            </Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#ecfdf5', borderRadius: 20, borderWidth: 1, borderColor: '#a7f3d0',marginTop:28, }}>
          <Text style={{ color: '#059669', fontSize: 10, fontWeight: '700' }}>Patient</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Header */}
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
          <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Member since: May 2026</Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bae6fd', padding: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#0ea5e9', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}>
            <Text style={{ color: '#0369a1', fontSize: 16, fontWeight: '800' }}>{session.bloodGroup || 'N/A'}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', fontWeight: '700', marginTop: 4 }}>Blood Group</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bae6fd', padding: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#0ea5e9', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}>
            <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>{session.age || 'N/A'}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', fontWeight: '700', marginTop: 4 }}>Age Group</Text>
          </View>
        </View>

        {/* Details Box */}
        <View style={{
          backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
          borderRadius: 20, paddingHorizontal: 18, marginBottom: 24,
          shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f9ff' }}>
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Registered Email</Text>
            <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700' }}>{session.email}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f9ff' }}>
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Health Card ID</Text>
            <Text style={{ color: '#475569', fontSize: 12, fontWeight: '700' }}>NH-9021-DOE</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f9ff' }}>
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Primary Number</Text>
            <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700' }}>{session.phone || 'N/A'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f9ff' }}>
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Address</Text>
            <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700' }}>{session.address || 'N/A'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Verification Status</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <ShieldIcon size={12} color="#059669" />
              <Text style={{ color: '#059669', fontSize: 11, fontWeight: '800' }}>Approved & Active</Text>
            </View>
          </View>
        </View>

        {/* Navigation to History */}
        <TouchableOpacity
          onPress={() => router.push('/patient/history')}
          style={{
            backgroundColor: '#0ea5e9',
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 24,
            shadowColor: '#0ea5e9',
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 3,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <View style={{ width: 14, height: 14, borderWidth: 1.5, borderColor: '#ffffff', borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 6, height: 1.5, backgroundColor: '#ffffff' }} />
          </View>
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>
            View Payment & Booking History
          </Text>
        </TouchableOpacity>

        {/* Consultation History */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
            Consultation & Booking History
          </Text>

          {/* Categorized Tab Bar */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
            {(['Upcoming', 'Completed', 'Cancelled', 'Previous'] as const).map((tab) => {
              const isActive = selectedTab === tab;
              let tabCount = 0;
              if (tab === 'Upcoming') {
                tabCount = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending').length;
              } else if (tab === 'Completed') {
                tabCount = bookings.filter(b => b.status === 'Completed').length;
              } else if (tab === 'Cancelled') {
                tabCount = bookings.filter(b => b.status === 'Cancelled' || b.status === 'Rejected').length;
              } else {
                tabCount = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'Rejected').length;
              }

              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center',
                    backgroundColor: isActive ? '#0ea5e9' : '#ffffff',
                    borderColor: isActive ? '#0ea5e9' : '#e0f2fe',
                    shadowColor: '#0ea5e9', shadowOpacity: isActive ? 0.15 : 0, shadowRadius: 4, elevation: isActive ? 2 : 0
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: isActive ? '#ffffff' : '#64748b' }}>
                    {tab}
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: isActive ? '#e0f2fe' : '#94a3b8', marginTop: 2 }}>
                    ({tabCount})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {(() => {
            const displayedBookings = bookings.filter((b) => {
              if (selectedTab === 'Upcoming') return b.status === 'Confirmed' || b.status === 'Pending';
              if (selectedTab === 'Completed') return b.status === 'Completed';
              if (selectedTab === 'Cancelled') return b.status === 'Cancelled' || b.status === 'Rejected';
              return b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'Rejected';
            });

            if (displayedBookings.length === 0) {
              return (
                <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe', borderRadius: 20, padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>No {selectedTab.toLowerCase()} bookings found.</Text>
                </View>
              );
            }

            return displayedBookings.map((b) => {
              const statusColors: Record<string, { bg: string; border: string; text: string }> = {
                Pending:   { bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
                Confirmed: { bg: '#e0f2fe', border: '#7dd3fc', text: '#0369a1' },
                Completed: { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669' },
                Rejected:  { bg: '#fff1f2', border: '#fecdd3', text: '#e11d48' },
                Cancelled: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
              };
              const c = statusColors[b.status] || statusColors.Pending;

              return (
                <View
                  key={b.id}
                  style={{
                    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
                    borderRadius: 18, padding: 14, marginBottom: 10,
                    shadowColor: '#0ea5e9', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 13 }}>
                      {b.doctorName || b.providerName || 'Healthcare Provider'}
                    </Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }}>
                      <Text style={{ color: c.text, fontSize: 8, fontWeight: '800', textTransform: 'uppercase' }}>
                        {b.status}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '600' }}>
                      {b.type}{b.medicalWing ? ` - ${b.medicalWing}` : ''}
                    </Text>
                    <Text style={{ color: '#475569', fontSize: 11, fontWeight: '700' }}>
                      {b.date} • {b.time}
                    </Text>
                  </View>

                  {/* Reviews Section */}
                  {b.review ? (
                    <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Your Rating:</Text>
                        <View style={{ flexDirection: 'row', gap: 1 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Text key={star} style={{ fontSize: 12, color: star <= b.review!.rating ? '#fbbf24' : '#cbd5e1' }}>★</Text>
                          ))}
                        </View>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#fbbf24' }}>({b.review.rating}.0)</Text>
                      </View>
                      {b.review.comment && (
                        <Text style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' }}>
                          "{b.review.comment}"
                        </Text>
                      )}
                    </View>
                  ) : null}

                  {/* Buttons Row */}
                  {(b.doctorId || b.status === 'Pending' || b.status === 'Confirmed' || (b.status === 'Completed' && !b.review)) && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                      {(b.status === 'Pending' || b.status === 'Confirmed') && (
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert(
                              'Cancel Appointment',
                              `Are you sure you want to cancel your appointment with ${b.doctorName || b.providerName}?`,
                              [
                                { text: 'No', style: 'cancel' },
                                {
                                  text: 'Yes, Cancel',
                                  style: 'destructive',
                                  onPress: async () => {
                                    await updateBookingStatus(b.id, 'Cancelled');
                                    refreshBookings();
                                  }
                                }
                              ]
                            );
                          }}
                          style={{
                            backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecaca',
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10
                          }}
                        >
                          <Text style={{ color: '#e11d48', fontSize: 10, fontWeight: '800' }}>Cancel</Text>
                        </TouchableOpacity>
                      )}

                      {b.doctorId && (
                        <TouchableOpacity
                          onPress={() => {
                            router.push(`/patient/chat?doctorId=${b.doctorId}`);
                          }}
                          style={{
                            backgroundColor: '#e0f2fe',
                            borderWidth: 1,
                            borderColor: '#7dd3fc',
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                            position: 'relative'
                          }}
                        >
                          <Text style={{ color: '#0369a1', fontSize: 10, fontWeight: '800' }}>
                            Chat with Doctor
                          </Text>
                          {patientActiveChats.some(c => {
                            const isUnread = c.isDoctorSender && isConversationUnread(c.conversationId, c.lastMessageId);
                            if (!isUnread) return false;
                            const targetUser = getDoctors().find(d => d.id === b.doctorId);
                            if (targetUser && targetUser.userId === c.patientId) return true;
                            if (c.patientId === `mock_doctor_user_id_${b.doctorId}`) return true;
                            return false;
                          }) && (
                            <View style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#ffffff' }} />
                          )}
                        </TouchableOpacity>
                      )}

                      {b.status === 'Completed' && !b.review && (
                        <TouchableOpacity
                          onPress={() => handleOpenReviewModal(b)}
                          style={{
                            backgroundColor: '#f59e0b',
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                            shadowColor: '#f59e0b', shadowOpacity: 0.15, shadowRadius: 4, elevation: 1
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>★ Rate & Review</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            });
          })()}
        </View>

        {/* Log out */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff1f2', paddingVertical: 16, borderRadius: 18, alignItems: 'center' }}
        >
          <Text style={{ color: '#e11d48', fontWeight: '800', fontSize: 13 }}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Ratings & Reviews Modal */}
      {selectedBookingForReview && (
        <Modal visible={reviewModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' }}>
            <View style={{
              backgroundColor: '#ffffff',
              borderTopWidth: 1, borderTopColor: '#bae6fd',
              borderTopLeftRadius: 36, borderTopRightRadius: 36,
              padding: 24,
              shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20
            }}>
              {/* Handle bar */}
              <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>Share Your Experience</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Your feedback helps others choose the right care</Text>
              </View>

              {/* Provider Info Summary */}
              <View style={{
                backgroundColor: '#f0f9ff',
                borderWidth: 1, borderColor: '#bae6fd',
                padding: 14, borderRadius: 16,
                marginBottom: 18,
                alignItems: 'center'
              }}>
                <Text style={{ color: '#0369a1', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Reviewing</Text>
                <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14 }}>
                  {selectedBookingForReview.doctorName || selectedBookingForReview.providerName || 'Healthcare Provider'}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                  {selectedBookingForReview.type} • {selectedBookingForReview.date}
                </Text>
              </View>

              {/* Star Rating Selector */}
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginBottom: 6 }}>Rating</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= rating;
                  return (
                    <TouchableOpacity
                      key={starVal}
                      onPress={() => setRating(starVal)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 38, color: isFilled ? '#fbbf24' : '#cbd5e1' }}>★</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Comment Text Input */}
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Your Review</Text>
              <TextInput
                placeholder="Doctor explained everything very clearly and was very helpful..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
                style={{
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 13,
                  fontWeight: '600',
                  height: 100,
                  textAlignVertical: 'top',
                  marginBottom: 20
                }}
              />

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={handleSubmitReview}
                disabled={isSubmittingReview}
                style={{
                  backgroundColor: '#10b981',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  marginBottom: 10,
                  shadowColor: '#10b981',
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Submit Review</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                disabled={isSubmittingReview}
                style={{
                  borderWidth: 1, borderColor: '#e2e8f0',
                  backgroundColor: '#f8fafc',
                  paddingVertical: 13,
                  borderRadius: 16,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 12 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

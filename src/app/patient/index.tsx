import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Doctor, mockProviders } from '../../constants/mockData';
import { getDoctors, subscribeDoctors, RegisteredDoctor } from '../../utils/doctorStore';
import { getBookings, addBooking, subscribeBookings, refreshBookings } from '../../utils/bookingStore';
import { getSession } from '../../utils/authStore';
import { getProviders } from '../../utils/providerStore';
import { initiatePaymentApi, confirmPaymentApi, getPaymentStatusApi } from '../../utils/paymentStore';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '../../utils/api';
import { loadConversationsFromApi, getActiveChats, subscribeActiveChats, ActiveChat, isConversationUnread } from '../../utils/chatStore';
import { getNotifications, subscribeNotifications, fetchNotifications } from '../../utils/notificationStore';

// Custom Bell Icon
const BellIcon = ({ color = '#0ea5e9', size = 20 }: { color?: string; size?: number }) => (
  <View style={{ width: size, height: size * 1.1, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: size * 0.3, height: size * 0.3,
      borderRadius: size * 0.15, backgroundColor: color,
      position: 'absolute', bottom: 0
    }} />
    <View style={{
      width: size * 0.8, height: size * 0.7,
      borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.4,
      borderWidth: 1.5, borderColor: color,
      backgroundColor: color + '20',
      position: 'absolute', top: size * 0.1
    }} />
    <View style={{
      width: size, height: size * 0.15,
      borderTopLeftRadius: 2, borderTopRightRadius: 2,
      backgroundColor: color,
      position: 'absolute', bottom: size * 0.2
    }} />
  </View>
);

// Search Icon (no emoji)
const SearchIcon = ({ size = 14, color = '#94a3b8' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: size * 0.65, height: size * 0.65,
      borderRadius: size * 0.65,
      borderWidth: 1.5, borderColor: color,
    }} />
    <View style={{
      position: 'absolute', bottom: 0, right: 0,
      width: 1.5, height: size * 0.35,
      backgroundColor: color,
      transform: [{ rotate: '-45deg' }],
      borderRadius: 1,
    }} />
  </View>
);

// Star icon
const StarIcon = ({ size = 10, color = '#f59e0b' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '45deg' }] }} />
);

// Location pin icon
const PinIcon = ({ size = 10, color = '#64748b' }: { size?: number; color?: string }) => (
  <View style={{ width: size * 0.7, height: size, alignItems: 'center' }}>
    <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, borderWidth: 1.5, borderColor: color }} />
    <View style={{ width: 1.5, height: size * 0.35, backgroundColor: color, marginTop: -1 }} />
  </View>
);

const INDIAN_BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda (BOB)',
  'Yes Bank',
  'Union Bank of India',
  'IndusInd Bank',
  'Canara Bank',
  'IDFC First Bank',
  'Federal Bank',
  'Indian Bank',
  'Central Bank of India',
  'UCO Bank',
];

export default function PatientHomeScreen() {
  const router = useRouter();
  const session = getSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Allopathy' | 'Ayurveda' | 'Homeopathy'>('All');
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<RegisteredDoctor | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookings, setBookings] = useState(() => getBookings());
  const [doctorsList, setDoctorsList] = useState<RegisteredDoctor[]>(() => getDoctors());

  // Profile Modal State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [viewingDoctor, setViewingDoctor] = useState<RegisteredDoctor | null>(null);
  const [appointmentMode, setAppointmentMode] = useState<'Online' | 'In-Person'>('Online');
  const [patientActiveChats, setPatientActiveChats] = useState<ActiveChat[]>(() => getActiveChats());

  // Checkout Modal State
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [notifications, setNotifications] = useState(() => getNotifications());

  // Track seen message IDs to avoid duplicate alerts
  const seenMessageIds = useRef<Record<string, string>>({});

  useEffect(() => {
    const updateB = () => setBookings(getBookings());
    const unsubscribeB = subscribeBookings(updateB);

    const updateD = () => setDoctorsList(getDoctors());
    const unsubscribeD = subscribeDoctors(updateD);

    // Check for new doctor messages and alert the patient
    const checkForNewMessages = () => {
      setPatientActiveChats(getActiveChats());
      const chats = getActiveChats();
      for (const chat of chats) {
        if (chat.isDoctorSender && chat.lastMessageId) {
          const prevId = seenMessageIds.current[chat.conversationId];
          if (prevId !== chat.lastMessageId) {
            seenMessageIds.current[chat.conversationId] = chat.lastMessageId;
            // Only alert if we had a previous ID (skip the first load)
            if (prevId) {
              const docName = chat.patientName;
              const snippet = chat.lastMessage || 'New message';
              
              // Find the doctor or provider profile ID for navigation
              const docProfile = chat.patientId ? doctorsList.find(d => d.userId === chat.patientId) : undefined;
              let docProfileId = docProfile?.id || '';
              if (!docProfileId && chat.patientId?.startsWith('mock_doctor_user_id_')) {
                docProfileId = chat.patientId.replace('mock_doctor_user_id_', '');
              }

              const provProfile = chat.patientId ? getProviders().find(p => p.userId === chat.patientId) : undefined;
              let provProfileId = provProfile?.id || '';
              if (!provProfileId && chat.patientId?.startsWith('mock_provider_user_id_')) {
                provProfileId = chat.patientId.replace('mock_provider_user_id_', '');
              }

              Alert.alert(
                `New Message from ${docName}`,
                snippet.length > 80 ? snippet.substring(0, 80) + '...' : snippet,
                [
                  { text: 'Later', style: 'cancel' },
                  {
                    text: 'Chat Now',
                    onPress: () => {
                      if (docProfileId) {
                        router.push(`/patient/chat?doctorId=${docProfileId}`);
                      } else if (provProfileId) {
                        router.push(`/patient/chat?providerId=${provProfileId}`);
                      }
                    }
                  }
                ]
              );
            }
          }
        }
      }
    };

    const updateN = () => setNotifications(getNotifications());
    const unsubscribeN = subscribeNotifications(updateN);
    fetchNotifications();

    const unsubscribeChats = subscribeActiveChats(checkForNewMessages);

    refreshBookings();
    loadConversationsFromApi();

    // Seed initial seen message IDs on first load
    setTimeout(() => {
      const chats = getActiveChats();
      for (const chat of chats) {
        if (chat.lastMessageId) {
          seenMessageIds.current[chat.conversationId] = chat.lastMessageId;
        }
      }
    }, 2000);

    const interval = setInterval(() => {
      refreshBookings();
      loadConversationsFromApi();
      fetchNotifications();
    }, 6000);

    return () => {
      unsubscribeB();
      unsubscribeD();
      unsubscribeChats();
      unsubscribeN();
      clearInterval(interval);
    };
  }, []);

  // Detect if query matches a category prefix
  const getCategoryFromQuery = (q: string): 'Allopathy' | 'Ayurveda' | 'Homeopathy' | null => {
    if (!q) return null;
    if ('allopathy'.startsWith(q)) return 'Allopathy';
    if ('ayurveda'.startsWith(q)) return 'Ayurveda';
    if ('homeopathy'.startsWith(q)) return 'Homeopathy';
    return null;
  };

  // Smart search: auto-activate filter pill when typing a category name
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const q = text.trim().toLowerCase();
    if (q === '') {
      setActiveFilter('All');
      return;
    }
    const detected = getCategoryFromQuery(q);
    if (detected) {
      setActiveFilter(detected);
    }
    // Non-category text: keep current filter, search within it
  };

  const filteredDoctors = doctorsList.filter((doc) => {
    const q = searchQuery.trim().toLowerCase();
    const detected = getCategoryFromQuery(q);

    // Category filter: use detected category OR the manually selected filter pill
    const effectiveFilter = detected ?? activeFilter;
    const matchesCategory = effectiveFilter === 'All' || doc.category === effectiveFilter;

    // Text search: only for non-category queries with meaningful length
    let matchesSearch = true;
    if (q && !detected) {
      matchesSearch =
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.location.toLowerCase().includes(q);
    }

    return matchesCategory && matchesSearch;
  });

  const handleOpenBooking = (doctor: RegisteredDoctor) => {
    setSelectedDoctor(doctor);
    const defaultMode = (doctor.consultationMode === 'Offline') ? 'In-Person' : 'Online';
    setAppointmentMode(defaultMode);
    
    const slots = defaultMode === 'Online' 
      ? (doctor.onlineSlots && doctor.onlineSlots.length > 0 ? doctor.onlineSlots : doctor.availability) 
      : (doctor.offlineSlots && doctor.offlineSlots.length > 0 ? doctor.offlineSlots : doctor.availability);
      
    setSelectedTime(slots[0] || '10:00 AM');
    setBookingModalVisible(true);
  };

  const handleModeChange = (newMode: 'Online' | 'In-Person') => {
    if (!selectedDoctor) return;
    setAppointmentMode(newMode);
    const slots = newMode === 'Online' 
      ? (selectedDoctor.onlineSlots && selectedDoctor.onlineSlots.length > 0 ? selectedDoctor.onlineSlots : selectedDoctor.availability) 
      : (selectedDoctor.offlineSlots && selectedDoctor.offlineSlots.length > 0 ? selectedDoctor.offlineSlots : selectedDoctor.availability);
    setSelectedTime(slots[0] || '10:00 AM');
  };

  const handleConfirmBooking = () => {
    if (!selectedDoctor) return;
    setCheckoutModalVisible(true);
  };

  const handleExecutePayment = async () => {
    if (!selectedDoctor) return;
    setIsProcessingPayment(true);
    try {
      const initResult = await initiatePaymentApi({
        doctorProfileId: selectedDoctor.id,
        appointmentType: appointmentMode === 'Online' ? 'ONLINE_VIDEO' : 'IN_PERSON',
        scheduledDate: new Date().toISOString().slice(0, 10),
        scheduledTime: selectedTime,
        patientNotes: 'Appointment with ' + selectedDoctor.name + ' paid via ' + selectedPaymentMethod
      });

      // Construct the checkout URL served by our backend
      const checkoutUrl = `${API_BASE_URL}/payments/razorpay-patient-checkout?paymentId=${initResult.paymentId}`;

      // Open hosted checkout page in Expo WebBrowser overlay
      await WebBrowser.openBrowserAsync(checkoutUrl);

      // Verify payment status by polling the backend
      let paymentSuccess = false;
      for (let i = 0; i < 15; i++) { // Poll for up to 30 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const statusRes = await getPaymentStatusApi(initResult.paymentId);
          if (statusRes.status === 'PAID') {
            paymentSuccess = true;
            break;
          }
        } catch (pollErr) {
          // Keep polling on network/connectivity errors
        }
      }

      if (paymentSuccess) {
        refreshBookings();
        setIsProcessingPayment(false);
        setCheckoutModalVisible(false);
        setBookingModalVisible(false);

        Alert.alert(
          'Payment Successful',
          `Your appointment with ${selectedDoctor.name} has been confirmed for ${selectedTime}.`,
          [{ text: 'OK', onPress: () => router.push('/patient/profile') }]
        );
      } else {
        setIsProcessingPayment(false);
        Alert.alert(
          'Payment Status Pending/Cancelled',
          'We could not verify your payment. Please check your profile booking history or try again.'
        );
      }
    } catch (e: any) {
      setIsProcessingPayment(false);
      Alert.alert('Transaction Failed', e.message || 'Payment initiation declined.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingHorizontal: 20, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#bae6fd',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#0ea5e9', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
        elevation: 3,marginTop:-36, 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: '#0ea5e9',
            alignItems: 'center', justifyContent: 'center', marginRight: 10,
            shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3, marginTop:28,
          }}>
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }}>N</Text>
          </View>
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3,marginTop:30 }}>
              NIROG <Text style={{ color: '#10b981', fontWeight: '700' }}>HEALTH</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Verified Patient Care
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28 }}>
          <TouchableOpacity
            onPress={() => router.push('/patient/notifications')}
            style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: '#f0f9ff', borderWidth: 1.5, borderColor: '#0ea5e9',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,
              position: 'relative'
            }}
          >
            <BellIcon color="#0ea5e9" size={16} />
            {notifications.some(n => !n.isRead) && (
              <View style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#ffffff' }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/patient/profile')}
            style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#0ea5e9',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,
              position: 'relative',
            }}
          >
            <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '900' }}>
              {session.name ? session.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'P'}
            </Text>
            {patientActiveChats.some(c => c.isDoctorSender && isConversationUnread(c.conversationId, c.lastMessageId)) && (
              <View style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#ffffff' }} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
        <View style={{
          backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bae6fd',
          borderRadius: 16, flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 14, paddingVertical: 11,
          shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
        }}>
          <SearchIcon size={15} color="#94a3b8" />
          <TextInput
            placeholder="Search by name, specialty, or category..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={handleSearch}
            style={{ color: '#0f172a', flex: 1, fontSize: 12, fontWeight: '600', marginLeft: 8 }}
          />
        </View>
      </View>

      {/* Filter Pills */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 8 }}>
        {(['All', 'Allopathy', 'Ayurveda', 'Homeopathy'] as const).map((filter) => {
          const isActive = activeFilter === filter;
          const label = filter === 'All' ? 'All Specialists' : `${filter} Care`;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => { setActiveFilter(filter); setSearchQuery(''); }}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                borderWidth: 1,
                backgroundColor: isActive ? '#e0f2fe' : '#ffffff',
                borderColor: isActive ? '#38bdf8' : '#e2e8f0',
                shadowColor: '#0ea5e9', shadowOpacity: isActive ? 0.1 : 0.04,
                shadowRadius: 4, elevation: isActive ? 2 : 1,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? '#0369a1' : '#64748b' }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Doctors Feed */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        


        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
          {activeFilter === 'All' ? 'Available Doctors' : `${activeFilter} Specialists`}
        </Text>

        {filteredDoctors.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700' }}>No specialists match your filters.</Text>
          </View>
        ) : (
          filteredDoctors.map((doc) => {
            const isAyur = doc.category === 'Ayurveda';
            const badgeBg = isAyur ? '#ecfdf5' : '#e0f2fe';
            const badgeBorder = isAyur ? '#a7f3d0' : '#7dd3fc';
            const badgeText = isAyur ? '#059669' : '#0369a1';
            const brandButton = isAyur ? '#10b981' : '#0ea5e9';

            return (
              <View key={doc.id} style={{
                backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
                borderRadius: 20, padding: 18, marginBottom: 14,
                shadowColor: '#0ea5e9', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
              }}>
                <TouchableOpacity 
                  onPress={() => { setViewingDoctor(doc); setProfileModalVisible(true); }}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}
                >
                  <Image source={{ uri: doc.avatar }} style={{ width: 54, height: 54, borderRadius: 27, marginRight: 14, borderWidth: 2, borderColor: '#bae6fd' }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}>
                      <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14 }}>{doc.name}</Text>
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: badgeBg, borderWidth: 1, borderColor: badgeBorder }}>
                        <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', color: badgeText }}>{doc.category}</Text>
                      </View>
                    </View>
                    <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 1 }}>{doc.specialty}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                      <StarIcon size={8} color="#f59e0b" />
                      <Text style={{ color: '#78716c', fontSize: 10, fontWeight: '700' }}>{doc.rating} ({doc.reviewsCount} reviews) • {doc.experience} yrs</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 }}>
                      <PinIcon size={10} color="#94a3b8" />
                      <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>{doc.location} ({doc.distance})</Text>
                    </View>
                    <Text style={{ color: '#0ea5e9', fontSize: 10, fontWeight: '800', marginTop: 6 }}>View Profile Details →</Text>
                  </View>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f9ff' }}>
                  <View>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Consultation Fee</Text>
                    <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 15, marginTop: 1 }}>₹{doc.fee}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => router.push(`/patient/chat?doctorId=${doc.id}`)}
                      style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc', position: 'relative' }}
                    >
                      <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 11 }}>Chat</Text>
                      {patientActiveChats.some(c => {
                        const isUnread = c.isDoctorSender && isConversationUnread(c.conversationId, c.lastMessageId);
                        if (!isUnread) return false;
                        const matchingDoc = c.patientId ? doctorsList.find(d => d.userId === c.patientId) : undefined;
                        if (matchingDoc) return matchingDoc.id === doc.id;
                        if (c.patientId === `mock_doctor_user_id_${doc.id}`) return true;
                        return false;
                      }) && (
                        <View style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#ffffff' }} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleOpenBooking(doc)}
                      style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: brandButton, shadowColor: brandButton, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
                    >
                      <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>Book Appointment</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Booking Modal */}
      {selectedDoctor && (
        <Modal visible={bookingModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' }}>
            <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#bae6fd', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 }}>
              {/* Handle */}
              <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>Confirm Appointment</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Choose your consultation slot</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', padding: 14, borderRadius: 16, marginBottom: 18, gap: 12 }}>
                <Image source={{ uri: selectedDoctor.avatar }} style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#7dd3fc' }} />
                <View>
                  <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 13 }}>{selectedDoctor.name}</Text>
                  <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600' }}>{selectedDoctor.specialty}</Text>
                </View>
              </View>

              {/* Consultation Mode (if doctor supports Both) */}
              {selectedDoctor.consultationMode === 'Both' && (
                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Consultation Mode</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {(['Online', 'In-Person'] as const).map((modeVal) => {
                      const isModeSelected = appointmentMode === modeVal;
                      return (
                        <TouchableOpacity
                          key={modeVal}
                          onPress={() => handleModeChange(modeVal)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            alignItems: 'center',
                            backgroundColor: isModeSelected ? '#e0f2fe' : '#ffffff',
                            borderColor: isModeSelected ? '#0ea5e9' : '#e2e8f0',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: isModeSelected ? '#0369a1' : '#475569' }}>
                            {modeVal === 'Online' ? 'Online Video' : 'In-Person Visit'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Consultation Mode Description (if doctor supports single mode) */}
              {selectedDoctor.consultationMode && selectedDoctor.consultationMode !== 'Both' && (
                <View style={{ marginBottom: 18, padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Consultation Mode</Text>
                  <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                    {selectedDoctor.consultationMode === 'Online' ? '💻 Online Video Call' : '🏥 In-Person Clinic Visit'}
                  </Text>
                </View>
              )}

              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Available Slots</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {(() => {
                  const slots = (appointmentMode === 'Online' ? selectedDoctor.onlineSlots : selectedDoctor.offlineSlots) || selectedDoctor.availability || [];
                  if (slots.length === 0) {
                    return (
                      <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', paddingVertical: 10 }}>
                        No timing slots available for {appointmentMode === 'Online' ? 'online consultations' : 'clinic visits'}.
                      </Text>
                    );
                  }
                  return slots.map((time) => {
                    const isTimeSelected = selectedTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setSelectedTime(time)}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
                          backgroundColor: isTimeSelected ? '#e0f2fe' : '#ffffff',
                          borderColor: isTimeSelected ? '#38bdf8' : '#e2e8f0',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isTimeSelected ? '#0369a1' : '#64748b' }}>{time}</Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>

              <TouchableOpacity
                onPress={handleConfirmBooking}
                style={{ backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 10, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Confirm Booking (₹{selectedDoctor.fee})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setBookingModalVisible(false)}
                style={{ borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', paddingVertical: 13, borderRadius: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 12 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Secure Checkout Modal */}
      {selectedDoctor && (
        <Modal visible={checkoutModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' }}>
            <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#bae6fd', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
              
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>🔒 Secure Checkout</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Complete your transaction safely</Text>
              </View>

              {/* Order Summary Card */}
              <View style={{ backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', padding: 16, borderRadius: 20, marginBottom: 20 }}>
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Booking Summary</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 13 }}>{selectedDoctor.name} ({appointmentMode === 'Online' ? 'Online' : 'In-Person'})</Text>
                  <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 13 }}>₹{selectedDoctor.fee}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#bae6fd', paddingTop: 8, marginTop: 4 }}>
                  <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 14 }}>Total Amount</Text>
                  <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 16 }}>₹{selectedDoctor.fee}</Text>
                </View>
              </View>

              {/* Payment Methods */}
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Select Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {(['UPI', 'Card', 'NetBanking'] as const).map((method) => {
                  const isSelected = selectedPaymentMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      onPress={() => setSelectedPaymentMethod(method)}
                      style={{
                        flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, alignItems: 'center',
                        backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                        borderColor: isSelected ? '#10b981' : '#e2e8f0',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: isSelected ? '#065f46' : '#64748b' }}>
                        {method === 'NetBanking' ? 'Net Bank' : method}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Payment Method Inputs */}
              {selectedPaymentMethod === 'UPI' && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>UPI ID</Text>
                  <TextInput
                    placeholder="e.g. mobile@ybl or name@okaxis"
                    placeholderTextColor="#94a3b8"
                    defaultValue={`${session.phone || '9876543210'}@paytm`}
                    style={{ backgroundColor: '#f8fafc', color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, fontWeight: '600' }}
                  />
                </View>
              )}

              {selectedPaymentMethod === 'Card' && (
                <View style={{ marginBottom: 20, gap: 10 }}>
                  <TextInput
                    placeholder="Card Number (e.g. 4111 2222 3333 4444)"
                    placeholderTextColor="#94a3b8"
                    style={{ backgroundColor: '#f8fafc', color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, fontWeight: '600' }}
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      placeholder="MM/YY"
                      placeholderTextColor="#94a3b8"
                      style={{ flex: 1, backgroundColor: '#f8fafc', color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, fontWeight: '600', textAlign: 'center' }}
                    />
                    <TextInput
                      placeholder="CVV"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry
                      style={{ flex: 1, backgroundColor: '#f8fafc', color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, fontWeight: '600', textAlign: 'center' }}
                    />
                  </View>
                </View>
              )}

              {selectedPaymentMethod === 'NetBanking' && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Search & Select Bank</Text>
                  <TextInput
                    placeholder="🔍 Search bank name..."
                    placeholderTextColor="#94a3b8"
                    value={bankSearchQuery}
                    onChangeText={setBankSearchQuery}
                    style={{ backgroundColor: '#f8fafc', color: '#0f172a', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, fontWeight: '600', marginBottom: 10 }}
                  />
                  <ScrollView style={{ maxHeight: 110 }} nestedScrollEnabled={true}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {INDIAN_BANKS.filter(bank => bank.toLowerCase().includes(bankSearchQuery.toLowerCase())).map((bank) => {
                        const isBankSelected = selectedBank === bank;
                        return (
                          <TouchableOpacity
                            key={bank}
                            onPress={() => setSelectedBank(bank)}
                            style={{
                              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
                              backgroundColor: isBankSelected ? '#e0f2fe' : '#f8fafc',
                              borderColor: isBankSelected ? '#0ea5e9' : '#e2e8f0'
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: '700', color: isBankSelected ? '#0369a1' : '#475569' }}>{bank}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                  {selectedBank ? (
                    <Text style={{ color: '#059669', fontSize: 10, fontWeight: '800', marginTop: 8 }}>✓ Selected Bank: {selectedBank}</Text>
                  ) : null}
                </View>
              )}

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={handleExecutePayment}
                disabled={isProcessingPayment}
                style={{
                  backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 10,
                  shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                  flexDirection: 'row', justifyContent: 'center', gap: 8
                }}
              >
                {isProcessingPayment ? (
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Processing transaction...</Text>
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Pay Now (₹{selectedDoctor.fee})</Text>
                )}
              </TouchableOpacity>

              {!isProcessingPayment && (
                <TouchableOpacity
                  onPress={() => setCheckoutModalVisible(false)}
                  style={{ borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', paddingVertical: 13, borderRadius: 16, alignItems: 'center' }}
                >
                  <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 12 }}>Cancel Payment</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Doctor Profile Details Modal */}
      {viewingDoctor && (
        <Modal visible={profileModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' }}>
            <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#bae6fd', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, maxHeight: '85%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
              
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Profile Summary */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <Image source={{ uri: viewingDoctor.avatar }} style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#7dd3fc' }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '900' }}>{viewingDoctor.name}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#ecfdf5', borderRadius: 10, borderWidth: 1, borderColor: '#a7f3d0', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: '#059669', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>Verified</Text>
                      </View>
                    </View>
                    <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 2 }}>{viewingDoctor.specialty} ({viewingDoctor.category})</Text>
                    <Text style={{ color: '#0ea5e9', fontSize: 11, fontWeight: '700', marginTop: 2 }}>Senior Medical Specialist</Text>
                  </View>
                </View>

                {/* Stats Table Grid */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                  <View style={{ flex: 1, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 16, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#0369a1', fontSize: 15, fontWeight: '800' }}>{viewingDoctor.rating} ★</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 }}>Rating</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 16, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#0369a1', fontSize: 15, fontWeight: '800' }}>{viewingDoctor.experience} Yrs</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 }}>Experience</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 16, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#0369a1', fontSize: 15, fontWeight: '800' }}>₹{viewingDoctor.fee}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 }}>Fee</Text>
                  </View>
                </View>

                {/* Detailed Professional Registry Info */}
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Practice Details</Text>
                <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 18, padding: 16, marginBottom: 20, gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>Clinic Location</Text>
                    <Text style={{ color: '#475569', fontSize: 11, fontWeight: '700', maxWidth: '60%', textAlign: 'right' }}>{viewingDoctor.location}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>Practice Email</Text>
                    <Text style={{ color: '#475569', fontSize: 11, fontWeight: '700' }}>{viewingDoctor.email || 'practice@nirog.com'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>Verification File</Text>
                    <Text style={{ color: '#059669', fontSize: 11, fontWeight: '700' }}>{viewingDoctor.documentName || 'medical_license_verified.pdf'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>License Status</Text>
                    <Text style={{ color: '#059669', fontSize: 11, fontWeight: '800' }}>Active & Registered</Text>
                  </View>
                </View>

                {/* Availability Slots */}
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Consultation Hours</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                  {viewingDoctor.availability.map((time) => (
                    <View key={time} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 10 }}>
                      <Text style={{ color: '#0369a1', fontSize: 10, fontWeight: '700' }}>{time}</Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setProfileModalVisible(false);
                      router.push(`/patient/chat?doctorId=${viewingDoctor.id}`);
                    }}
                    style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc', alignItems: 'center' }}
                  >
                    <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 12 }}>Chat Specialist</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setProfileModalVisible(false);
                      handleOpenBooking(viewingDoctor);
                    }}
                    style={{ flex: 1.5, paddingVertical: 14, borderRadius: 14, backgroundColor: viewingDoctor.category === 'Ayurveda' ? '#10b981' : '#0ea5e9', alignItems: 'center' }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>Book Consultation</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setProfileModalVisible(false)}
                  style={{ borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', paddingVertical: 13, borderRadius: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 12 }}>Close Profile</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

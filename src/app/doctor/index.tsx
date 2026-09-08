import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getBookings, updateBookingStatus, subscribeBookings, Booking, refreshBookings } from '../../utils/bookingStore';
import { getSession } from '../../utils/authStore';
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

interface DoctorBooking {
  id: string;
  patientName: string;
  type: string;
  date: string;
  time: string;
  fee: number;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Rejected' | 'Cancelled';
}

// Calendar mini icon
const CalendarDot = ({ color = '#0ea5e9' }: { color?: string }) => (
  <View style={{ width: 10, height: 10, borderRadius: 2, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 6, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

// Clock mini icon
const ClockDot = ({ color = '#0ea5e9' }: { color?: string }) => (
  <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', width: 1.5, height: 3, backgroundColor: color, top: 1, borderRadius: 1 }} />
    <View style={{ position: 'absolute', width: 2.5, height: 1.5, backgroundColor: color, left: 5, top: 4, borderRadius: 1 }} />
  </View>
);

export default function DoctorBookingsScreen() {
  const router = useRouter();
  const session = getSession();
  
  const [appointments, setAppointments] = useState<Booking[]>(() => 
    getBookings().filter(b => b.doctorId === session.profileId)
  );
  const [activeChats, setActiveChats] = useState<ActiveChat[]>(() => getActiveChats());
  const [notifications, setNotifications] = useState(() => getNotifications());
  const seenMessageIds = useRef<Record<string, string>>({});
 
  useEffect(() => {
    const update = () => {
      setAppointments(getBookings().filter(b => b.doctorId === session.profileId));
    };
    const unsubscribe = subscribeBookings(update);

    const checkForNewMessages = () => {
      setActiveChats(getActiveChats());
      const chats = getActiveChats();
      for (const chat of chats) {
        if (!chat.isDoctorSender && chat.lastMessageId) {
          const prevId = seenMessageIds.current[chat.conversationId];
          if (prevId !== chat.lastMessageId) {
            seenMessageIds.current[chat.conversationId] = chat.lastMessageId;
            if (prevId) {
              const patientName = chat.patientName;
              const snippet = chat.lastMessage || 'New message';
              Alert.alert(
                `New Message from ${patientName}`,
                snippet.length > 80 ? snippet.substring(0, 80) + '...' : snippet,
                [
                  { text: 'Later', style: 'cancel' },
                  {
                    text: 'Chat Now',
                    onPress: () => {
                      router.push(`/doctor/chat?patientId=${chat.patientId}&patientName=${patientName}`);
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
      unsubscribe();
      unsubscribeChats();
      unsubscribeN();
      clearInterval(interval);
    };
  }, [session.profileId]);

  const updateStatus = (id: string, nextStatus: Booking['status']) => {
    updateBookingStatus(id, nextStatus);
    Alert.alert('Status Updated', `Appointment marked as ${nextStatus}.`);
  };

  const statusStyle = (status: Booking['status']) => {
    if (status === 'Pending') return { bg: '#fffbeb', border: '#fde68a', text: '#b45309' };
    if (status === 'Confirmed') return { bg: '#e0f2fe', border: '#7dd3fc', text: '#0369a1' };
    if (status === 'Completed') return { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669' };
    if (status === 'Rejected') return { bg: '#fff1f2', border: '#fecdd3', text: '#e11d48' };
    return { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' };
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
          <Image
            source={require('../../../assets/images/logo.png')}
            style={{
              width: 36, height: 36, borderRadius: 10, marginRight: 10, marginTop: 28
            }}
            resizeMode="contain"
          />
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3 , marginTop:28}}>
              PATIENT <Text style={{ color: '#10b981', fontWeight: '700' }}>BOOKINGS</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Doctor Consultation Queue
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28 }}>
          <TouchableOpacity
            onPress={() => router.push('/doctor/notifications')}
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
            onPress={() => router.push('/doctor/profile')}
            style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#0ea5e9',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,
              position: 'relative'
            }}
          >
            <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '900' }}>
              {session.name ? session.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'D'}
            </Text>
            {activeChats.some(c => !c.isDoctorSender && isConversationUnread(c.conversationId, c.lastMessageId)) && (
              <View style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#ffffff' }} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
          {appointments.length} Appointments
        </Text>

        {appointments.map(ap => {
          const s = statusStyle(ap.status);
          return (
            <View key={ap.id} style={{
              backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
              borderRadius: 20, padding: 18, marginBottom: 14,
              shadowColor: '#0ea5e9', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View>
                  <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15 }}>{ap.patientName}</Text>
                  <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2, fontWeight: '600' }}>{ap.type}</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: s.bg, borderWidth: 1, borderColor: s.border }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, color: s.text }}>{ap.status}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <CalendarDot color="#0ea5e9" />
                  <Text style={{ color: '#475569', fontSize: 11, fontWeight: '700' }}>{ap.date}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <ClockDot color="#0ea5e9" />
                  <Text style={{ color: '#475569', fontSize: 11, fontWeight: '700' }}>{ap.time}</Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#f0fdf4', borderRadius: 8, borderWidth: 1, borderColor: '#a7f3d0' }}>
                  <Text style={{ color: '#059669', fontSize: 11, fontWeight: '800' }}>₹{ap.fee}</Text>
                </View>
              </View>
              {ap.status === 'Pending' && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f9ff', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => router.push(`/doctor/chat?patientName=${ap.patientName}&patientId=${ap.patientId}`)}
                    style={{ backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, position: 'relative' }}
                  >
                    <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 11 }}>Chat</Text>
                    {activeChats.some(c => c.patientId === ap.patientId && !c.isDoctorSender && isConversationUnread(c.conversationId, c.lastMessageId)) && (
                      <View style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#ffffff' }} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateStatus(ap.id, 'Confirmed')}
                    style={{ backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>Accept Booking</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateStatus(ap.id, 'Rejected')}
                    style={{ borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 }}
                  >
                    <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 11 }}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
 
              {ap.status === 'Confirmed' && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f9ff', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => router.push(`/doctor/chat?patientName=${ap.patientName}&patientId=${ap.patientId}`)}
                    style={{ backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, position: 'relative' }}
                  >
                    <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 11 }}>Chat with Patient</Text>
                    {activeChats.some(c => c.patientId === ap.patientId && !c.isDoctorSender && isConversationUnread(c.conversationId, c.lastMessageId)) && (
                      <View style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#ffffff' }} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateStatus(ap.id, 'Completed')}
                    style={{ backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>Mark Completed</Text>
                  </TouchableOpacity>
                </View>
              )}

              {ap.status === 'Completed' && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f9ff', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => router.push(`/doctor/chat?patientName=${ap.patientName}&patientId=${ap.patientId}`)}
                    style={{ backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, position: 'relative' }}
                  >
                    <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 11 }}>Chat with Patient</Text>
                    {activeChats.some(c => c.patientId === ap.patientId && !c.isDoctorSender && isConversationUnread(c.conversationId, c.lastMessageId)) && (
                      <View style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#ffffff' }} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
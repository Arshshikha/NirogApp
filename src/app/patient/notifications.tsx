import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getNotifications, subscribeNotifications, fetchNotifications, markAsRead, markAllAsRead, NotificationItem } from '../../utils/notificationStore';

// Custom icons using geometric React Native Views to match design guidelines
const BackIcon = ({ color = '#0284c7', size = 16 }: { color?: string; size?: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center' }}>
    <View style={{
      width: size * 0.6, height: size * 0.6,
      borderLeftWidth: 2, borderBottomWidth: 2, borderColor: color,
      transform: [{ rotate: '45deg' }], marginLeft: size * 0.2
    }} />
  </View>
);

const NotificationBadge = ({ type }: { type: string }) => {
  let bg = '#f1f5f9';
  let border = '#cbd5e1';
  let char = '🔔';
  let charColor = '#64748b';

  if (type === 'BOOKING_CONFIRMATION') {
    bg = '#e0f2fe';
    border = '#bae6fd';
    char = '📅';
    charColor = '#0284c7';
  } else if (type === 'BOOKING_CANCELLATION') {
    bg = '#fff1f2';
    border = '#fecdd3';
    char = '❌';
    charColor = '#e11d48';
  } else if (type === 'PAYMENT_SUCCESS') {
    bg = '#ecfdf5';
    border = '#a7f3d0';
    char = '💰';
    charColor = '#059669';
  } else if (type === 'PAYMENT_FAILURE') {
    bg = '#fff1f2';
    border = '#fecdd3';
    char = '⚠️';
    charColor = '#ef4444';
  } else if (type === 'NEW_MESSAGE') {
    bg = '#fef08a';
    border = '#fef08a';
    char = '💬';
    charColor = '#ca8a04';
  }

  return (
    <View style={{
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: bg, borderWidth: 1.5, borderColor: border,
      alignItems: 'center', justifyContent: 'center'
    }}>
      <Text style={{ fontSize: 16, color: charColor }}>{char}</Text>
    </View>
  );
};

export default function PatientNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotifications());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = () => setNotifications(getNotifications());
    const unsubscribe = subscribeNotifications(update);
    
    const initLoad = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };
    initLoad();

    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notif: NotificationItem) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#bae6fd',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#0ea5e9', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, marginTop: -36,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 32, height: 32, borderRadius: 10, backgroundColor: '#f0f9ff',
              alignItems: 'center', justifyContent: 'center', marginRight: 12,
              borderWidth: 1.5, borderColor: '#bae6fd', marginTop: 28
            }}
          >
            <BackIcon color="#0369a1" size={14} />
          </TouchableOpacity>
          <View style={{ marginTop: 28 }}>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15 }}>
              NOTIFICATIONS
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              System Alerts & Updates
            </Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={{
              paddingHorizontal: 10, paddingVertical: 6,
              backgroundColor: '#e0f2fe', borderRadius: 12,
              borderWidth: 1.2, borderColor: '#7dd3fc', marginTop: 28
            }}
          >
            <Text style={{ color: '#0369a1', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0ea5e9']} />
          }
        >
          <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
            {notifications.length} Alerts ({unreadCount} Unread)
          </Text>

          {notifications.length === 0 ? (
            <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700' }}>Your inbox is empty.</Text>
            </View>
          ) : (
            notifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                onPress={() => handleNotificationPress(notif)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#ffffff', borderWidth: 1,
                  borderColor: notif.isRead ? '#e0f2fe' : '#7dd3fc',
                  borderRadius: 20, padding: 16, marginBottom: 12,
                  flexDirection: 'row', alignItems: 'center',
                  shadowColor: '#0ea5e9', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
                  position: 'relative'
                }}
              >
                <NotificationBadge type={notif.type} />
                <View style={{ flex: 1, marginLeft: 14, marginRight: 8 }}>
                  <Text style={{ color: '#0f172a', fontWeight: notif.isRead ? '700' : '800', fontSize: 13 }}>
                    {notif.title}
                  </Text>
                  <Text style={{ color: '#475569', fontSize: 11, marginTop: 2, fontWeight: '500', lineHeight: 15 }}>
                    {notif.body}
                  </Text>
                  <Text style={{ fontSize: 8, color: '#94a3b8', fontWeight: '600', marginTop: 6 }}>
                    {new Date(notif.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {!notif.isRead && (
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: '#0ea5e9', position: 'absolute',
                    top: 16, right: 16
                  }} />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

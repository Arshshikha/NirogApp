import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet } from '../../utils/api';

interface Booking {
  id: string;
  bookingReference: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  paymentStatus: string;
  totalFee: number;
  doctorProfile?: {
    user: {
      profile: {
        firstName: string;
        lastName: string;
      } | null;
    };
  } | null;
  providerProfile?: {
    legalName: string;
  } | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  booking?: {
    bookingReference: string;
    doctorProfile?: {
      user: {
        profile: {
          firstName: string;
          lastName: string;
        } | null;
      };
    } | null;
    providerProfile?: {
      legalName: string;
    } | null;
  } | null;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bookings' | 'payments'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setErrorMsg(null);
      const [bookingsData, paymentsData] = await Promise.all([
        apiGet('/bookings'),
        apiGet('/payments')
      ]);
      setBookings(bookingsData || []);
      setPayments(paymentsData || []);
    } catch (e: any) {
      console.error('History fetch error:', e);
      setErrorMsg(e.message || 'Failed to load booking & payment history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getDoctorOrProviderName = (item: any) => {
    if (item.doctorProfile) {
      const profile = item.doctorProfile.user?.profile;
      return profile ? `Dr. ${profile.firstName} ${profile.lastName}` : 'Medical Doctor';
    }
    if (item.providerProfile) {
      return item.providerProfile.legalName || 'Medical Facility';
    }
    return 'Nirog Provider';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTimeForDisplay = (timeStr: string) => {
    if (!timeStr) return '';
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return timeStr;
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const ampm = match[3];
    if (ampm) return timeStr; // Already has AM/PM
    
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute} ${suffix}`;
  };

  const renderBookingStatus = (status: string) => {
    const st = status.toUpperCase();
    if (st === 'CONFIRMED') {
      return (
        <View style={[styles.statusBadge, styles.statusConfirmed]}>
          <Text style={styles.statusConfirmedText}>✔ CONFIRMED</Text>
        </View>
      );
    }
    if (st === 'COMPLETED') {
      return (
        <View style={[styles.statusBadge, styles.statusCompleted]}>
          <Text style={styles.statusCompletedText}>✔ COMPLETED</Text>
        </View>
      );
    }
    if (st === 'PENDING') {
      return (
        <View style={[styles.statusBadge, styles.statusPending]}>
          <Text style={styles.statusPendingText}>PENDING</Text>
        </View>
      );
    }
    if (st === 'REJECTED' || st === 'DECLINED') {
      return (
        <View style={[styles.statusBadge, styles.statusRejected]}>
          <Text style={styles.statusRejectedText}>DECLINED</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusCancelled]}>
        <Text style={styles.statusCancelledText}>CANCELLED</Text>
      </View>
    );
  };

  const renderPaymentStatus = (status: string) => {
    const st = status.toUpperCase();
    if (st === 'PAID' || st === 'SUCCESS') {
      return (
        <View style={[styles.statusBadge, styles.statusConfirmed]}>
          <Text style={styles.statusConfirmedText}>✔ PAID</Text>
        </View>
      );
    }
    if (st === 'PENDING') {
      return (
        <View style={[styles.statusBadge, styles.statusPending]}>
          <Text style={styles.statusPendingText}>PENDING</Text>
        </View>
      );
    }
    if (st === 'REFUNDED') {
      return (
        <View style={[styles.statusBadge, styles.statusRefunded]}>
          <Text style={styles.statusRefundedText}>REFUNDED</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusRejected]}>
        <Text style={styles.statusRejectedText}>UNPAID</Text>
      </View>
    );
  };

  const renderPaymentStatusTab = (status: string) => {
    const st = status.toUpperCase();
    if (st === 'PAID' || st === 'SUCCESS') {
      return (
        <View style={[styles.statusBadge, styles.statusConfirmed]}>
          <Text style={styles.statusConfirmedText}>SUCCESS</Text>
        </View>
      );
    }
    if (st === 'REFUNDED') {
      return (
        <View style={[styles.statusBadge, styles.statusRefunded]}>
          <Text style={styles.statusRefundedText}>REFUNDED</Text>
        </View>
      );
    }
    if (st === 'PENDING') {
      return (
        <View style={[styles.statusBadge, styles.statusPending]}>
          <Text style={styles.statusPendingText}>PENDING</Text>
        </View>
      );
    }
    if (st === 'FAILED') {
      return (
        <View style={[styles.statusBadge, styles.statusRejected]}>
          <Text style={styles.statusRejectedText}>FAILED</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusRejected]}>
        <Text style={styles.statusRejectedText}>UNPAID</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My History</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('bookings')}
          style={[styles.tabButton, activeTab === 'bookings' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'bookings' && styles.tabButtonTextActive]}>
            Bookings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('payments')}
          style={[styles.tabButton, activeTab === 'payments' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'payments' && styles.tabButtonTextActive]}>
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Fetching history records...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'bookings' ? (
        /* Bookings List */
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />}
        >
          {bookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bookings found.</Text>
            </View>
          ) : (
            bookings.map((booking) => (
              <View key={booking.id} style={styles.card}>
                {/* Doctor Details */}
                <Text style={styles.cardTitle}>{getDoctorOrProviderName(booking)}</Text>
                
                {/* Date & Time */}
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.cardDate}>
                    {formatDate(booking.scheduledDate)}
                  </Text>
                  <Text style={styles.cardTime}>
                    {formatTimeForDisplay(booking.scheduledTime)}
                  </Text>
                </View>

                {/* Status Details */}
                <View style={styles.statusBlock}>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Status:</Text>
                    {renderBookingStatus(booking.status)}
                  </View>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Payment:</Text>
                    {renderPaymentStatus(booking.paymentStatus)}
                  </View>
                </View>

                {/* Consultation Fee & Ref */}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>₹{booking.totalFee}</Text>
                  <Text style={styles.cardRef}>Ref: {booking.bookingReference}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        /* Payments List */
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />}
        >
          {payments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No payments found.</Text>
            </View>
          ) : (
            payments.map((payment) => (
              <View key={payment.id} style={styles.card}>
                {/* Amount */}
                <Text style={styles.cardPriceLarge}>₹{payment.amount}</Text>

                {/* Doctor/Provider details */}
                <Text style={styles.paymentCardDoctor}>
                  {payment.booking ? getDoctorOrProviderName(payment.booking) : 'Nirog Care'}
                </Text>

                {/* Payment Status */}
                <View style={styles.paymentStatusRow}>
                  {renderPaymentStatusTab(payment.status)}
                </View>

                {/* Date */}
                <Text style={styles.paymentCardDate}>
                  {formatDate(payment.createdAt)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginTop:-36,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginTop:28,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginTop:28,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  paymentCardDoctor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginVertical: 12,
  },
  cardTitleSmall: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0ea5e9',
  },
  cardPriceLarge: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  cardBody: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  dateTimeContainer: {
    marginVertical: 12,
    gap: 4,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  paymentCardDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  cardRef: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  statusBlock: {
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    width: 60,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: '#ecfdf5',
  },
  statusConfirmedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  statusCompleted: {
    backgroundColor: '#f0f9ff',
  },
  statusCompletedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
  },
  statusPending: {
    backgroundColor: '#fffbeb',
  },
  statusPendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d97706',
  },
  statusRejected: {
    backgroundColor: '#fef2f2',
  },
  statusRejectedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  statusRefunded: {
    backgroundColor: '#faf5ff',
  },
  statusRefundedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c3aed',
  },
  statusCancelled: {
    backgroundColor: '#f1f5f9',
  },
  statusCancelledText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
});

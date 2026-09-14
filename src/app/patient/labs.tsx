import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { addBooking, refreshBookings } from '../../utils/bookingStore';
import { getSession } from '../../utils/authStore';
import { initiatePaymentApi, confirmPaymentApi, getPaymentStatusApi } from '../../utils/paymentStore';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '../../utils/api';
import { getProviders, subscribeProviders, RegisteredProvider } from '../../utils/providerStore';

// Star icon (no emoji)
const StarIcon = ({ size = 9, color = '#f59e0b' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size * 1.1, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '45deg' }] }} />
);

// Location pin icon (no emoji)
const PinIcon = ({ size = 10, color = '#94a3b8' }: { size?: number; color?: string }) => (
  <View style={{ width: size * 0.7, height: size, alignItems: 'center' }}>
    <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, borderWidth: 1.5, borderColor: color }} />
    <View style={{ width: 1.5, height: size * 0.35, backgroundColor: color, marginTop: -1 }} />
  </View>
);

// Flask / lab icon decorator
const FlaskDecor = ({ size = 16, color = '#10b981' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.5, height: size * 0.4, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: color, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
    <View style={{ width: size * 0.85, height: size * 0.45, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: color, borderBottomLeftRadius: size * 0.2, borderBottomRightRadius: size * 0.2 }} />
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

export default function LabsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedLab, setSelectedLab] = useState<RegisteredProvider | null>(null);
  const [testName, setTestName] = useState('Full Body Checkup');
  const [bookingDate, setBookingDate] = useState('30 May, 2026');
  const [bookingTime, setBookingTime] = useState('09:00 AM');
  const [fee, setFee] = useState('450');

  // Checkout Modal State
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [paymentOption, setPaymentOption] = useState<'Online' | 'Onsite'>('Online');

  const [labsList, setLabsList] = useState<RegisteredProvider[]>(() => getProviders().filter(p => p.type === 'Lab'));

  useEffect(() => {
    const update = () => setLabsList(getProviders().filter(p => p.type === 'Lab'));
    const unsubscribe = subscribeProviders(update);
    return () => unsubscribe();
  }, []);

  const filteredLabs = labsList.filter(l => {
    if (selectedRegion === 'All') return true;
    return l.location.toLowerCase().includes(selectedRegion.toLowerCase());
  });

  const handleBook = (lab: RegisteredProvider) => {
    setSelectedLab(lab);
    setBookingModalVisible(true);
  };

  const confirmBooking = async () => {
    if (!selectedLab) return;
    if (paymentOption === 'Onsite') {
      try {
        let parsedDate = new Date(bookingDate);
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date();
        }
        const scheduledDateStr = parsedDate.toISOString().slice(0, 10);

        await initiatePaymentApi({
          providerProfileId: selectedLab.id,
          appointmentType: 'LAB_TEST',
          scheduledDate: scheduledDateStr,
          scheduledTime: bookingTime,
          patientNotes: 'Lab Test: ' + testName + ' paid onsite',
          payOnsite: true
        });

        refreshBookings();
        setBookingModalVisible(false);
        Alert.alert(
          'Appointment Booked Successfully!',
          `Your lab test has been scheduled for ${bookingDate} at ${bookingTime}. Please pay ₹${fee} onsite at the diagnostics counter.`,
          [{ text: 'OK', onPress: () => router.push('/patient/profile') }]
        );
      } catch (e: any) {
        Alert.alert('Booking Failed', e.message || 'Onsite booking could not be completed.');
      }
    } else {
      setCheckoutModalVisible(true);
    }
  };

  const handleExecutePayment = async () => {
    if (!selectedLab) return;
    setIsProcessingPayment(true);
    try {
      let parsedDate = new Date(bookingDate);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }
      const scheduledDateStr = parsedDate.toISOString().slice(0, 10);

      const initResult = await initiatePaymentApi({
        providerProfileId: selectedLab.id,
        appointmentType: 'LAB_TEST',
        scheduledDate: scheduledDateStr,
        scheduledTime: bookingTime,
        patientNotes: 'Lab Test: ' + testName + ' paid via ' + selectedPaymentMethod
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
          `Your laboratory test request has been confirmed for ${bookingDate} at ${bookingTime}.`,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0fdf4' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingHorizontal: 20, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#a7f3d0',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#10b981', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
        elevation: 3,marginTop:-36,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={{ width: 38, height: 38, resizeMode: 'contain', marginRight: 10, marginTop: 28 }}
          />
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3, marginTop: 28 }}>
              DIAGNOSTICS <Text style={{ color: '#0ea5e9', fontWeight: '700' }}>LABS</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Accredited Clinical Testing
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/patient/profile')}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#0ea5e9',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,marginTop:28,
          }}
        >
          <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '900' }}>
            {getSession().name ? getSession().name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'P'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Region Filter */}
      <View style={{ paddingVertical: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          canCancelContentTouches={true}
          scrollEventThrottle={16}
          directionalLockEnabled={true}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
        >
          {(['All', 'Noida', 'Ghaziabad'] as const).map((region) => {
            const isActive = selectedRegion === region;
            return (
              <TouchableOpacity
                key={region}
                activeOpacity={0.7}
                onPress={() => setSelectedRegion(region)}
                style={{
                  flexShrink: 0,
                  marginRight: 8,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                  backgroundColor: isActive ? '#d1fae5' : '#ffffff',
                  borderColor: isActive ? '#34d399' : '#e2e8f0',
                  shadowColor: '#10b981', shadowOpacity: isActive ? 0.1 : 0.04, shadowRadius: 4, elevation: isActive ? 2 : 1,
                }}
              >
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: isActive ? '#065f46' : '#64748b' }}>
                  {region === 'All' ? 'All Locations' : region}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lab List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
          {filteredLabs.length} Diagnostic Labs
        </Text>

        {filteredLabs.map((lab) => (
          <View key={lab.id} style={{
            backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1fae5',
            borderRadius: 20, padding: 18, marginBottom: 14,
            shadowColor: '#10b981', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
              <Image source={{ uri: lab.avatar }} style={{ width: 54, height: 54, borderRadius: 27, marginRight: 14, borderWidth: 2, borderColor: '#a7f3d0' }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14, marginBottom: 4 }}>{lab.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <StarIcon size={8} color="#f59e0b" />
                  <Text style={{ color: '#78716c', fontSize: 10, fontWeight: '700' }}>{lab.rating} • {lab.distance}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <PinIcon size={10} color="#94a3b8" />
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>{lab.location}</Text>
                </View>
              </View>
            </View>

            {/* Service Tags - emerald green for labs */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {lab.services.map((service, index) => (
                <View key={index} style={{ backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#059669', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>{service}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => handleBook(lab)}
              style={{ backgroundColor: '#10b981', paddingVertical: 13, borderRadius: 14, alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>Request Diagnostics Test</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Booking Modal */}
      {selectedLab && (
        <Modal visible={bookingModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' }}>
            <View style={{
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#a7f3d0',
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              paddingTop: 20,
              paddingHorizontal: 24,
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 24,
              maxHeight: '90%',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 20,
              position: 'relative'
            }}>
              {/* Close X Button */}
              <TouchableOpacity
                onPress={() => setBookingModalVisible(false)}
                style={{ position: 'absolute', top: 18, right: 18, zIndex: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 6 }}>
                <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 18 }} />
                <View style={{ alignItems: 'center', marginBottom: 18 }}>
                  <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>Diagnostics Booking</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Configure test, date, time, and fee</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#a7f3d0', padding: 14, borderRadius: 16, marginBottom: 16, gap: 12 }}>
                  <Image source={{ uri: selectedLab.avatar }} style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#34d399' }} />
                  <View>
                    <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 13 }}>{selectedLab.name}</Text>
                    <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600' }}>{selectedLab.location}</Text>
                  </View>
                </View>

                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Select Diagnostic Test</Text>
                <TextInput
                  value={testName}
                  onChangeText={setTestName}
                  placeholder="e.g. Complete Blood Count, Liver Function, Lipid Panel..."
                  placeholderTextColor="#94a3b8"
                  style={{ backgroundColor: '#f0fdf4', color: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#a7f3d0', fontWeight: '600', marginBottom: 14, fontSize: 13 }}
                />

                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Preferred Date</Text>
                <TextInput
                  value={bookingDate}
                  onChangeText={setBookingDate}
                  placeholder="e.g. 30 May, 2026"
                  placeholderTextColor="#94a3b8"
                  style={{ backgroundColor: '#f0fdf4', color: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#a7f3d0', fontWeight: '600', marginBottom: 14, fontSize: 13 }}
                />

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Preferred Time</Text>
                    <TextInput
                      value={bookingTime}
                      onChangeText={setBookingTime}
                      placeholder="e.g. 09:00 AM"
                      placeholderTextColor="#94a3b8"
                      style={{ backgroundColor: '#f0fdf4', color: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#a7f3d0', fontWeight: '600', fontSize: 13 }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Fee (₹)</Text>
                    <TextInput
                      value={fee}
                      onChangeText={setFee}
                      placeholder="e.g. 450"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      style={{ backgroundColor: '#f0fdf4', color: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#a7f3d0', fontWeight: '600', fontSize: 13 }}
                    />
                  </View>
                </View>

                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Payment Mode</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                  {(['Online', 'Onsite'] as const).map((opt) => {
                    const isOptSelected = paymentOption === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => setPaymentOption(opt)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 12,
                          borderWidth: 1.5,
                          alignItems: 'center',
                          backgroundColor: isOptSelected ? '#ecfdf5' : '#ffffff',
                          borderColor: isOptSelected ? '#a7f3d0' : '#e2e8f0',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: isOptSelected ? '#059669' : '#64748b' }}>
                          {opt === 'Online' ? '💳 Pay Online' : '🏥 Pay Onsite'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  onPress={confirmBooking}
                  style={{ backgroundColor: '#10b981', paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginBottom: 10, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Book Lab Test</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setBookingModalVisible(false)}
                  style={{ borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', paddingVertical: 13, borderRadius: 16, alignItems: 'center' }}
                >
                  <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 12 }}>Cancel & Go Back</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Secure Checkout Modal */}
      {selectedLab && (
        <Modal visible={checkoutModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' }}>
            <View style={{
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#bae6fd',
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              paddingTop: 20,
              paddingHorizontal: 24,
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 24,
              maxHeight: '90%',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 20,
              position: 'relative'
            }}>
              {/* Close X Button */}
              <TouchableOpacity
                onPress={() => setCheckoutModalVisible(false)}
                disabled={isProcessingPayment}
                style={{ position: 'absolute', top: 18, right: 18, zIndex: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 6 }}>
                <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 18 }} />
                
                <View style={{ alignItems: 'center', marginBottom: 18 }}>
                  <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>🔒 Secure Checkout</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Complete your transaction safely</Text>
                </View>

                {/* Order Summary Card */}
                <View style={{ backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', padding: 16, borderRadius: 20, marginBottom: 18 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Booking Summary</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 13 }}>{selectedLab.name} ({testName})</Text>
                    <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 13 }}>₹{fee}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#bae6fd', paddingTop: 8, marginTop: 4 }}>
                    <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 14 }}>Total Amount</Text>
                    <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 16 }}>₹{fee}</Text>
                  </View>
                </View>

                {/* Payment Methods */}
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Select Payment Method</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
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
                  <View style={{ marginBottom: 18 }}>
                    <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>UPI ID</Text>
                    <TextInput
                      placeholder="e.g. mobile@ybl or name@okaxis"
                      placeholderTextColor="#94a3b8"
                      defaultValue="9876543210@paytm"
                      style={{ backgroundColor: '#f8fafc', color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, fontWeight: '600' }}
                    />
                  </View>
                )}

                {selectedPaymentMethod === 'Card' && (
                  <View style={{ marginBottom: 18, gap: 10 }}>
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
                  <View style={{ marginBottom: 18 }}>
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
                    backgroundColor: '#10b981', paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginBottom: 10,
                    shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                    flexDirection: 'row', justifyContent: 'center', gap: 8
                  }}
                >
                  {isProcessingPayment ? (
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Processing transaction...</Text>
                  ) : (
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Pay Now (₹{fee})</Text>
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
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
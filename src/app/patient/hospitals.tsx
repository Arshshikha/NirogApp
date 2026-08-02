import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { addBooking, refreshBookings } from '../../utils/bookingStore';
import { getSession } from '../../utils/authStore';
import { initiatePaymentApi, confirmPaymentApi, getPaymentStatusApi } from '../../utils/paymentStore';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '../../utils/api';
import { getProviders, subscribeProviders, RegisteredProvider } from '../../utils/providerStore';

// Star icon (no emoji)
const StarIcon = ({ size = 9, color = '#f59e0b' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '45deg' }] }} />
);

// Location pin icon (no emoji)
const PinIcon = ({ size = 10, color = '#94a3b8' }: { size?: number; color?: string }) => (
  <View style={{ width: size * 0.7, height: size, alignItems: 'center' }}>
    <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, borderWidth: 1.5, borderColor: color }} />
    <View style={{ width: 1.5, height: size * 0.35, backgroundColor: color, marginTop: -1 }} />
  </View>
);

// Plus cross icon for hospital
const CrossIcon = ({ size = 12, color = '#0369a1' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', width: size, height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ position: 'absolute', width: 2, height: size, backgroundColor: color, borderRadius: 1 }} />
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

export default function HospitalsScreen() {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<RegisteredProvider | null>(null);
  const [department, setDepartment] = useState('Emergency');
  const [bookingDate, setBookingDate] = useState('29 May, 2026');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [fee, setFee] = useState('500');

  // Checkout Modal State
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [paymentOption, setPaymentOption] = useState<'Online' | 'Onsite'>('Online');

  const [hospitalsList, setHospitalsList] = useState<RegisteredProvider[]>(() => getProviders().filter(p => p.type === 'Hospital'));

  useEffect(() => {
    const update = () => setHospitalsList(getProviders().filter(p => p.type === 'Hospital'));
    const unsubscribe = subscribeProviders(update);
    return () => unsubscribe();
  }, []);

  const filteredHospitals = hospitalsList.filter(h => {
    if (selectedRegion === 'All') return true;
    return h.location.toLowerCase().includes(selectedRegion.toLowerCase());
  });

  const handleBook = (hospital: RegisteredProvider) => {
    setSelectedHospital(hospital);
    setBookingModalVisible(true);
  };

  const confirmBooking = async () => {
    if (!selectedHospital) return;
    if (paymentOption === 'Onsite') {
      try {
        let parsedDate = new Date(bookingDate);
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date();
        }
        const scheduledDateStr = parsedDate.toISOString().slice(0, 10);

        await initiatePaymentApi({
          providerProfileId: selectedHospital.id,
          appointmentType: 'HOSPITAL_VISIT',
          scheduledDate: scheduledDateStr,
          scheduledTime: bookingTime,
          patientNotes: 'Hospital Visit: ' + department + ' paid onsite',
          payOnsite: true
        });

        refreshBookings();
        setBookingModalVisible(false);
        Alert.alert(
          'Appointment Booked Successfully!',
          `Your hospital visit has been scheduled for ${bookingDate} at ${bookingTime}. Please pay ₹${fee} onsite at the reception desk.`,
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
    if (!selectedHospital) return;
    setIsProcessingPayment(true);
    try {
      let parsedDate = new Date(bookingDate);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }
      const scheduledDateStr = parsedDate.toISOString().slice(0, 10);

      const initResult = await initiatePaymentApi({
        providerProfileId: selectedHospital.id,
        appointmentType: 'HOSPITAL_VISIT',
        scheduledDate: scheduledDateStr,
        scheduledTime: bookingTime,
        patientNotes: 'Hospital Visit: ' + department + ' paid via ' + selectedPaymentMethod
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
          `Your hospital appointment has been confirmed for ${bookingDate} at ${bookingTime}.`,
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
            shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,marginTop:28,
          }}>
            <CrossIcon size={16} color="#ffffff" />
          </View>
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3 , marginTop:28}}>
              PROVIDER <Text style={{ color: '#10b981', fontWeight: '700' }}>HOSPITALS</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Accredited Medical Wings
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/patient/profile')}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#0ea5e9',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1, marginTop: 28,
          }}
        >
          <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '900' }}>
            {getSession().name ? getSession().name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'P'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Region Filter */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 8 }}>
        {(['All', 'Noida', 'Ghaziabad'] as const).map((region) => {
          const isActive = selectedRegion === region;
          return (
            <TouchableOpacity
              key={region}
              onPress={() => setSelectedRegion(region)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                backgroundColor: isActive ? '#e0f2fe' : '#ffffff',
                borderColor: isActive ? '#38bdf8' : '#e2e8f0',
                shadowColor: '#0ea5e9', shadowOpacity: isActive ? 0.1 : 0.04, shadowRadius: 4, elevation: isActive ? 2 : 1,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? '#0369a1' : '#64748b' }}>
                {region === 'All' ? 'All Locations' : region}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hospital List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
          {filteredHospitals.length} Provider Hospitals
        </Text>

        {filteredHospitals.map((hospital) => (
          <View key={hospital.id} style={{
            backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
            borderRadius: 20, padding: 18, marginBottom: 14,
            shadowColor: '#0ea5e9', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
              <Image source={{ uri: hospital.avatar }} style={{ width: 54, height: 54, borderRadius: 27, marginRight: 14, borderWidth: 2, borderColor: '#bae6fd' }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14, marginBottom: 4 }}>{hospital.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <StarIcon size={8} color="#f59e0b" />
                  <Text style={{ color: '#78716c', fontSize: 10, fontWeight: '700' }}>{hospital.rating} • {hospital.distance}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <PinIcon size={10} color="#94a3b8" />
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>{hospital.location}</Text>
                </View>
              </View>
            </View>

            {/* Service Tags */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {hospital.services.map((service, index) => (
                <View key={index} style={{ backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#0369a1', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>{service}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => handleBook(hospital)}
              style={{ backgroundColor: '#0ea5e9', paddingVertical: 13, borderRadius: 14, alignItems: 'center', shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>Book Hospital Visit</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Booking Modal */}
      {selectedHospital && (
        <Modal visible={bookingModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' }}>
            <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#bae6fd', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>Hospital Visit Booking</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>Configure department, date, time, and fee</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', padding: 14, borderRadius: 16, marginBottom: 16, gap: 12 }}>
                <Image source={{ uri: selectedHospital.avatar }} style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#7dd3fc' }} />
                <View>
                  <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 13 }}>{selectedHospital.name}</Text>
                  <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600' }}>{selectedHospital.location}</Text>
                </View>
              </View>

              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Select Medical Wing</Text>
              <TextInput
                value={department}
                onChangeText={setDepartment}
                placeholder="e.g. Cardiology, Orthopedics, Pediatrics..."
                placeholderTextColor="#94a3b8"
                style={{ backgroundColor: '#f0f9ff', color: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#bae6fd', fontWeight: '600', marginBottom: 14, fontSize: 13 }}
              />

              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Preferred Date</Text>
              <TextInput
                value={bookingDate}
                onChangeText={setBookingDate}
                placeholder="e.g. 29 May, 2026"
                placeholderTextColor="#94a3b8"
                style={{ backgroundColor: '#f0f9ff', color: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#bae6fd', fontWeight: '600', marginBottom: 14, fontSize: 13 }}
              />

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Preferred Time</Text>
                  <TextInput
                    value={bookingTime}
                    onChangeText={setBookingTime}
                    placeholder="e.g. 10:30 AM"
                    placeholderTextColor="#94a3b8"
                    style={{ backgroundColor: '#f0f9ff', color: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#bae6fd', fontWeight: '600', fontSize: 13 }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Fee (₹)</Text>
                  <TextInput
                    value={fee}
                    onChangeText={setFee}
                    placeholder="e.g. 500"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    style={{ backgroundColor: '#f0f9ff', color: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#bae6fd', fontWeight: '600', fontSize: 13 }}
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
                        backgroundColor: isOptSelected ? '#e0f2fe' : '#ffffff',
                        borderColor: isOptSelected ? '#0ea5e9' : '#e2e8f0',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: isOptSelected ? '#0369a1' : '#64748b' }}>
                        {opt === 'Online' ? '💳 Pay Online' : '🏥 Pay Onsite'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={confirmBooking}
                style={{ backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 10, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Send Booking Request</Text>
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
      {selectedHospital && (
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
                  <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 13 }}>{selectedHospital.name} ({department})</Text>
                  <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 13 }}>₹{fee}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#bae6fd', paddingTop: 8, marginTop: 4 }}>
                  <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 14 }}>Total Amount</Text>
                  <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 16 }}>₹{fee}</Text>
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
                    defaultValue="9876543210@paytm"
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
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
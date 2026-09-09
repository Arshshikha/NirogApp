import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { mockDoctors, mockProviders } from '../../constants/mockData';
import { getMessages, sendMessage, subscribe, startLiveChatPolling, stopLiveChatPolling } from '../../utils/chatStore';
import { getDoctors, subscribeDoctors, RegisteredDoctor } from '../../utils/doctorStore';
import { getProviders, subscribeProviders } from '../../utils/providerStore';
import { getSession } from '../../utils/authStore';

// Double ticks component
const MessageTicks = ({ isDelivered, isPending }: { isDelivered?: boolean; isPending?: boolean }) => {
  if (isPending) {
    return <Ionicons name="checkmark" size={13} color="#93c5fd" />;
  }
  return <Ionicons name="checkmark-done" size={14} color="#67e8f9" />;
};

export default function PatientChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const doctorId = params.doctorId as string;
  const providerId = params.providerId as string;

  const [doctorsList, setDoctorsList] = useState<RegisteredDoctor[]>(() => getDoctors());
  const [providersList, setProvidersList] = useState(() => getProviders());

  useEffect(() => {
    const updateD = () => setDoctorsList(getDoctors());
    const unsubscribeD = subscribeDoctors(updateD);

    const updateP = () => setProvidersList(getProviders());
    const unsubscribeP = subscribeProviders(updateP);

    return () => {
      unsubscribeD();
      unsubscribeP();
    };
  }, []);

  const doctor = doctorId ? (doctorsList.find((d) => d.id === doctorId) || mockDoctors.find((d) => d.id === doctorId)) : null;
  const provider = providerId ? (providersList.find((p) => p.id === providerId) || mockProviders.find((p) => p.id === providerId)) : null;

  const session = getSession();

  const chatTargetId = providerId || doctorId || 'd1';
  const chatTargetName = provider ? provider.name : (doctor?.name || 'Healthcare Provider');
  const chatTargetAvatar = provider ? provider.avatar : (doctor?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200');
  const chatTargetSubtitle = provider ? `${provider.type} Provider` : `${doctor?.specialty || 'General'} • ${doctor?.category || 'Healthcare'}`;

  const [messages, setMessages] = useState(() => getMessages(chatTargetId));
  const [inputText, setInputText] = useState('');
  const [isSendingFile, setIsSendingFile] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Start real-time live polling (every 2.5s)
    startLiveChatPolling(chatTargetId);

    const unsubscribe = subscribe(() => {
      setMessages(getMessages(chatTargetId));
    });
    return () => {
      stopLiveChatPolling();
      unsubscribe();
    };
  }, [chatTargetId]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  if (!doctor && !provider) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 12, color: '#64748b', fontWeight: '600', fontSize: 13 }}>Loading consultation...</Text>
      </SafeAreaView>
    );
  }

  const isAyur = doctor?.category === 'Ayurveda' || provider?.type === 'Lab';
  const primaryColor = isAyur ? '#059669' : '#0284c7';
  const primaryLight = isAyur ? '#ecfdf5' : '#f0f9ff';
  const primaryBorder = isAyur ? '#6ee7b7' : '#bae6fd';

  const handleSend = (textToSend = inputText, fileDetails?: { type: 'image' | 'pdf'; url: string; name: string }) => {
    const trimmed = (textToSend || '').trim();
    if (!trimmed && !fileDetails) return;
    if (!fileDetails) setInputText('');
    sendMessage(
      chatTargetId,
      session.id || 'patient_user',
      'patient',
      fileDetails ? `Attached: ${fileDetails.name}` : trimmed,
      session.name || 'Patient',
      fileDetails
    );
  };

  const handleAttachImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to share medical photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsSendingFile(true);
        handleSend('', {
          type: 'image',
          url: asset.uri,
          name: asset.fileName || 'patient_photo.jpg'
        });
        setIsSendingFile(false);
      }
    } catch (e: any) {
      setIsSendingFile(false);
      Alert.alert('Error', e.message || 'Failed to select image');
    }
  };

  const suggestions = provider
    ? ['What are the fasting guidelines?', 'When will my test report be ready?', 'Do you offer home sample collection?']
    : (isAyur
      ? ['Suggest herbs for digestion', 'How to balance Pitta dosha?', 'Diet recommendations for immunity']
      : ['Check blood pressure values', 'Early symptoms guidance', 'Prescription dosage clarification']);

  const canSend = inputText.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: primaryColor }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#f8fafc' }}>

        {/* ── Header ── */}
        <View style={{
          backgroundColor: primaryColor,
          paddingHorizontal: 16, paddingVertical: 12,
          flexDirection: 'row', alignItems: 'center',
          shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginRight: 10, padding: 6,
              borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)'
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>

          {/* Avatar with online dot */}
          <View style={{ position: 'relative', marginRight: 10 }}>
            <Image
              source={{ uri: chatTargetAvatar }}
              style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#ffffff' }}
            />
            <View style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 11, height: 11, borderRadius: 6,
              backgroundColor: '#10b981', borderWidth: 2, borderColor: '#ffffff'
            }} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>{chatTargetName}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600', marginTop: 1 }}>
              {chatTargetSubtitle}
            </Text>
          </View>

          {/* Fee badge or Provider Type */}
          <View style={{
            paddingHorizontal: 10, paddingVertical: 4,
            backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14,
          }}>
            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>
              {provider ? provider.type : `₹${doctor?.fee}`}
            </Text>
          </View>
        </View>

        {/* ── Message Feed ── */}
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          {/* Date divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            <View style={{
              paddingHorizontal: 12, paddingVertical: 4,
              backgroundColor: '#e2e8f0', borderRadius: 12, marginHorizontal: 8
            }}>
              <Text style={{ color: '#475569', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Encrypted Consultation
              </Text>
            </View>
            <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 24 }}>
                <View style={{
                  width: 60, height: 60, borderRadius: 30,
                  backgroundColor: primaryLight, alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <Ionicons name="chatbubbles-outline" size={28} color={primaryColor} />
                </View>
                <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14, textAlign: 'center' }}>
                  Consultation with {chatTargetName}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                  Ask questions, share symptoms, or send reports directly.
                </Text>
              </View>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === 'patient';
                const isPending = msg.id.startsWith('local_');

                return (
                  <View
                    key={msg.id}
                    style={{
                      marginBottom: 10,
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                    }}
                  >
                    {!isMe && (
                      <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', marginBottom: 2, marginLeft: 4 }}>
                        {msg.senderName}
                      </Text>
                    )}

                    <View style={{
                      paddingHorizontal: 14, paddingVertical: 9,
                      backgroundColor: isMe ? primaryColor : '#ffffff',
                      borderRadius: 18,
                      borderTopRightRadius: isMe ? 4 : 18,
                      borderTopLeftRadius: isMe ? 18 : 4,
                      borderWidth: isMe ? 0 : 1,
                      borderColor: '#e2e8f0',
                      shadowColor: '#000',
                      shadowOpacity: isMe ? 0.12 : 0.04,
                      shadowRadius: 4, elevation: 1,
                    }}>
                      {/* Image attachment if any */}
                      {msg.fileUrl && (
                        <View style={{ marginBottom: 6, borderRadius: 12, overflow: 'hidden' }}>
                          <Image
                            source={{ uri: msg.fileUrl }}
                            style={{ width: 200, height: 140, backgroundColor: '#e2e8f0' }}
                            resizeMode="cover"
                          />
                        </View>
                      )}

                      {/* Message Text */}
                      {Boolean(msg.text) && (
                        <Text style={{
                          fontSize: 14, fontWeight: '500', lineHeight: 20,
                          color: isMe ? '#ffffff' : '#0f172a',
                        }}>
                          {msg.text}
                        </Text>
                      )}

                      {/* Timestamp & Status ticks */}
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
                        gap: 4, marginTop: 4, alignSelf: 'flex-end'
                      }}>
                        <Text style={{
                          color: isMe ? 'rgba(255,255,255,0.75)' : '#94a3b8',
                          fontSize: 9, fontWeight: '600'
                        }}>
                          {msg.timestamp}
                        </Text>
                        {isMe && <MessageTicks isDelivered={!isPending} isPending={isPending} />}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* ── Quick Suggestion Chips ── */}
          <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
              {suggestions.map((sug, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSend(sug)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6,
                    backgroundColor: primaryLight, borderWidth: 1, borderColor: primaryBorder,
                    borderRadius: 14,
                  }}
                >
                  <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700' }}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── Input Panel ── */}
        <View style={{
          paddingHorizontal: 12, paddingVertical: 8,
          backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          {/* Attach button */}
          <TouchableOpacity
            onPress={handleAttachImage}
            disabled={isSendingFile}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: primaryLight, borderWidth: 1, borderColor: primaryBorder,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isSendingFile ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <Ionicons name="camera-outline" size={20} color={primaryColor} />
            )}
          </TouchableOpacity>

          {/* Text input */}
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            multiline
            style={{
              flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1',
              borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9,
              color: '#0f172a', fontWeight: '500', fontSize: 13,
              maxHeight: 100,
            }}
          />

          {/* Send button */}
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!canSend}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: canSend ? primaryColor : '#e2e8f0',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: canSend ? primaryColor : 'transparent',
              shadowOpacity: 0.3, shadowRadius: 4, elevation: canSend ? 2 : 0,
            }}
          >
            <Ionicons name="send" size={17} color={canSend ? '#ffffff' : '#94a3b8'} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getMessages, sendMessage, subscribe, startLiveChatPolling, stopLiveChatPolling } from '../../utils/chatStore';
import { getSession } from '../../utils/authStore';

// Double ticks component
const MessageTicks = ({ isDelivered, isPending }: { isDelivered?: boolean; isPending?: boolean }) => {
  if (isPending) {
    return <Ionicons name="checkmark" size={13} color="#93c5fd" />;
  }
  return <Ionicons name="checkmark-done" size={14} color="#67e8f9" />;
};

const CLINICAL_QUICK_RESPONSES = [
  'Please share your latest test reports.',
  'Prescription sent. Follow dosage as prescribed.',
  'Take medicines after food with warm water.',
  'Schedule a follow-up consultation in 3 days.',
];

export default function DoctorChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patientName = (params.patientName as string) || 'Patient';
  const patientId = (params.patientId as string) || '';

  const session = getSession();
  const doctorId = session.profileId || session.id || 'default_doctor';
  const safePatientId = patientId || (patientName ? `patient_${patientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'default_patient');
  
  const [messages, setMessages] = useState(() => getMessages(doctorId, safePatientId, patientName));
  const [inputText, setInputText] = useState('');
  const [isSendingFile, setIsSendingFile] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Start real-time live polling (every 2.5s)
    startLiveChatPolling(doctorId, safePatientId, patientName);

    const unsubscribe = subscribe(() => {
      setMessages(getMessages(doctorId, safePatientId, patientName));
    });
    return () => {
      stopLiveChatPolling();
      unsubscribe();
    };
  }, [doctorId, safePatientId, patientName]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  const handleSend = (textToSend = inputText, fileDetails?: { type: 'image' | 'pdf'; url: string; name: string }) => {
    const text = (textToSend || '').trim();
    if (!text && !fileDetails) return;
    if (!fileDetails) setInputText('');
    sendMessage(
      doctorId,
      safePatientId,
      'doctor',
      fileDetails ? `Attached: ${fileDetails.name}` : text,
      session.name || 'Doctor',
      fileDetails
    );
  };

  const handleAttachImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll access is needed to send medical attachments.');
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
          name: asset.fileName || 'medical_attachment.jpg'
        });
        setIsSendingFile(false);
      }
    } catch (e: any) {
      setIsSendingFile(false);
      Alert.alert('Error', e.message || 'Failed to select attachment');
    }
  };

  const canSend = inputText.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0284c7' }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#f0f9ff' }}
      >
        {/* Header */}
        <View style={{
          backgroundColor: '#0284c7',
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

          {/* Patient avatar */}
          <View style={{ position: 'relative', marginRight: 10 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center',
              borderWidth: 1.5, borderColor: '#ffffff'
            }}>
              <Text style={{ color: '#0284c7', fontWeight: '900', fontSize: 15 }}>
                {patientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </Text>
            </View>
            <View style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 11, height: 11, borderRadius: 6,
              backgroundColor: '#10b981', borderWidth: 2, borderColor: '#ffffff'
            }} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>{patientName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' }} />
              <Text style={{ color: '#e0f2fe', fontSize: 10, fontWeight: '600' }}>Live Consultation Sync</Text>
            </View>
          </View>

          <View style={{
            paddingHorizontal: 10, paddingVertical: 4,
            backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14,
          }}>
            <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>DOCTOR</Text>
          </View>
        </View>

        {/* Chat Feed */}
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          {/* Consultation Date Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            <View style={{
              paddingHorizontal: 12, paddingVertical: 4,
              backgroundColor: '#e2e8f0', borderRadius: 12, marginHorizontal: 8
            }}>
              <Text style={{ color: '#475569', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Secure Clinical Chat
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
                  backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <Ionicons name="chatbubbles-outline" size={28} color="#0284c7" />
                </View>
                <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14, textAlign: 'center' }}>
                  Begin Clinical Consultation with {patientName}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                  Messages are encrypted and synchronized in real-time.
                </Text>
              </View>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === 'doctor';
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
                      backgroundColor: isMe ? '#0284c7' : '#ffffff',
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

                      {/* Text content */}
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
                          color: isMe ? '#bae6fd' : '#94a3b8',
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

          {/* Quick Clinical Responses */}
          <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 6 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
              {CLINICAL_QUICK_RESPONSES.map((resp, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSend(resp)}
                  style={{
                    backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd',
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14
                  }}
                >
                  <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '600' }}>{resp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Input Panel */}
        <View style={{
          paddingHorizontal: 12, paddingVertical: 8,
          backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          {/* Attach Image/Photo Button */}
          <TouchableOpacity
            onPress={handleAttachImage}
            disabled={isSendingFile}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isSendingFile ? (
              <ActivityIndicator size="small" color="#0284c7" />
            ) : (
              <Ionicons name="camera-outline" size={20} color="#0284c7" />
            )}
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            placeholder="Type clinical consultation message..."
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

          {/* Send Button */}
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!canSend}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: canSend ? '#0284c7' : '#e2e8f0',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: canSend ? '#0284c7' : 'transparent',
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
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mockDoctors, mockProviders } from '../../constants/mockData';
import { getMessages, sendMessage, subscribe } from '../../utils/chatStore';
import { getDoctors, subscribeDoctors, RegisteredDoctor } from '../../utils/doctorStore';
import { getProviders, subscribeProviders } from '../../utils/providerStore';
import { getSession } from '../../utils/authStore';

// ─── Icon Components (No Emojis) ─────────────────────────────────────────────

// Back arrow
const BackArrow = ({ color = '#0369a1' }: { color?: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
    <View style={{ width: 7, height: 7, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: color, transform: [{ rotate: '45deg' }] }} />
    <View style={{ width: 10, height: 2, backgroundColor: color, borderRadius: 1, marginLeft: -2 }} />
  </View>
);

// Send arrow icon
const SendIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 0, height: 0, borderTopWidth: 6, borderBottomWidth: 6, borderLeftWidth: 11, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color }} />
  </View>
);

// Paperclip icon
const ClipIcon = ({ color = '#64748b' }: { color?: string }) => (
  <View style={{ width: 14, height: 18, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 8, height: 14, borderRadius: 4,
      borderWidth: 2, borderColor: color, backgroundColor: 'transparent',
    }} />
    <View style={{
      position: 'absolute', bottom: 0,
      width: 12, height: 8, borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
      borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: 2, borderColor: color,
    }} />
  </View>
);

// Online dot
const OnlineDot = () => (
  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#ffffff' }} />
);

// Image icon (for attachments)
const ImgIcon = ({ color = '#0369a1' }: { color?: string }) => (
  <View style={{ width: 14, height: 12, borderWidth: 1.5, borderColor: color, borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', top: 2, left: 2 }} />
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, borderTopLeftRadius: 0, borderTopRightRadius: 0, overflow: 'hidden' }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color + '60', position: 'absolute', bottom: 0, left: 2 }} />
    </View>
  </View>
);

// PDF icon
const PdfIcon = ({ color = '#0369a1' }: { color?: string }) => (
  <View style={{ width: 12, height: 14, borderWidth: 1.5, borderColor: color, borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 7, height: 1.5, backgroundColor: color, borderRadius: 1, marginBottom: 2 }} />
    <View style={{ width: 7, height: 1.5, backgroundColor: color, borderRadius: 1, marginBottom: 2 }} />
    <View style={{ width: 4, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const chatTargetSubtitle = provider ? `${provider.type} Provider` : `${doctor?.specialty} • ${doctor?.category}`;

  const [messages, setMessages] = useState(() => getMessages(chatTargetId));
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setMessages(getMessages(chatTargetId));
      // Simulate clinical partner "typing" indicator briefly
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1200);
    });
    return () => unsubscribe();
  }, [chatTargetId]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, isTyping]);

  if (!doctor && !provider) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={{ marginTop: 12, color: '#64748b', fontWeight: '600', fontSize: 13 }}>Loading conversation...</Text>
      </SafeAreaView>
    );
  }

  const isAyur = doctor?.category === 'Ayurveda' || provider?.type === 'Lab';
  const primaryColor = isAyur ? '#10b981' : '#0ea5e9';
  const primaryDark = isAyur ? '#059669' : '#0369a1';
  const primaryLight = isAyur ? '#ecfdf5' : '#e0f2fe';
  const primaryBorder = isAyur ? '#a7f3d0' : '#7dd3fc';

  const handleSend = (textToSend = inputText, fileDetails?: { type: 'image' | 'pdf'; url: string; name: string }) => {
    const trimmed = textToSend.trim();
    if (!trimmed && !fileDetails) return;
    sendMessage(
      chatTargetId,
      session.id || 'patient_john_doe',
      'patient',
      fileDetails ? `Attached: ${fileDetails.name}` : trimmed,
      session.name || 'John Doe',
      fileDetails
    );
    if (!fileDetails) setInputText('');
  };

  const handleAttachFile = () => {
    Alert.alert(
      'Attach File',
      `Select a document format to share with ${provider ? 'the provider' : 'the doctor'}:`,
      [
        {
          text: 'Take Medical Photo',
          onPress: () => handleSend('', {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300',
            name: 'skin_patch_photo.jpg',
          }),
        },
        {
          text: 'Upload Lab Report (PDF)',
          onPress: () => handleSend('', { type: 'pdf', url: 'dummy_url', name: 'cbc_blood_report.pdf' }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const suggestions = provider
    ? ['What are the fasting guidelines?', 'When will my test report be ready?', 'Do you support home sample collection?']
    : (isAyur
      ? ['Suggest herbs for digestion', 'How to balance Pitta dosha?', 'Diet for immunity']
      : ['Check blood pressure values', 'Early cardiac symptoms?', 'Cardio exercises list']);

  const canSend = inputText.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={{
          backgroundColor: '#ffffff',
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: primaryBorder,
          flexDirection: 'row', alignItems: 'center',
          shadowColor: primaryColor, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginRight: 12, paddingHorizontal: 12, paddingVertical: 8,
              backgroundColor: primaryLight, borderWidth: 1, borderColor: primaryBorder,
              borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
          >
            <BackArrow color={primaryDark} />
            <Text style={{ color: primaryDark, fontWeight: '800', fontSize: 11 }}>Back</Text>
          </TouchableOpacity>

          {/* Avatar with online dot */}
          <View style={{ position: 'relative', marginRight: 12 }}>
            <Image
              source={{ uri: chatTargetAvatar }}
              style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: primaryBorder }}
            />
            <View style={{ position: 'absolute', bottom: 0, right: 0 }}>
              <OnlineDot />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '800' }}>{chatTargetName}</Text>
            <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '600', marginTop: 1 }}>
              {chatTargetSubtitle}
            </Text>
          </View>

          {/* Fee badge or Provider Type */}
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: primaryLight, borderRadius: 20, borderWidth: 1, borderColor: primaryBorder }}>
            <Text style={{ color: primaryDark, fontSize: 10, fontWeight: '800' }}>
              {provider ? provider.type : `₹${doctor?.fee}`}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, backgroundColor: '#f0f9ff' }}>
          {/* ── Date divider ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e0f2fe' }} />
          <View style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#e0f2fe', borderRadius: 20, marginHorizontal: 10 }}>
            <Text style={{ color: '#0369a1', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Today</Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e0f2fe' }} />
        </View>

        {/* ── Message Feed ── */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isMe = msg.sender === 'patient';
            return (
              <View
                key={msg.id}
                style={{
                  marginBottom: 14,
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '78%',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Sender name for doctor */}
                {!isMe && (
                  <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', marginBottom: 4, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {msg.senderName}
                  </Text>
                )}

                {/* Bubble */}
                <View style={{
                  paddingHorizontal: 14, paddingVertical: 10,
                  backgroundColor: isMe ? primaryColor : '#ffffff',
                  borderRadius: 20,
                  borderBottomRightRadius: isMe ? 4 : 20,
                  borderBottomLeftRadius: isMe ? 20 : 4,
                  borderWidth: isMe ? 0 : 1,
                  borderColor: '#e0f2fe',
                  shadowColor: isMe ? primaryColor : '#0ea5e9',
                  shadowOpacity: isMe ? 0.2 : 0.05,
                  shadowRadius: 6, elevation: isMe ? 3 : 1,
                }}>
                  <Text style={{
                    fontSize: 13, fontWeight: '500', lineHeight: 20,
                    color: isMe ? '#ffffff' : '#0f172a',
                  }}>
                    {msg.text}
                  </Text>

                  {/* Attachment pill */}
                  {msg.fileUrl && (
                    <View style={{
                      marginTop: 8, paddingHorizontal: 10, paddingVertical: 6,
                      backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : primaryLight,
                      borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
                      borderWidth: 1, borderColor: isMe ? 'rgba(255,255,255,0.3)' : primaryBorder,
                    }}>
                      {msg.fileType === 'image'
                        ? <ImgIcon color={isMe ? '#ffffff' : primaryDark} />
                        : <PdfIcon color={isMe ? '#ffffff' : primaryDark} />
                      }
                      <Text style={{ color: isMe ? '#ffffff' : primaryDark, fontSize: 10, fontWeight: '700' }}>
                        {msg.fileType === 'image' ? 'Photo Attached' : 'PDF Report'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Timestamp */}
                <Text style={{
                  color: '#94a3b8', fontSize: 9, fontWeight: '600',
                  marginTop: 3, marginLeft: isMe ? 0 : 4, marginRight: isMe ? 4 : 0,
                }}>
                  {msg.timestamp}
                </Text>
              </View>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <View style={{ alignSelf: 'flex-start', marginBottom: 14, maxWidth: '50%' }}>
              <View style={{
                paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff',
                borderRadius: 20, borderBottomLeftRadius: 4,
                borderWidth: 1, borderColor: '#e0f2fe',
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: primaryColor, opacity: 0.5 + i * 0.25 }} />
                ))}
              </View>
              <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '600', marginTop: 3, marginLeft: 4 }}>
                {chatTargetName.split(' ')[0]} is typing...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ── Quick Suggestion Chips ── */}
        <View style={{ backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e0f2fe', paddingVertical: 10, paddingHorizontal: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {suggestions.map((sug, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSend(sug)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7,
                    backgroundColor: primaryLight, borderWidth: 1, borderColor: primaryBorder,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: primaryDark, fontSize: 11, fontWeight: '700' }}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        </View>

        {/* ── Input Panel ── */}
        <View style={{
          paddingHorizontal: 12, paddingVertical: 10,
          backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e0f2fe',
          flexDirection: 'row', alignItems: 'flex-end', gap: 8,
        }}>
          {/* Attach button */}
          <TouchableOpacity
            onPress={handleAttachFile}
            style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ClipIcon color="#64748b" />
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
              flex: 1, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd',
              borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
              color: '#0f172a', fontWeight: '500', fontSize: 13,
              maxHeight: 100,
            }}
          />

          {/* Send button */}
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!canSend}
            style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: canSend ? primaryColor : '#e2e8f0',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: canSend ? primaryColor : 'transparent',
              shadowOpacity: 0.3, shadowRadius: 6, elevation: canSend ? 3 : 0,
            }}
          >
            <SendIcon color={canSend ? '#ffffff' : '#94a3b8'} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
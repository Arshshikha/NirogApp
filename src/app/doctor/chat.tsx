import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getMessages, sendMessage, subscribe } from '../../utils/chatStore';
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

// Online status indicator
const StatusDot = () => (
  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#ffffff' }} />
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DoctorChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patientName = (params.patientName as string) || 'John Doe';
  const patientId = (params.patientId as string) || '';

  const session = getSession();
  const doctorId = session.profileId || '';
  
  const [messages, setMessages] = useState(() => getMessages(doctorId, patientId, patientName));
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setMessages(getMessages(doctorId, patientId, patientName));
    });
    return () => unsubscribe();
  }, [doctorId, patientId, patientName]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(doctorId, patientId, 'doctor', inputText.trim(), session.name);
    setInputText('');
  };

  const handleAttachFile = () => {
    Alert.alert(
      'Attach File',
      'Select a clinical document or report to share:',
      [
        { text: 'Prescription PDF', onPress: () => Alert.alert('Sent', 'Prescription attached successfully.') },
        { text: 'Lab Investigation Request', onPress: () => Alert.alert('Sent', 'Lab request sent.') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const canSend = inputText.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{
          backgroundColor: '#ffffff',
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: '#bae6fd',
          flexDirection: 'row', alignItems: 'center',
          shadowColor: '#0ea5e9', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginRight: 12, paddingHorizontal: 12, paddingVertical: 8,
              backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc',
              borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
          >
            <BackArrow color="#0369a1" />
            <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 11 }}>Back</Text>
          </TouchableOpacity>

          {/* Patient avatar placeholder */}
          <View style={{ position: 'relative', marginRight: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0f2fe', borderWidth: 2, borderColor: '#7dd3fc', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#0369a1', fontWeight: '900', fontSize: 16 }}>
                {patientName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={{ position: 'absolute', bottom: 0, right: 0 }}>
              <StatusDot />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '800' }}>{patientName}</Text>
            <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700', marginTop: 1 }}>
              Active Patient Consultation
            </Text>
          </View>

          <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#ecfdf5', borderRadius: 20, borderWidth: 1, borderColor: '#a7f3d0' }}>
            <Text style={{ color: '#059669', fontSize: 10, fontWeight: '800' }}>ONLINE</Text>
          </View>
        </View>

        <View style={{ flex: 1, backgroundColor: '#f0f9ff' }}>
          {/* Date Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e0f2fe' }} />
          <View style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#e0f2fe', borderRadius: 20, marginHorizontal: 10 }}>
            <Text style={{ color: '#0369a1', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Consultation Log</Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e0f2fe' }} />
        </View>

        {/* Message Feed */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isMe = msg.sender === 'doctor';
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
                {/* Sender label (only for incoming) */}
                {!isMe && (
                  <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', marginBottom: 4, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {msg.senderName}
                  </Text>
                )}

                {/* Message bubble */}
                <View style={{
                  paddingHorizontal: 14, paddingVertical: 10,
                  backgroundColor: isMe ? '#0ea5e9' : '#ffffff',
                  borderRadius: 20,
                  borderBottomRightRadius: isMe ? 4 : 20,
                  borderBottomLeftRadius: isMe ? 20 : 4,
                  borderWidth: isMe ? 0 : 1,
                  borderColor: '#e0f2fe',
                  shadowColor: isMe ? '#0ea5e9' : '#0ea5e9',
                  shadowOpacity: isMe ? 0.2 : 0.05,
                  shadowRadius: 6, elevation: isMe ? 3 : 1,
                }}>
                  <Text style={{
                    fontSize: 13, fontWeight: '500', lineHeight: 20,
                    color: isMe ? '#ffffff' : '#0f172a',
                  }}>
                    {msg.text}
                  </Text>
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
        </ScrollView>
        </View>

        {/* Input Panel */}
        <View style={{
          paddingHorizontal: 12, paddingVertical: 10,
          backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e0f2fe',
          flexDirection: 'row', alignItems: 'flex-end', gap: 8,
        }}>
          {/* Attach Button */}
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

          {/* Text Input */}
          <TextInput
            placeholder="Type a clinical response..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            multiline
            style={{
              flex: 1, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd',
              borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
              color: '#0f172a', fontWeight: '500', fontSize: 13,
              maxHeight: 100,
            }}
          />

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: canSend ? '#0ea5e9' : '#e2e8f0',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: canSend ? '#0ea5e9' : 'transparent',
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
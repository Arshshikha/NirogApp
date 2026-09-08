import { Platform } from 'react-native';
import { apiGet, apiPost } from './api';
import { getSession } from './authStore';
import { getDoctors } from './doctorStore';
import { getBookings } from './bookingStore';
import { getProviders } from './providerStore';

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  text: string;
  timestamp: string;
  senderName: string;
  fileUrl?: string;
  fileType?: 'image' | 'pdf';
  fileName?: string;
}

let conversationsCache: Record<string, string> = {}; // maps cacheKey (doctorId_patientId) -> conversationId
let messagesCache: Record<string, ChatMessage[]> = {}; // maps conversationId -> messages
let listeners: (() => void)[] = [];
let activeFetches: Record<string, boolean> = {};

export interface ActiveChat {
  conversationId: string;
  patientId: string;
  patientName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  isDoctorSender?: boolean;
  lastMessageId?: string;
}

let activeChats: ActiveChat[] = [];
let chatListListeners: (() => void)[] = [];
let readMessagesCache: Record<string, string> = {};

export const isConversationUnread = (conversationId: string, lastMessageId?: string): boolean => {
  if (!lastMessageId) return false;
  return readMessagesCache[conversationId] !== lastMessageId;
};

export const markConversationAsRead = (doctorId: string, patientId?: string) => {
  const session = getSession();
  if (!session) return;
  const actualPatientId = (session.role === 'Doctor' || session.role === 'Provider') ? patientId : (patientId || session.id);
  if (!actualPatientId) return;

  const cacheKey = `${doctorId}_${actualPatientId}`;
  const conversationId = conversationsCache[cacheKey];
  if (conversationId) {
    const list = messagesCache[conversationId];
    if (list && list.length > 0) {
      const lastMsg = list[list.length - 1];
      if (lastMsg.id) {
        readMessagesCache[conversationId] = lastMsg.id;
      }
    } else {
      // If no messages or loaded list yet, check activeChats to find lastMessageId
      const chat = activeChats.find(c => c.conversationId === conversationId);
      if (chat && chat.lastMessageId) {
        readMessagesCache[conversationId] = chat.lastMessageId;
      }
    }
    chatListListeners.forEach(fn => fn());
  }
};


const resolvePatientId = (session: any, patientId?: string, patientName?: string): string => {
  if (session?.role === 'Doctor' || session?.role === 'Provider') {
    if (patientId && patientId.trim() !== '') return patientId.trim();
    if (patientName && patientName.trim() !== '') {
      return `patient_${patientName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
    return 'default_patient';
  }
  return patientId || session?.id || 'default_patient';
};

const loadMessagesFromApi = async (doctorId: string, patientId?: string, patientName?: string) => {
  const session = getSession();
  if (!session || !session.id) return;

  const actualPatientId = resolvePatientId(session, patientId, patientName);
  const effectiveDoctorId = doctorId || session.profileId || session.id || 'default_doctor';

  let doctorUserId: string | undefined;
  if (session.role === 'Doctor' || session.role === 'Provider') {
    doctorUserId = session.id;
  } else {
    const doctors = getDoctors();
    const doctor = doctors.find(d => d.id === effectiveDoctorId);
    doctorUserId = doctor?.userId;
    if (!doctorUserId) {
      const bookings = getBookings();
      const booking = bookings.find(b => b.providerId === effectiveDoctorId);
      doctorUserId = booking?.providerUserId;
    }
    if (!doctorUserId) {
      const providers = getProviders();
      const provider = providers.find(p => p.id === effectiveDoctorId);
      doctorUserId = provider?.userId;
    }
    if (!doctorUserId && effectiveDoctorId.startsWith('p')) {
      doctorUserId = `mock_provider_user_id_${effectiveDoctorId}`;
    }
    if (!doctorUserId && effectiveDoctorId.startsWith('d')) {
      doctorUserId = `mock_doctor_user_id_${effectiveDoctorId}`;
    }
  }

  const cacheKey = `${effectiveDoctorId}_${actualPatientId}`;
  const fetchKey = `fetch_${cacheKey}`;
  if (activeFetches[fetchKey]) return;
  activeFetches[fetchKey] = true;

  try {
    // 1. Get or create conversation ID
    let conversationId = conversationsCache[cacheKey];
    if (!conversationId || conversationId.startsWith('conv_')) {
      const convRes = await apiPost('/chat/conversations', {
        patientId: actualPatientId,
        doctorUserId,
        doctorProfileId: effectiveDoctorId
      });
      if (convRes && convRes.id) {
        conversationId = convRes.id;
        conversationsCache[cacheKey] = conversationId;
      }
    }

    if (conversationId && !conversationId.startsWith('conv_')) {
      // 2. Fetch messages from database
      const dbMessages = await apiGet(`/chat/conversations/${conversationId}/messages`);
      if (dbMessages && Array.isArray(dbMessages)) {
        let docName = 'Healthcare Provider';
        if (session.role === 'Doctor' || session.role === 'Provider') {
          docName = session.name;
        } else {
          const doctors = getDoctors();
          const doctor = doctors.find(d => d.id === effectiveDoctorId);
          docName = doctor?.name || 'Healthcare Provider';
        }

        const remoteList: ChatMessage[] = dbMessages.map((m: any) => {
          const isPatient = m.senderType === 'PATIENT';
          const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            id: m.id,
            sender: isPatient ? 'patient' : 'doctor',
            text: m.body,
            timestamp: time,
            senderName: isPatient ? (session.role === 'Doctor' || session.role === 'Provider' ? (patientName || 'Patient') : session.name) : docName,
            fileUrl: m.attachments?.[0]?.file?.url || undefined,
            fileType: m.attachments?.[0]?.file?.mimeType?.includes('pdf') ? 'pdf' : 'image',
            fileName: m.attachments?.[0]?.file?.name || undefined
          };
        });

        // Retain optimistic local messages that haven't synced yet
        const currentList = messagesCache[conversationId] || [];
        const pendingLocal = currentList.filter(m => m.id.startsWith('local_'));
        
        messagesCache[conversationId] = [...remoteList, ...pendingLocal];
        listeners.forEach(fn => fn());
      }
    }
  } catch (e) {
    console.error('Failed to sync chat messages from backend', e);
  } finally {
    activeFetches[fetchKey] = false;
  }
};

export const getMessages = (doctorId: string, patientId?: string, patientName?: string): ChatMessage[] => {
  const session = getSession();
  if (!session) return [];

  const actualPatientId = resolvePatientId(session, patientId, patientName);
  const effectiveDoctorId = doctorId || session.profileId || session.id || 'default_doctor';
  const cacheKey = `${effectiveDoctorId}_${actualPatientId}`;
  
  // Trigger background load
  loadMessagesFromApi(effectiveDoctorId, actualPatientId, patientName);

  const conversationId = conversationsCache[cacheKey];
  if (conversationId && messagesCache[conversationId]) {
    const list = messagesCache[conversationId];
    if (list.length > 0) {
      const lastMsg = list[list.length - 1];
      if (lastMsg.id && !lastMsg.id.startsWith('local_')) {
        readMessagesCache[conversationId] = lastMsg.id;
      }
    }
    return list;
  }

  const fallbackKey = `conv_${cacheKey}`;
  if (messagesCache[fallbackKey]) {
    return messagesCache[fallbackKey];
  }

  return [];
};

export const sendMessage = async (
  doctorId: string,
  patientId: string,
  sender: 'patient' | 'doctor',
  text: string,
  senderName: string,
  fileDetails?: { type: 'image' | 'pdf'; url: string; name: string }
) => {
  const session = getSession();
  if (!session) return;

  const actualPatientId = resolvePatientId(session, patientId, sender === 'doctor' ? undefined : senderName);
  const effectiveDoctorId = doctorId || session.profileId || session.id || 'default_doctor';
  const cacheKey = `${effectiveDoctorId}_${actualPatientId}`;

  let conversationId = conversationsCache[cacheKey];
  if (!conversationId) {
    conversationId = `conv_${cacheKey}`;
    conversationsCache[cacheKey] = conversationId;
  }

  // 1. Optimistic local add (IMMEDIATE UI UPDATE)
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const localMsg: ChatMessage = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    sender,
    text,
    timestamp,
    senderName,
    fileUrl: fileDetails?.url,
    fileType: fileDetails?.type,
    fileName: fileDetails?.name
  };

  if (!messagesCache[conversationId]) {
    messagesCache[conversationId] = [];
  }
  messagesCache[conversationId] = [...messagesCache[conversationId], localMsg];
  listeners.forEach(fn => fn());

  // 2. Async backend sync
  try {
    let resolvedConvId = conversationId;
    if (resolvedConvId.startsWith('conv_')) {
      const convRes = await apiPost('/chat/conversations', {
        patientId: actualPatientId,
        doctorUserId: (session.role === 'Doctor' || session.role === 'Provider') ? session.id : undefined,
        doctorProfileId: effectiveDoctorId
      });
      if (convRes && convRes.id) {
        resolvedConvId = convRes.id;
        conversationsCache[cacheKey] = resolvedConvId;
        if (!messagesCache[resolvedConvId]) {
          messagesCache[resolvedConvId] = messagesCache[conversationId] || [];
        } else {
          const existingIds = new Set(messagesCache[resolvedConvId].map(m => m.id));
          const newOnes = (messagesCache[conversationId] || []).filter(m => !existingIds.has(m.id));
          messagesCache[resolvedConvId] = [...messagesCache[resolvedConvId], ...newOnes];
        }
      }
    }

    const body = {
      conversationId: resolvedConvId,
      senderId: session.id,
      senderType: sender.toUpperCase(),
      text
    };

    await apiPost('/chat/messages', body);
    loadMessagesFromApi(effectiveDoctorId, actualPatientId, sender === 'patient' ? senderName : undefined);
  } catch (e) {
    console.error('Failed to send message to backend', e);
  }
};

export const subscribe = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(fn => fn !== callback);
  };
};

export const loadConversationsFromApi = async () => {
  const session = getSession();
  if (!session || !session.id) return;

  try {
    const list = await apiGet(`/chat/conversations?userId=${session.id}`);
    if (list && Array.isArray(list)) {
      activeChats = list.map((c: any) => {
        const otherMember = c.members?.[0];
        const otherUser = otherMember?.user;
        const profile = otherUser?.profile;
        
        let name = 'Patient';
        if (profile) {
          name = `${profile.firstName} ${profile.lastName}`;
          if (otherUser.role === 'DOCTOR' && !name.startsWith('Dr.')) {
            name = `Dr. ${name}`;
          }
        } else if (otherUser) {
          name = otherUser.email;
        }

        const lastMsgObj = c.messages?.[0];
        let lastMsg = lastMsgObj?.body || undefined;
        let lastMsgTime = lastMsgObj 
          ? new Date(lastMsgObj.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : undefined;

        // Cache the mapping between Doctor/Provider and Patient
        if ((session.role === 'Doctor' || session.role === 'Provider') && session.profileId && otherUser?.id) {
          const cacheKey = `${session.profileId}_${otherUser.id}`;
          conversationsCache[cacheKey] = c.id;
        } else if (session.role === 'Patient' && otherUser?.id) {
          if (otherUser.role === 'DOCTOR') {
            const doctors = getDoctors();
            const doctor = doctors.find(d => d.userId === otherUser.id);
            if (doctor) {
              conversationsCache[`${doctor.id}_${session.id}`] = c.id;
            }
          } else if (otherUser.role === 'PROVIDER') {
            const bookings = getBookings();
            const booking = bookings.find(b => b.providerUserId === otherUser.id);
            if (booking && booking.providerId) {
              conversationsCache[`${booking.providerId}_${session.id}`] = c.id;
            } else {
              const providers = getProviders();
              const provider = providers.find(p => p.userId === otherUser.id);
              if (provider) {
                conversationsCache[`${provider.id}_${session.id}`] = c.id;
              }
            }
          }
        }

        return {
          conversationId: c.id,
          patientId: otherUser?.id || '',
          patientName: name,
          lastMessage: lastMsg,
          lastMessageTime: lastMsgTime,
          isDoctorSender: lastMsgObj?.senderType === 'DOCTOR',
          lastMessageId: lastMsgObj?.id || undefined
        };
      });
      chatListListeners.forEach(fn => fn());
    }
  } catch (e) {
    console.error('Failed to load conversations from backend', e);
  }
};

export const getActiveChats = (): ActiveChat[] => {
  return activeChats;
};

export const subscribeActiveChats = (callback: () => void) => {
  chatListListeners.push(callback);
  return () => {
    chatListListeners = chatListListeners.filter(fn => fn !== callback);
  };
};

export const clearChatCache = () => {
  conversationsCache = {};
  messagesCache = {};
  activeChats = [];
  readMessagesCache = {};
  activeFetches = {};
  listeners = [];
  chatListListeners = [];
};
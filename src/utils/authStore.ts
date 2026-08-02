import { getItem, setItem, removeItem } from './storage';
import { apiPost } from './api';
import { clearChatCache } from './chatStore';
import { setTokenInMemory } from './tokenHolder';

export interface UserSession {
  id?: string;
  profileId?: string;
  name: string;
  email: string;
  role: 'Patient' | 'Doctor' | 'Student' | 'Provider';
  documentName?: string;
  age?: string;
  bloodGroup?: string;
  address?: string;
  phone?: string;
  collegeName?: string;
  experience?: string;
  category?: 'Allopathy' | 'Ayurveda';
  fee?: number;
  consultationMode?: 'Online' | 'Offline' | 'Both';
  onlineSlots?: string[];
  offlineSlots?: string[];
  token?: string; // JWT token
}

export interface UserAccount extends UserSession {
  password?: string;
}

const SESSION_STORAGE_KEY = 'nirog_auth_session';
const ACCOUNTS_STORAGE_KEY = 'nirog_auth_accounts';
const TOKEN_STORAGE_KEY = 'nirog_auth_token';

// Fallback default guest session on start
const defaultSession: UserSession = {
  id: 'mock_patient_id',
  name: 'John Doe',
  email: 'patient@nirog.com',
  role: 'Patient',
  age: '28 Years',
  bloodGroup: 'O-positive',
  address: 'Indirapuram, Ghaziabad',
  phone: '+91 98765 43210',
};

let activeSession: UserSession | null = defaultSession;
let registeredAccounts: UserAccount[] = [];
let listeners: (() => void)[] = [];

// Asynchronous load of persisted session and token
const loadPersistedSession = async () => {
  try {
    const sessionData = await getItem(SESSION_STORAGE_KEY);
    const tokenData = await getItem(TOKEN_STORAGE_KEY);
    const accountsData = await getItem(ACCOUNTS_STORAGE_KEY);
    if (sessionData) {
      activeSession = JSON.parse(sessionData);
    }
    if (tokenData) {
      setTokenInMemory(tokenData);
    }
    if (accountsData) {
      registeredAccounts = JSON.parse(accountsData);
    } else {
      // Seed default accounts
      registeredAccounts = [
        {
          name: 'John Doe',
          email: 'patient@nirog.com',
          password: 'patient123',
          role: 'Patient',
          age: '28 Years',
          bloodGroup: 'O-positive',
          address: 'Indirapuram, Ghaziabad',
          phone: '+91 98765 43210',
        },
        {
          name: 'Dr. Arpan Sharma',
          email: 'doctor@nirog.com',
          password: 'doctor123',
          role: 'Doctor',
          documentName: 'medical_license_verified.pdf',
          age: '42 Years',
          address: 'Sector 62, Noida, UP',
          phone: '+91 99999 88888',
          experience: '12 Yrs',
          category: 'Allopathy',
          fee: 500,
          consultationMode: 'Both',
          onlineSlots: ['09:00 AM', '11:00 AM', '03:00 PM'],
          offlineSlots: ['10:00 AM', '12:00 PM', '04:00 PM'],
        },
        {
          name: 'Rahul Verma',
          email: 'student@nirog.com',
          password: 'student123',
          role: 'Student',
          documentName: 'student_id_verified.jpg',
          age: '22 Years',
          address: 'Sector 15, Noida, UP',
          phone: '+91 88888 77777',
          collegeName: 'Nirog Medical Institute',
        },
        {
          name: 'Apollo Diagnostics Lab',
          email: 'provider@nirog.com',
          password: 'provider123',
          role: 'Provider',
          documentName: 'lab_permit_certified.pdf',
          age: '10 Years (Est.)',
          address: 'Sector 62, Noida, UP',
          phone: '+91 77777 66666',
          experience: '10 Yrs',
        }
      ];
      await setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(registeredAccounts));
    }
    listeners.forEach(fn => fn());
  } catch (e) {
    console.error('Failed to load persisted data from AsyncStorage', e);
  }
};

loadPersistedSession();

export const getSession = (): UserSession => {
  return activeSession!;
};

export const setSession = (
  name: string,
  email: string,
  role: UserSession['role'],
  documentName?: string,
  age?: string,
  bloodGroup?: string,
  address?: string,
  phone?: string,
  collegeName?: string,
  experience?: string,
  id?: string,
  profileId?: string,
  category?: 'Allopathy' | 'Ayurveda',
  fee?: number,
  consultationMode?: 'Online' | 'Offline' | 'Both',
  onlineSlots?: string[],
  offlineSlots?: string[],
  token?: string
) => {
  clearChatCache();
  activeSession = {
    id,
    profileId,
    name,
    email,
    role,
    documentName,
    age,
    bloodGroup,
    address,
    phone,
    collegeName,
    experience,
    category,
    fee,
    consultationMode,
    onlineSlots,
    offlineSlots
  };

  if (token) {
    setTokenInMemory(token);
    setItem(TOKEN_STORAGE_KEY, token).catch(console.error);
  } else {
    setTokenInMemory(null);
    removeItem(TOKEN_STORAGE_KEY).catch(console.error);
  }

  setItem(SESSION_STORAGE_KEY, JSON.stringify(activeSession)).catch(console.error);
  listeners.forEach(fn => fn());
};

export const clearSession = () => {
  clearChatCache();
  activeSession = defaultSession;
  setTokenInMemory(null);

  removeItem(SESSION_STORAGE_KEY).catch(console.error);
  removeItem(TOKEN_STORAGE_KEY).catch(console.error);
  
  listeners.forEach(fn => fn());
};

export const subscribeSession = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(fn => fn !== callback);
  };
};

// ─── Extended Registry Methods ────────────────────────────────────────────────

const formatBloodGroup = (bg?: string): string | undefined => {
  if (!bg || bg === 'UNKNOWN') return undefined;
  // Convert e.g., O_POSITIVE -> O-positive, AB_NEGATIVE -> AB-negative
  return bg
    .replace('_POSITIVE', '-positive')
    .replace('_NEGATIVE', '-negative')
    .toLowerCase()
    .replace(/^(a|b|ab|o)/, (match) => match.toUpperCase());
};

export const verifyCredentials = async (email: string, pass: string, role: UserSession['role']): Promise<UserSession | null> => {
  try {
    const data = await apiPost('/auth/login', { email, password: pass, role });
    if (data && data.session) {
      const dbUser = data.session;

      const onlineSlots: string[] = [];
      const offlineSlots: string[] = [];
      let finalMode: 'Online' | 'Offline' | 'Both' = 'Both';
      
      if (dbUser.doctorProfile) {
        if (dbUser.doctorProfile.isAvailableOnline && parseFloat(dbUser.doctorProfile.consultationFee) === 0) {
          finalMode = 'Online';
        } else if (!dbUser.doctorProfile.isAvailableOnline) {
          finalMode = 'Offline';
        }
        
        dbUser.doctorProfile.availabilitySlots?.forEach((slot: any) => {
          const [hourStr, minStr] = slot.startTime.split(':');
          const hour = parseInt(hourStr);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          const displayTime = `${displayHour}:${minStr} ${ampm}`;
          
          if (slot.appointmentType === 'ONLINE_VIDEO' || slot.appointmentType === 'ONLINE_CHAT') {
            onlineSlots.push(displayTime);
          } else {
            offlineSlots.push(displayTime);
          }
        });
      }

      const session: UserSession = {
        id: dbUser.id,
        profileId: dbUser.doctorProfile?.id || dbUser.patientProfile?.id || dbUser.studentProfile?.id || dbUser.providerProfile?.id || undefined,
        name: dbUser.profile ? `${dbUser.profile.firstName} ${dbUser.profile.lastName}` : dbUser.email,
        email: dbUser.email,
        role: dbUser.role === 'PATIENT' ? 'Patient' : dbUser.role === 'DOCTOR' ? 'Doctor' : dbUser.role === 'STUDENT' ? 'Student' : 'Provider',
        age: dbUser.profile?.bio ? dbUser.profile.bio.replace('Age: ', '') : undefined,
        address: dbUser.profile?.address?.line1 || undefined,
        phone: dbUser.profile?.phone || undefined,
        bloodGroup: dbUser.patientProfile?.bloodGroup ? formatBloodGroup(dbUser.patientProfile.bloodGroup) : undefined,
        collegeName: dbUser.studentProfile?.institutionName || undefined,
        experience: dbUser.doctorProfile?.experience ? `${dbUser.doctorProfile.experience} Yrs` : undefined,
        category: dbUser.doctorProfile?.category ? (dbUser.doctorProfile.category === 'ALLOPATHY' ? 'Allopathy' : dbUser.doctorProfile.category === 'AYURVEDA' ? 'Ayurveda' : undefined) : undefined,
        fee: dbUser.doctorProfile ? (parseFloat(dbUser.doctorProfile.consultationFee) || parseFloat(dbUser.doctorProfile.onlineConsultFee) || undefined) : undefined,
        consultationMode: dbUser.doctorProfile ? finalMode : undefined,
        onlineSlots: dbUser.doctorProfile ? onlineSlots : undefined,
        offlineSlots: dbUser.doctorProfile ? offlineSlots : undefined,
        token: data.token
      };
      return session;
    }
    return null;
  } catch (e: any) {
    console.error('API verification error:', e);
    throw e;
  }
};

export const registerAccount = async (account: UserAccount): Promise<{ userId: string | null; profileId: string | null; token: string | null } | null> => {
  try {
    const body = {
      name: account.name,
      email: account.email,
      password: account.password,
      role: account.role,
      age: account.age,
      phone: account.phone,
      address: account.address,
      bloodGroup: account.bloodGroup,
      collegeName: account.collegeName,
      experience: account.experience,
      category: account.category,
      fee: account.fee ? String(account.fee) : undefined,
      consultationMode: account.consultationMode ? account.consultationMode.toUpperCase() === 'OFFLINE' ? 'IN_PERSON' : account.consultationMode.toUpperCase() : undefined,
      onlineSlots: account.onlineSlots,
      offlineSlots: account.offlineSlots
    };
    const data = await apiPost('/auth/register', body);
    return {
      userId: data.userId || null,
      profileId: data.profileId || null,
      token: data.token || null
    };
  } catch (e) {
    console.error('API registration error:', e);
    throw e;
  }
};

export const resetPassword = async (email: string, role: UserSession['role'], newPass: string): Promise<boolean> => {
  try {
    await apiPost('/auth/reset-password', { email, role, newPassword: newPass });
    return true;
  } catch (e) {
    console.error('API reset password error:', e);
    return false;
  }
};

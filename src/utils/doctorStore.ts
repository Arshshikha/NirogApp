import { Platform } from 'react-native';
import { Doctor } from '../constants/mockData';
import { apiGet } from './api';

export interface RegisteredDoctor extends Doctor {
  email?: string;
  phone?: string;
  documentName?: string;
  userId?: string;
  consultationMode?: 'Online' | 'Offline' | 'Both';
  onlineSlots?: string[];
  offlineSlots?: string[];
}

let memoryDoctors: RegisteredDoctor[] = [];
let listeners: (() => void)[] = [];
let isLoaded = false;

const loadDoctorsFromApi = async () => {
  try {
    const dbDoctors = await apiGet('/doctors');
    if (dbDoctors && Array.isArray(dbDoctors)) {
      memoryDoctors = dbDoctors.map((dbDoc: any) => {
        // Build readable name
        let fullName = dbDoc.user?.profile 
          ? `${dbDoc.user.profile.firstName} ${dbDoc.user.profile.lastName}` 
          : 'Unknown Doctor';
        if (!fullName.startsWith('Dr.')) {
          fullName = `Dr. ${fullName}`;
        }
        
        const onlineSlots: string[] = [];
        const offlineSlots: string[] = [];
        let finalMode: 'Online' | 'Offline' | 'Both' = 'Both';
        
        if (dbDoc.isAvailableOnline && parseFloat(dbDoc.consultationFee) === 0) {
          finalMode = 'Online';
        } else if (!dbDoc.isAvailableOnline) {
          finalMode = 'Offline';
        }
        
        dbDoc.availabilitySlots?.forEach((slot: any) => {
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

        // Default fallbacks if no slots are stored in db
        if (onlineSlots.length === 0 && (finalMode === 'Online' || finalMode === 'Both')) {
          onlineSlots.push('09:00 AM', '11:00 AM', '03:00 PM');
        }
        if (offlineSlots.length === 0 && (finalMode === 'Offline' || finalMode === 'Both')) {
          offlineSlots.push('10:00 AM', '12:00 PM', '04:00 PM');
        }

        return {
          id: dbDoc.id,
          userId: dbDoc.userId,
          name: fullName,
          specialty: dbDoc.specialties?.[0] || 'General Physician',
          category: dbDoc.category === 'AYURVEDA' ? 'Ayurveda' : (dbDoc.category === 'HOMEOPATHY' ? 'Homeopathy' : 'Allopathy'),
          rating: parseFloat(dbDoc.avgRating) || 5.0,
          reviewsCount: dbDoc.totalReviews || 0,
          experience: dbDoc.experience || 0,
          location: dbDoc.user?.profile?.address?.line1 || 'Clinic',
          distance: '1.2 km',
          fee: parseFloat(dbDoc.consultationFee) || parseFloat(dbDoc.onlineConsultFee) || 500,
          availability: finalMode === 'Online' ? onlineSlots : offlineSlots,
          avatar: dbDoc.user?.profile?.avatarFile?.url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200',
          email: dbDoc.user?.email || '',
          phone: dbDoc.user?.profile?.phone || '',
          documentName: dbDoc.licenseDocumentId || undefined,
          consultationMode: finalMode,
          onlineSlots,
          offlineSlots
        };
      });

      listeners.forEach(fn => fn());
    }
  } catch (e) {
    console.error('Failed to load doctors from backend', e);
  }
};

export const getDoctors = (): RegisteredDoctor[] => {
  if (!isLoaded) {
    isLoaded = true;
    loadDoctorsFromApi();
  }
  return memoryDoctors;
};

export const addDoctor = (
  name: string,
  specialty: string,
  category: 'Allopathy' | 'Ayurveda' | 'Homeopathy',
  experience: number,
  location: string,
  fee: number,
  availability: string[],
  avatar: string,
  phone?: string,
  email?: string,
  documentName?: string,
  consultationMode?: 'Online' | 'Offline' | 'Both',
  onlineSlots?: string[],
  offlineSlots?: string[],
  id?: string,
  userId?: string
) => {
  const mode = consultationMode || 'Both';
  const oSlots = onlineSlots || ['09:00 AM', '11:00 AM', '03:00 PM'];
  const fSlots = offlineSlots || ['10:00 AM', '12:00 PM', '04:00 PM'];

  // Local implementation helper for fast feedback (in production, registrations flow through auth signup)
  const newDoctor: RegisteredDoctor = {
    id: id || `d_${Date.now()}`,
    userId: userId,
    name,
    specialty,
    category,
    rating: 5.0,
    reviewsCount: 0,
    experience,
    location,
    distance: '0.5 km',
    fee,
    availability: mode === 'Online' ? oSlots : fSlots,
    avatar: avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200',
    phone,
    email,
    documentName,
    consultationMode: mode,
    onlineSlots: oSlots,
    offlineSlots: fSlots
  };

  memoryDoctors = [...memoryDoctors, newDoctor];
  listeners.forEach(fn => fn());
  return newDoctor;
};

export const subscribeDoctors = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(fn => fn !== callback);
  };
};

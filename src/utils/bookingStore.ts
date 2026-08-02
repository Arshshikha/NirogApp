import { Platform } from 'react-native';
import { apiGet, apiPost, apiPatch } from './api';
import { getSession } from './authStore';

export interface Booking {
  id: string;
  doctorId?: string;
  doctorName?: string;
  providerId?: string;
  providerUserId?: string;
  providerName?: string;
  patientName: string;
  patientId?: string;
  type: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rejected';
  fee: number;
  medicalWing?: string;
  review?: {
    id: string;
    rating: number;
    comment?: string;
    createdAt?: string;
  } | null;
}

let memoryBookings: Booking[] = [];
let listeners: (() => void)[] = [];
let isLoaded = false;

const loadBookingsFromApi = async () => {
  const session = getSession();
  if (!session || !session.id) return;

  try {
    const dbBookings = await apiGet(`/bookings?userId=${session.id}&role=${session.role}`);
    if (dbBookings && Array.isArray(dbBookings)) {
      memoryBookings = dbBookings.map((b: any) => {
        const docName = b.doctorProfile?.user?.profile
          ? `Dr. ${b.doctorProfile.user.profile.firstName} ${b.doctorProfile.user.profile.lastName}`
          : undefined;

        const provName = b.providerProfile?.legalName || undefined;

        let statusStr: Booking['status'] = 'Pending';
        if (b.status === 'CONFIRMED') statusStr = 'Confirmed';
        else if (b.status === 'COMPLETED') statusStr = 'Completed';
        else if (b.status === 'CANCELLED_BY_PATIENT' || b.status === 'CANCELLED_BY_PROVIDER') statusStr = 'Cancelled';
        else if (b.status === 'REJECTED') statusStr = 'Rejected';

        // Format appointment type string
        let typeStr = 'Clinic Visit (Offline)';
        if (b.appointmentType === 'ONLINE_VIDEO') typeStr = 'Online Video Call';
        else if (b.appointmentType === 'ONLINE_CHAT') typeStr = 'Online Chat';
        else if (b.appointmentType === 'HOSPITAL_VISIT') typeStr = 'Hospital Visit';
        else if (b.appointmentType === 'LAB_TEST') typeStr = 'Lab Test';
        else if (b.appointmentType === 'HOME_VISIT') {
          if (b.providerProfile?.providerType === 'LAB') {
            typeStr = 'Lab Test';
          } else if (b.providerProfile?.providerType === 'HOSPITAL') {
            typeStr = 'Hospital Visit';
          } else {
            typeStr = 'Home Visit';
          }
        }

        // Format date: e.g. "22 May, 2026"
        const displayDate = new Date(b.scheduledDate).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        return {
          id: b.id,
          doctorId: b.doctorProfileId || undefined,
          doctorName: docName,
          providerId: b.providerProfileId || undefined,
          providerUserId: b.providerProfile?.user?.id || undefined,
          providerName: provName,
          patientName: b.patient?.profile 
            ? `${b.patient.profile.firstName} ${b.patient.profile.lastName}` 
            : 'Patient',
          patientId: b.patientId || undefined,
          type: typeStr,
          date: displayDate,
          time: b.scheduledTime,
          status: statusStr,
          fee: parseFloat(b.totalFee) || 500,
          medicalWing: b.medicalWing || undefined,
          review: b.review || null
        };
      });
      listeners.forEach(fn => fn());
    }
  } catch (e) {
    console.error('Failed to fetch bookings from backend', e);
  }
};

export const getBookings = (): Booking[] => {
  if (!isLoaded) {
    isLoaded = true;
    loadBookingsFromApi();
  }
  return memoryBookings;
};

export const addBooking = async (
  doctorId: string | undefined,
  doctorName: string | undefined,
  providerId: string | undefined,
  providerName: string | undefined,
  patientName: string,
  type: string,
  date: string,
  time: string,
  fee: number,
  medicalWing?: string
) => {
  const session = getSession();
  const patientId = session.id;

  if (!patientId) {
    console.error('No patient ID found in session');
    return;
  }

  try {
    let formattedDate = date;
    try {
      formattedDate = new Date(date).toISOString().slice(0, 10);
    } catch (e) {
      console.warn('Failed to parse date', e);
    }

    const body = {
      patientId,
      doctorProfileId: doctorId || null,
      providerProfileId: providerId || null,
      providerName: providerName || null,
      bookingType: type,
      bookingDate: formattedDate,
      bookingTime: time,
      fee,
      medicalWing: medicalWing || null
    };

    const res = await apiPost('/bookings', body);
    if (res && res.booking) {
      loadBookingsFromApi();
    }
  } catch (e) {
    console.error('Failed to add booking', e);
  }
};

export const updateBookingStatus = async (bookingId: string, nextStatus: Booking['status']) => {
  let backendStatus = 'PENDING';
  if (nextStatus === 'Confirmed') backendStatus = 'CONFIRMED';
  else if (nextStatus === 'Completed') backendStatus = 'COMPLETED';
  else if (nextStatus === 'Cancelled') backendStatus = 'CANCELLED';
  else if (nextStatus === 'Rejected') backendStatus = 'REJECTED';

  try {
    await apiPatch(`/bookings/${bookingId}/status`, { status: backendStatus });
    // Update local cache for immediate feedback
    memoryBookings = memoryBookings.map(b => b.id === bookingId ? { ...b, status: nextStatus } : b);
    listeners.forEach(fn => fn());
  } catch (e) {
    console.error('Failed to update booking status', e);
  }
};

export const subscribeBookings = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(fn => fn !== callback);
  };
};

export const refreshBookings = async () => {
  await loadBookingsFromApi();
};

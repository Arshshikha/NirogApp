import { Request, Response } from 'express';
import { db } from '../config/db';
import { BookingStatus, AppointmentType } from '@prisma/client';
import { createNotificationWithPush } from '../utils/pushNotification';

const mapStatusToEnum = (statusStr: string): BookingStatus => {
  const s = statusStr.toUpperCase();
  if (s === 'PENDING') return BookingStatus.PENDING;
  if (s === 'CONFIRMED') return BookingStatus.CONFIRMED;
  if (s === 'COMPLETED') return BookingStatus.COMPLETED;
  if (s === 'REJECTED') return BookingStatus.REJECTED;
  if (s === 'CANCELLED' || s === 'CANCELLED_BY_PATIENT') return BookingStatus.CANCELLED_BY_PATIENT;
  if (s === 'CANCELLED_BY_PROVIDER') return BookingStatus.CANCELLED_BY_PROVIDER;
  return BookingStatus.PENDING;
};

const mapTypeToEnum = (typeStr: string): AppointmentType => {
  const t = typeStr.toUpperCase();
  if (t.includes('VIDEO')) return AppointmentType.ONLINE_VIDEO;
  if (t.includes('CHAT')) return AppointmentType.ONLINE_CHAT;
  if (t.includes('HOSPITAL')) return AppointmentType.HOSPITAL_VISIT;
  if (t.includes('LAB') || t.includes('TEST')) return AppointmentType.LAB_TEST;
  if (t.includes('HOME')) return AppointmentType.HOME_VISIT;
  return AppointmentType.IN_PERSON;
};

const formatTimeTo24h = (timeStr: string): string => {
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) {
    return clean.slice(0, 5);
  }
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3];
  
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes}`;
};

export const getBookings = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const role = req.user?.role || 'PATIENT';

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User identity not found' });
    return;
  }

  try {
    let bookings;
    const roleUpper = String(role).toUpperCase();

    if (roleUpper === 'PATIENT') {
      bookings = await db.booking.findMany({
        where: { patientId: String(userId) },
        include: {
          doctorProfile: {
            include: {
              user: {
                include: { profile: true }
              }
            }
          },
          providerProfile: {
            include: {
              user: {
                include: { profile: true }
              }
            }
          },
          review: true
        },
        orderBy: { scheduledDate: 'desc' }
      });
    } else if (roleUpper === 'DOCTOR') {
      const doctorProfile = await db.doctorProfile.findUnique({
        where: { userId: String(userId) }
      });

      if (!doctorProfile) {
        res.status(404).json({ error: 'Doctor profile not found' });
        return;
      }

      bookings = await db.booking.findMany({
        where: { doctorProfileId: doctorProfile.id },
        include: {
          patient: {
            include: { profile: true }
          },
          review: true
        },
        orderBy: { scheduledDate: 'desc' }
      });
    } else if (roleUpper === 'PROVIDER') {
      const providerProfile = await db.providerProfile.findUnique({
        where: { userId: String(userId) }
      });

      if (!providerProfile) {
        res.status(404).json({ error: 'Provider profile not found' });
        return;
      }

      bookings = await db.booking.findMany({
        where: { providerProfileId: providerProfile.id },
        include: {
          patient: {
            include: { profile: true }
          },
          review: true
        },
        orderBy: { scheduledDate: 'desc' }
      });
    } else {
      bookings = await db.booking.findMany({
        include: {
          review: true
        },
        orderBy: { scheduledDate: 'desc' }
      });
    }

    res.status(200).json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  const patientId = req.user?.userId;
  const { 
    doctorProfileId, 
    providerProfileId, 
    providerName,
    bookingType, 
    bookingDate, 
    bookingTime, 
    fee,
    medicalWing
  } = req.body;

  if (!patientId || !bookingType || !bookingDate || !bookingTime) {
    res.status(400).json({ error: 'Required fields missing: bookingType, bookingDate, bookingTime' });
    return;
  }

  try {
    const dateStr = new Date(bookingDate).toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingReference = `NRG-${dateStr}-${randStr}`;

    let resolvedProviderProfileId: string | null = null;
    if (providerProfileId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerProfileId)) {
      resolvedProviderProfileId = providerProfileId;
    } else if (providerName) {
      const prov = await db.providerProfile.findFirst({
        where: {
          legalName: {
            equals: providerName,
            mode: 'insensitive'
          }
        }
      });
      if (prov) {
        resolvedProviderProfileId = prov.id;
      }
    }

    console.log("BOOKING DATA:", {
      appointmentType: mapTypeToEnum(bookingType),
      scheduledTime: formatTimeTo24h(bookingTime),
      bookingReference,
      totalFee: fee ? parseFloat(fee) : 0.0,
      resolvedProviderProfileId,
      medicalWing,
    });

    let resolvedDoctorProfileId: string | null = null;
    if (doctorProfileId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doctorProfileId)) {
      resolvedDoctorProfileId = doctorProfileId;
    }

    const booking = await db.booking.create({
      data: {
        bookingReference,
        patientId,
        doctorProfileId: resolvedDoctorProfileId,
        providerProfileId: resolvedProviderProfileId,
        appointmentType: mapTypeToEnum(bookingType),
        scheduledDate: new Date(bookingDate),
        scheduledTime: formatTimeTo24h(bookingTime),
        totalFee: fee ? parseFloat(fee) : 0.0,
        status: BookingStatus.PENDING,
        medicalWing: medicalWing || null
      }
    });

    // Notify Doctor
    if (resolvedDoctorProfileId) {
      const doc = await db.doctorProfile.findUnique({
        where: { id: resolvedDoctorProfileId },
        select: { userId: true }
      });
      if (doc) {
        await createNotificationWithPush({
          userId: doc.userId,
          type: 'BOOKING_CONFIRMATION',
          title: 'New Appointment Request',
          body: `You have a new appointment request on ${bookingDate} at ${bookingTime}.`
        });
      }
    }
    // Notify Provider
    else if (resolvedProviderProfileId) {
      const prov = await db.providerProfile.findUnique({
        where: { id: resolvedProviderProfileId },
        select: { userId: true }
      });
      if (prov) {
        await createNotificationWithPush({
          userId: prov.userId,
          type: 'BOOKING_CONFIRMATION',
          title: 'New Lab Booking Request',
          body: `You have a new booking request on ${bookingDate} at ${bookingTime}.`
        });
      }
    }

    // Notify Patient
    await createNotificationWithPush({
      userId: patientId,
      type: 'BOOKING_CONFIRMATION',
      title: 'Appointment Requested',
      body: `Your booking request for ${bookingType} on ${bookingDate} at ${bookingTime} is pending confirmation.`
    });

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const statusEnum = mapStatusToEnum(status);
    const updatedBooking = await db.booking.update({
      where: { id },
      data: { status: statusEnum }
    });

    // Notify user about status change
    const bookingDetails = await db.booking.findUnique({
      where: { id },
      include: {
        doctorProfile: { include: { user: { include: { profile: true } } } },
        providerProfile: { include: { user: { include: { profile: true } } } }
      }
    });

    if (bookingDetails) {
      const name = bookingDetails.doctorProfile
        ? `Dr. ${bookingDetails.doctorProfile.user.profile?.firstName} ${bookingDetails.doctorProfile.user.profile?.lastName}`
        : bookingDetails.providerProfile?.legalName || 'Provider';
        
      const dateStr = bookingDetails.scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (statusEnum === BookingStatus.CONFIRMED) {
        await createNotificationWithPush({
          userId: bookingDetails.patientId,
          type: 'BOOKING_CONFIRMATION',
          title: 'Appointment Confirmed',
          body: `Your appointment with ${name} on ${dateStr} at ${bookingDetails.scheduledTime} has been confirmed.`
        });
      } else if (statusEnum === BookingStatus.REJECTED) {
        await createNotificationWithPush({
          userId: bookingDetails.patientId,
          type: 'BOOKING_CANCELLATION',
          title: 'Appointment Declined',
          body: `Your appointment request with ${name} on ${dateStr} has been declined.`
        });
      } else if (statusEnum === BookingStatus.COMPLETED) {
        await createNotificationWithPush({
          userId: bookingDetails.patientId,
          type: 'BOOKING_CONFIRMATION',
          title: 'Appointment Completed',
          body: `Your appointment with ${name} on ${dateStr} at ${bookingDetails.scheduledTime} has been successfully completed.`
        });
      } else if (statusEnum === BookingStatus.CANCELLED_BY_PATIENT) {
        const targetUserId = bookingDetails.doctorProfile?.userId || bookingDetails.providerProfile?.userId;
        if (targetUserId) {
          await createNotificationWithPush({
            userId: targetUserId,
            type: 'BOOKING_CANCELLATION',
            title: 'Appointment Cancelled',
            body: `The appointment scheduled on ${dateStr} was cancelled by the patient.`
          });
        }
      }
    }

    res.status(200).json({ message: 'Booking status updated', booking: updatedBooking });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

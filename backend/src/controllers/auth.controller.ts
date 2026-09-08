import { Request, Response } from 'express';
import { db } from '../config/db';
import { UserRole, BloodGroup, MedicalCategory, ProviderType, DayOfWeek, AppointmentType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nirog_secret_key_123';

// Helper to map role string to UserRole enum
const getRoleEnum = (roleStr: string): UserRole => {
  const r = roleStr.toUpperCase();
  if (r === 'PATIENT') return UserRole.PATIENT;
  if (r === 'DOCTOR') return UserRole.DOCTOR;
  if (r === 'STUDENT') return UserRole.STUDENT;
  if (r === 'PROVIDER') return UserRole.PROVIDER;
  if (r === 'ADMIN') return UserRole.ADMIN;
  return UserRole.PATIENT; // default
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { 
    name, 
    firstName,
    lastName,
    email, 
    password, 
    role, 
    age, 
    phone, 
    address, 
    bloodGroup, 
    specialty, 
    category, 
    experience, 
    fee, 
    collegeName, 
    providerType 
  } = req.body;

  console.log('=== REGISTER PAYLOAD ===', req.body);
  try {
    const emailLower = String(email).trim().toLowerCase();
    const existingUser = await db.user.findUnique({ where: { email: emailLower } });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Split full name if individual first/last name not supplied
    let fName = firstName || '';
    let lName = lastName || '';
    if (!fName && name) {
      const parts = name.trim().split(/\s+/);
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }

    const roleEnum = getRoleEnum(role || 'Patient');

    const user = await db.user.create({
      data: {
        email: emailLower,
        passwordHash: password, // In production, hash with bcrypt!
        role: roleEnum,
        profile: {
          create: {
            firstName: fName || 'User',
            lastName: lName || '',
            phone: phone || null,
            bio: age ? `Age: ${age}` : null,
            address: address ? {
              create: {
                line1: address,
                city: 'Noida',
                state: 'UP',
                pincode: '201301',
              }
            } : undefined
          }
        }
      },
    });

    // Create the appropriate profile structure based on the role
    let profileId: string | undefined;
    if (roleEnum === UserRole.PATIENT) {
      let bg: BloodGroup = BloodGroup.UNKNOWN;
      if (bloodGroup) {
        const cleanBg = String(bloodGroup).trim().toUpperCase().replace(/\s+/g, '');
        const mapping: Record<string, BloodGroup> = {
          'A+': BloodGroup.A_POSITIVE,
          'A-': BloodGroup.A_NEGATIVE,
          'APOSITIVE': BloodGroup.A_POSITIVE,
          'ANEGATIVE': BloodGroup.A_NEGATIVE,
          'A-POSITIVE': BloodGroup.A_POSITIVE,
          'A-NEGATIVE': BloodGroup.A_NEGATIVE,

          'B+': BloodGroup.B_POSITIVE,
          'B-': BloodGroup.B_NEGATIVE,
          'BPOSITIVE': BloodGroup.B_POSITIVE,
          'BNEGATIVE': BloodGroup.B_NEGATIVE,
          'B-POSITIVE': BloodGroup.B_POSITIVE,
          'B-NEGATIVE': BloodGroup.B_NEGATIVE,

          'AB+': BloodGroup.AB_POSITIVE,
          'AB-': BloodGroup.AB_NEGATIVE,
          'ABPOSITIVE': BloodGroup.AB_POSITIVE,
          'ABNEGATIVE': BloodGroup.AB_NEGATIVE,
          'AB-POSITIVE': BloodGroup.AB_POSITIVE,
          'AB-NEGATIVE': BloodGroup.AB_NEGATIVE,

          'O+': BloodGroup.O_POSITIVE,
          'O-': BloodGroup.O_NEGATIVE,
          'OPOSITIVE': BloodGroup.O_POSITIVE,
          'ONEGATIVE': BloodGroup.O_NEGATIVE,
          'O-POSITIVE': BloodGroup.O_POSITIVE,
          'O-NEGATIVE': BloodGroup.O_NEGATIVE,
        };

        if (mapping[cleanBg]) {
          bg = mapping[cleanBg];
        } else {
          const enumMatch = cleanBg.replace(/-/g, '_');
          if (Object.values(BloodGroup).includes(enumMatch as BloodGroup)) {
            bg = enumMatch as BloodGroup;
          }
        }
      }

      const pat = await db.patientProfile.create({
        data: { userId: user.id, bloodGroup: bg },
      });
      profileId = pat.id;
    } else if (roleEnum === UserRole.DOCTOR) {
      let medCat: MedicalCategory = MedicalCategory.ALLOPATHY;
      if (category) {
        const catUpper = category.toUpperCase();
        if (Object.values(MedicalCategory).includes(catUpper as MedicalCategory)) {
          medCat = catUpper as MedicalCategory;
        }
      }

      const { consultationMode, onlineSlots, offlineSlots } = req.body;
      const isOnline = consultationMode === 'ONLINE' || consultationMode === 'BOTH';
      const isOffline = consultationMode === 'IN_PERSON' || consultationMode === 'BOTH';

      const slotsToCreate: any[] = [];
      if (isOnline && onlineSlots && Array.isArray(onlineSlots)) {
        onlineSlots.forEach((slot: string) => {
          const timeClean = slot.trim();
          if (timeClean) {
            slotsToCreate.push({
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: timeClean,
              endTime: timeClean,
              appointmentType: AppointmentType.ONLINE_VIDEO,
              effectiveFrom: new Date()
            });
          }
        });
      }
      if (isOffline && offlineSlots && Array.isArray(offlineSlots)) {
        offlineSlots.forEach((slot: string) => {
          const timeClean = slot.trim();
          if (timeClean) {
            slotsToCreate.push({
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: timeClean,
              endTime: timeClean,
              appointmentType: AppointmentType.IN_PERSON,
              effectiveFrom: new Date()
            });
          }
        });
      }

      const doc = await db.doctorProfile.create({
        data: {
          userId: user.id,
          registrationNumber: `REG-${Date.now()}`,
          category: medCat,
          specialties: specialty ? [specialty] : ['General Physician'],
          experience: experience ? parseInt(experience) : 0,
          consultationFee: isOffline ? (fee ? parseFloat(fee) : 0.0) : 0.0,
          onlineConsultFee: isOnline ? (fee ? parseFloat(fee) : 0.0) : 0.0,
          isAvailableOnline: isOnline,
          availabilitySlots: slotsToCreate.length > 0 ? {
            create: slotsToCreate
          } : undefined
        },
      });
      profileId = doc.id;
    } else if (roleEnum === UserRole.STUDENT) {
      const stud = await db.studentProfile.create({
        data: { 
          userId: user.id, 
          institutionName: collegeName || 'Nirog Medical Institute'
        },
      });
      profileId = stud.id;
    } else if (roleEnum === UserRole.PROVIDER) {
      let pType: ProviderType = ProviderType.LAB;
      if (providerType) {
        const ptUpper = providerType.toUpperCase();
        if (Object.values(ProviderType).includes(ptUpper as ProviderType)) {
          pType = ptUpper as ProviderType;
        }
      }
      const prov = await db.providerProfile.create({
        data: { 
          userId: user.id, 
          providerType: pType,
          legalName: name || 'Apollo Lab',
        },
      });
      profileId = prov.id;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'User registered successfully', userId: user.id, profileId, role: user.role, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role } = req.body;

  try {
    const roleEnum = getRoleEnum(role || 'Patient');
    const emailLower = String(email).trim().toLowerCase();

    const user = await db.user.findUnique({
      where: { email: emailLower },
      include: {
        profile: {
          include: { address: true }
        },
        patientProfile: true,
        doctorProfile: {
          include: { availabilitySlots: true }
        },
        studentProfile: true,
        providerProfile: {
          include: { address: true }
        },
      },
    });

    if (!user || user.passwordHash !== password || user.role !== roleEnum) {
      res.status(401).json({ error: 'Invalid email, password, or role' });
      return;
    }

    const { passwordHash, ...sessionData } = user;
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', token, session: sessionData });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, role, newPassword } = req.body;

  try {
    const roleEnum = getRoleEnum(role || 'Patient');
    const emailLower = String(email).trim().toLowerCase();
    const user = await db.user.findFirst({
      where: { email: emailLower, role: roleEnum }
    });

    if (!user) {
      res.status(404).json({ error: 'No account found with this email and role combination' });
      return;
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPassword }
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

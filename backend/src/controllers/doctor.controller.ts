import { Request, Response } from 'express';
import { db } from '../config/db';
import { MedicalCategory, DayOfWeek, AppointmentType } from '@prisma/client';

export const getDoctors = async (req: Request, res: Response): Promise<void> => {
  const { category, specialty, query } = req.query;

  try {
    const whereClause: any = {};

    if (category) {
      const catUpper = String(category).toUpperCase();
      if (Object.values(MedicalCategory).includes(catUpper as MedicalCategory)) {
        whereClause.category = catUpper as MedicalCategory;
      }
    }

    if (specialty) {
      whereClause.specialties = {
        has: String(specialty)
      };
    }

    if (query) {
      whereClause.OR = [
        {
          specialties: {
            has: String(query)
          }
        },
        {
          user: {
            profile: {
              OR: [
                {
                  firstName: {
                    contains: String(query),
                    mode: 'insensitive'
                  }
                },
                {
                  lastName: {
                    contains: String(query),
                    mode: 'insensitive'
                  }
                }
              ]
            }
          }
        }
      ];
    }

    const doctors = await db.doctorProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            profile: {
              include: {
                address: true,
                avatarFile: true
              }
            }
          }
        },
        availabilitySlots: true
      }
    });

    res.status(200).json(doctors);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const registerDoctorProfile = async (req: Request, res: Response): Promise<void> => {
  const { 
    userId, 
    specialty, 
    category, 
    experience, 
    fee, 
    licenseDocumentId,
    availabilities 
  } = req.body;

  if (!userId || !specialty || !category) {
    res.status(400).json({ error: 'Required fields missing: userId, specialty, category' });
    return;
  }

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'DOCTOR') {
      res.status(400).json({ error: 'Valid user with Doctor role not found' });
      return;
    }

    const existingProfile = await db.doctorProfile.findUnique({ where: { userId } });
    if (existingProfile) {
      res.status(400).json({ error: 'Doctor profile already exists for this user' });
      return;
    }

    let medCat: MedicalCategory = MedicalCategory.ALLOPATHY;
    const catUpper = category.toUpperCase();
    if (Object.values(MedicalCategory).includes(catUpper as MedicalCategory)) {
      medCat = catUpper as MedicalCategory;
    }

    const doctorProfile = await db.doctorProfile.create({
      data: {
        userId,
        registrationNumber: `REG-${Date.now()}`,
        category: medCat,
        specialties: specialty ? [specialty] : ['General Physician'],
        experience: experience ? parseInt(experience) : 0,
        consultationFee: fee ? parseFloat(fee) : 0.0,
        onlineConsultFee: fee ? parseFloat(fee) : 0.0,
        licenseDocumentId: licenseDocumentId || null,
        availabilitySlots: availabilities && Array.isArray(availabilities) ? {
          create: availabilities.map((slot: string) => {
            // Normalize slot strings (e.g. "10:00 AM" -> "10:00")
            const timeClean = slot.replace(/[^0-9:]/g, '').slice(0, 5) || '10:00';
            return {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: timeClean.length === 5 ? timeClean : '10:00',
              endTime: timeClean.length === 5 ? timeClean : '11:00',
              appointmentType: AppointmentType.ONLINE_VIDEO,
              effectiveFrom: new Date()
            };
          })
        } : undefined
      },
      include: {
        availabilitySlots: true
      }
    });

    res.status(201).json({ message: 'Doctor profile registered successfully', doctorProfile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

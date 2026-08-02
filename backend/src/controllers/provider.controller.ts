import { Request, Response } from 'express';
import { db } from '../config/db';
import { ProviderType } from '@prisma/client';

export const getProviders = async (req: Request, res: Response): Promise<void> => {
  const { type } = req.query;

  try {
    const whereClause: any = {};
    if (type) {
      const typeUpper = String(type).toUpperCase();
      if (Object.values(ProviderType).includes(typeUpper as ProviderType)) {
        whereClause.providerType = typeUpper as ProviderType;
      }
    }

    const providers = await db.providerProfile.findMany({
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
        services: true,
        address: true
      }
    });

    res.status(200).json(providers);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const createProviderService = async (req: Request, res: Response): Promise<void> => {
  const { providerProfileId } = req.params;
  const { name, price, availableSlot } = req.body;

  if (!name || !price) {
    res.status(400).json({ error: 'Required fields missing: name, price' });
    return;
  }

  try {
    const service = await db.providerService.create({
      data: {
        providerProfileId,
        name,
        price: parseFloat(price) || 0.0,
        availableSlot: availableSlot || null,
        isActive: true
      }
    });

    res.status(201).json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const toggleProviderService = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const service = await db.providerService.update({
      where: { id },
      data: { isActive: Boolean(isActive) }
    });

    res.status(200).json(service);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const updateProviderProfile = async (req: Request, res: Response): Promise<void> => {
  const { providerProfileId } = req.params;
  const { legalName, website, description, phone, address } = req.body;

  try {
    // 1. Update the profile
    const profile = await db.providerProfile.update({
      where: { id: providerProfileId },
      data: {
        legalName,
        website,
        description
      }
    });

    // 2. Update phone in user profile
    if (phone) {
      await db.userProfile.update({
        where: { userId: profile.userId },
        data: { phone }
      });
    }

    // 3. Upsert address
    if (address) {
      await db.providerAddress.upsert({
        where: { providerProfileId },
        update: { line1: address },
        create: {
          providerProfileId,
          line1: address,
          city: 'Noida',
          state: 'UP',
          pincode: '201301'
        }
      });
    }

    res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

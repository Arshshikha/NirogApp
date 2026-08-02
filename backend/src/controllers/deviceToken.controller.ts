import { Request, Response } from 'express';
import { db } from '../config/db';

export const saveDeviceToken = async (req: Request, res: Response): Promise<void> => {
  const { userId, deviceToken, platform } = req.body;

  if (!userId || !deviceToken) {
    res.status(400).json({ error: 'Missing required fields: userId, deviceToken' });
    return;
  }

  try {
    // Check if the user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Save or update the device token
    // We can upsert by token since it has a @unique constraint
    const savedToken = await db.deviceToken.upsert({
      where: { token: deviceToken },
      update: {
        userId,
        platform: platform || 'android',
        updatedAt: new Date()
      },
      create: {
        userId,
        token: deviceToken,
        platform: platform || 'android'
      }
    });

    res.status(200).json({
      message: 'Device token saved successfully',
      deviceToken: savedToken
    });
  } catch (error: any) {
    console.error('Error saving device token:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

import { Request, Response } from 'express';
import { db } from '../config/db';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    return;
  }

  try {
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    return;
  }

  try {
    const notif = await db.notification.findFirst({
      where: { id, userId }
    });

    if (!notif) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    const updated = await db.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    return;
  }

  try {
    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

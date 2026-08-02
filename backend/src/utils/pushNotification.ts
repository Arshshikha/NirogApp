import { db } from '../config/db';
import { NotificationType, NotificationChannel } from '@prisma/client';

export async function sendPushNotification(
  to: string | string[],
  title: string,
  body: string,
  data?: any
) {
  const tokens = Array.isArray(to) ? to : [to];
  const validTokens = tokens.filter(t => t && t.startsWith('ExponentPushToken['));

  if (validTokens.length === 0) {
    return;
  }

  const messages = validTokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Expo push notification send failed: ${response.status} ${text}`);
      return;
    }

    const resData = await response.json();
    console.log('Expo push notification response:', JSON.stringify(resData));
  } catch (error) {
    console.error('Error sending push notification via Expo:', error);
  }
}

export async function createNotificationWithPush(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: any;
}) {
  const { userId, type, title, body, metadata } = params;

  try {
    // 1. Create in-app notification in DB
    const dbNotif = await db.notification.create({
      data: {
        userId,
        type,
        channel: NotificationChannel.IN_APP,
        title,
        body,
        metadata: metadata || undefined,
      },
    });

    // 2. Fetch device tokens for the user
    const deviceTokens = await db.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (deviceTokens.length > 0) {
      const tokens = deviceTokens.map(dt => dt.token);
      console.log(`Sending push notification to user ${userId} on tokens:`, tokens);
      
      // Send push notification asynchronously (don't block the caller)
      sendPushNotification(tokens, title, body, { notificationId: dbNotif.id, type, ...metadata })
        .catch(err => console.error('Background push send error:', err));
    }

    return dbNotif;
  } catch (err) {
    console.error('Failed to create notification and send push:', err);
    // Fallback to try and create the in-app notification without failing the request
    try {
      return await db.notification.create({
        data: {
          userId,
          type,
          channel: NotificationChannel.IN_APP,
          title,
          body,
        },
      });
    } catch (fallbackErr) {
      console.error('Fallback notification creation failed:', fallbackErr);
    }
  }
}

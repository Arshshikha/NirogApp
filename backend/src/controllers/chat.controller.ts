import { Request, Response } from 'express';
import { db } from '../config/db';
import { MessageSenderType } from '@prisma/client';
import { createNotificationWithPush } from '../utils/pushNotification';

const isUuid = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User identity not found' });
    return;
  }

  if (!isUuid(String(userId))) {
    res.status(200).json([]);
    return;
  }

  try {
    const members = await db.conversationMember.findMany({
      where: { userId: String(userId) },
      include: {
        conversation: {
          include: {
            members: {
              where: {
                NOT: { userId: String(userId) }
              },
              include: {
                user: {
                  include: { profile: true }
                }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const conversations = members.map(m => m.conversation);
    res.status(200).json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  const { conversationId } = req.params;

  if (!isUuid(conversationId)) {
    res.status(200).json([]);
    return;
  }

  try {
    const messages = await db.chatMessage.findMany({
      where: { conversationId },
      include: {
        attachments: {
          include: { file: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const senderId = req.user?.userId;
  const { conversationId, senderType, text } = req.body;

  if (!conversationId || !senderId || !senderType || !text) {
    res.status(400).json({ error: 'Required fields missing: conversationId, senderType, text' });
    return;
  }

  if (!isUuid(conversationId) || !isUuid(senderId)) {
    res.status(201).json({
      id: `mock_msg_${Date.now()}`,
      conversationId,
      senderId,
      senderType: senderType.toUpperCase() === 'DOCTOR' ? MessageSenderType.DOCTOR : MessageSenderType.PATIENT,
      body: text,
      createdAt: new Date().toISOString()
    });
    return;
  }

  try {
    const typeEnum = senderType.toUpperCase() === 'DOCTOR' ? MessageSenderType.DOCTOR : MessageSenderType.PATIENT;

    const message = await db.chatMessage.create({
      data: {
        conversationId,
        senderId,
        senderType: typeEnum,
        body: text
      }
    });

    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    const members = await db.conversationMember.findMany({
      where: {
        conversationId,
        NOT: { userId: senderId }
      }
    });

    for (const m of members) {
      await createNotificationWithPush({
        userId: m.userId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        body: text.length > 60 ? `${text.substring(0, 60)}...` : text,
        metadata: { conversationId, senderId }
      });
    }

    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getOrCreateConversation = async (req: Request, res: Response): Promise<void> => {
  const patientId = req.user?.userId;
  const { doctorUserId, doctorProfileId } = req.body;

  if (!patientId) {
    res.status(401).json({ error: 'Unauthorized: User identity not found' });
    return;
  }

  let resolvedDoctorUserId = doctorUserId;

  // Resolve Doctor/Provider user ID from database profile ID if not provided as UUID
  if ((!resolvedDoctorUserId || !isUuid(String(resolvedDoctorUserId))) && doctorProfileId && isUuid(String(doctorProfileId))) {
    try {
      const doc = await db.doctorProfile.findUnique({
        where: { id: String(doctorProfileId) }
      });
      if (doc) {
        resolvedDoctorUserId = doc.userId;
      } else {
        const prov = await db.providerProfile.findUnique({
          where: { id: String(doctorProfileId) }
        });
        if (prov) {
          resolvedDoctorUserId = prov.userId;
        }
      }
    } catch (e) {
      console.error('Failed to resolve doctorUserId from doctorProfileId:', e);
    }
  }

  // Fallback default for mock target if still not resolved
  if (!resolvedDoctorUserId) {
    resolvedDoctorUserId = doctorProfileId || 'mock_doctor_user_id';
  }

  if (!isUuid(String(patientId)) || !isUuid(String(resolvedDoctorUserId))) {
    const mockId = `mock_conv_${patientId}_${resolvedDoctorUserId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.status(200).json({
      id: mockId,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [
        { userId: patientId, conversationId: mockId },
        { userId: resolvedDoctorUserId, conversationId: mockId }
      ]
    });
    return;
  }

  try {
    const existingMembers = await db.conversationMember.findMany({
      where: {
        userId: { in: [String(patientId), String(resolvedDoctorUserId)] }
      }
    });

    const counts: Record<string, number> = {};
    let matchingId: string | null = null;
    for (const m of existingMembers) {
      counts[m.conversationId] = (counts[m.conversationId] || 0) + 1;
      if (counts[m.conversationId] === 2) {
        matchingId = m.conversationId;
        break;
      }
    }

    let conversation;
    if (matchingId) {
      conversation = await db.conversation.findUnique({
        where: { id: matchingId },
        include: { members: true }
      });
    } else {
      conversation = await db.conversation.create({
        data: {
          members: {
            create: [
              { userId: String(patientId) },
              { userId: String(resolvedDoctorUserId) }
            ]
          }
        },
        include: { members: true }
      });
    }

    res.status(200).json(conversation);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

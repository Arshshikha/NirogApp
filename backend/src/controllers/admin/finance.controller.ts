import { Request, Response } from 'express';
import { db } from '../../config/db';
import { TransactionStatus, PaymentStatus } from '@prisma/client';

// Fetch all payment transactions
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  const { status, search, page = '1', limit = '10' } = req.query;

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status as PaymentStatus;
    }
    if (search) {
      whereClause.OR = [
        { gatewayOrderId: { contains: String(search), mode: 'insensitive' } },
        { gatewayPaymentId: { contains: String(search), mode: 'insensitive' } },
        { booking: { bookingReference: { contains: String(search), mode: 'insensitive' } } }
      ];
    }

    const total = await db.payment.count({ where: whereClause });
    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            patient: { include: { profile: true } },
            doctorProfile: { include: { user: { include: { profile: true } } } },
            providerProfile: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum,
    });

    res.status(200).json({
      payments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Fetch payout approval queue
export const getPayouts = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query; // INITIATED | PROCESSING | SUCCESS | FAILED

  try {
    const whereClause: any = {};
    if (status) {
      whereClause.status = status as TransactionStatus;
    }

    const payouts = await db.payout.findMany({
      where: whereClause,
      include: {
        doctorProfile: {
          include: {
            user: { include: { profile: true } }
          }
        },
        providerProfile: {
          include: {
            user: { include: { profile: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ payouts });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Process / Approve a payout with UTR number
export const approvePayout = async (req: Request, res: Response): Promise<void> => {
  const { payoutId } = req.params;
  const { utrNumber, bankAccount } = req.body;

  if (!utrNumber) {
    res.status(400).json({ error: 'UTR number tracking is required to confirm payouts' });
    return;
  }

  try {
    const payout = await db.payout.findUnique({ where: { id: payoutId } });
    if (!payout) {
      res.status(404).json({ error: 'Payout record not found' });
      return;
    }

    const updatedPayout = await db.payout.update({
      where: { id: payoutId },
      data: {
        status: TransactionStatus.SUCCESS,
        utrNumber,
        bankAccount: bankAccount || payout.bankAccount,
        processedAt: new Date(),
      }
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        actorId: req.user?.userId || null,
        action: 'APPROVE_PAYOUT',
        entityType: 'payout',
        entityId: payoutId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
        metadata: { amount: payout.netAmount, utrNumber }
      }
    });

    res.status(200).json({
      message: 'Payout successfully processed and marked as success',
      payout: updatedPayout,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Trigger and process a full refund
export const triggerRefund = async (req: Request, res: Response): Promise<void> => {
  const { paymentId } = req.params;
  const { reason, amount } = req.body;

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true }
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      res.status(400).json({ error: 'Payment is already fully refunded' });
      return;
    }

    const refundAmount = amount ? Number(amount) : Number(payment.amount);

    // Create Refund log in db
    const refund = await db.refund.create({
      data: {
        paymentId,
        amount: refundAmount,
        reason: reason || 'Admin initiated refund',
        status: PaymentStatus.REFUNDED,
        processedAt: new Date(),
        gatewayRefundId: `REF-${Date.now()}`,
      }
    });

    // Update payment status
    await db.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED }
    });

    // Update corresponding booking status to show refunded
    if (payment.bookingId) {
      await db.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: PaymentStatus.REFUNDED }
      });
    }

    // Write audit log
    await db.auditLog.create({
      data: {
        actorId: req.user?.userId || null,
        action: 'PROCESS_REFUND',
        entityType: 'refund',
        entityId: refund.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
        metadata: { paymentId, refundAmount, reason }
      }
    });

    res.status(200).json({
      message: 'Refund processed successfully',
      refund,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

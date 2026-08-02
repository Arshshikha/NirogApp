import { Request, Response } from 'express';
import { db } from '../../config/db';
import { UserRole, BookingStatus, PaymentStatus } from '@prisma/client';

// Search and list all users with filters
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const { search, role, isActive, page = '1', limit = '10' } = req.query;

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Filter clauses
    const whereClause: any = {
      deletedAt: null // Exclude soft-deleted records by default
    };

    if (search) {
      whereClause.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        {
          profile: {
            OR: [
              { firstName: { contains: String(search), mode: 'insensitive' } },
              { lastName: { contains: String(search), mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    if (role) {
      whereClause.role = String(role).toUpperCase() as UserRole;
    }

    if (isActive !== undefined) {
      whereClause.isActive = String(isActive) === 'true';
    }

    const totalUsers = await db.user.count({ where: whereClause });
    const users = await db.user.findMany({
      where: whereClause,
      include: {
        profile: {
          include: { address: true }
        },
        patientProfile: true,
        doctorProfile: true,
        studentProfile: true,
        providerProfile: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum,
    });

    res.status(200).json({
      users,
      pagination: {
        total: totalUsers,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalUsers / limitNum),
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Get a single user detail log including history
export const getUserDetail = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: { address: true }
        },
        patientProfile: {
          include: {
            medicalRecords: true,
          }
        },
        doctorProfile: {
          include: {
            availabilitySlots: true,
            payouts: true,
          }
        },
        studentProfile: {
          include: {
            courseEnrollments: {
              include: { course: { include: { content: true } } }
            }
          }
        },
        providerProfile: {
          include: {
            address: true,
            services: true,
            payouts: true,
          }
        },
        bookingsAsPatient: {
          include: {
            doctorProfile: {
              include: {
                user: {
                  include: { profile: true }
                }
              }
            },
            providerProfile: true,
          },
          orderBy: { scheduledDate: 'desc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Resolve booking list for Doctors/Providers as well
    let bookingsAsVendor: any[] = [];
    if (user.role === 'DOCTOR' && user.doctorProfile) {
      bookingsAsVendor = await db.booking.findMany({
        where: { doctorProfileId: user.doctorProfile.id },
        include: {
          patient: {
            include: { profile: true }
          }
        },
        orderBy: { scheduledDate: 'desc' }
      });
    } else if (user.role === 'PROVIDER' && user.providerProfile) {
      bookingsAsVendor = await db.booking.findMany({
        where: { providerProfileId: user.providerProfile.id },
        include: {
          patient: {
            include: { profile: true }
          }
        },
        orderBy: { scheduledDate: 'desc' }
      });
    }

    const { passwordHash, ...safeUser } = user;
    res.status(200).json({
      user: safeUser,
      bookingsAsVendor,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Toggle user activation status (block/unblock)
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { isActive } = req.body; // boolean

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { isActive: !!isActive },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        actorId: req.user?.userId || null,
        action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        entityType: 'user',
        entityId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
        metadata: { targetUserEmail: user.email }
      }
    });

    res.status(200).json({
      message: `User status successfully toggled to ${isActive ? 'Active' : 'Inactive'}`,
      user: { id: updatedUser.id, email: updatedUser.email, isActive: updatedUser.isActive }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Soft delete a user account
export const softDeleteUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await db.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        actorId: req.user?.userId || null,
        action: 'SOFT_DELETE_USER',
        entityType: 'user',
        entityId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
        metadata: { targetUserEmail: user.email }
      }
    });

    res.status(200).json({ message: 'User account soft-deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Global Booking tracker search and filters
export const getBookings = async (req: Request, res: Response): Promise<void> => {
  const { search, status, type, page = '1', limit = '10' } = req.query;

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status as BookingStatus;
    }

    if (type) {
      whereClause.appointmentType = type as any;
    }

    if (search) {
      whereClause.OR = [
        { bookingReference: { contains: String(search), mode: 'insensitive' } },
        { patient: { email: { contains: String(search), mode: 'insensitive' } } },
        { patient: { profile: { firstName: { contains: String(search), mode: 'insensitive' } } } },
        { patient: { profile: { lastName: { contains: String(search), mode: 'insensitive' } } } },
      ];
    }

    const total = await db.booking.count({ where: whereClause });
    const bookings = await db.booking.findMany({
      where: whereClause,
      include: {
        patient: {
          include: { profile: true }
        },
        doctorProfile: {
          include: {
            user: { include: { profile: true } }
          }
        },
        providerProfile: true,
        payment: true,
      },
      orderBy: { scheduledDate: 'desc' },
      skip: offset,
      take: limitNum,
    });

    res.status(200).json({
      bookings,
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

// Update Booking Status manually (Complete, Confirm, Cancel, Reschedule)
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.params;
  const { status, cancellationReason } = req.body;

  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: status as BookingStatus,
        cancellationReason: cancellationReason || booking.cancellationReason,
        completedAt: status === BookingStatus.COMPLETED ? new Date() : booking.completedAt,
      }
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        actorId: req.user?.userId || null,
        action: 'UPDATE_BOOKING_STATUS',
        entityType: 'booking',
        entityId: bookingId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
        metadata: { oldStatus: booking.status, newStatus: status }
      }
    });

    // Auto-refund trigger flow if booking is cancelled and payment was already paid
    if (
      (status === BookingStatus.CANCELLED_BY_PATIENT || status === BookingStatus.CANCELLED_BY_PROVIDER || status === BookingStatus.REJECTED) &&
      booking.paymentStatus === PaymentStatus.PAID &&
      booking.payment
    ) {
      // Create Refund record
      const refundAmount = Number(booking.totalFee);
      const refund = await db.refund.create({
        data: {
          paymentId: booking.payment.id,
          amount: refundAmount,
          reason: cancellationReason || 'Booking cancelled by administrator',
          status: PaymentStatus.REFUNDED,
          processedAt: new Date(),
          gatewayRefundId: `REF-AUTO-${Date.now()}`
        }
      });

      // Update payment status
      await db.payment.update({
        where: { id: booking.payment.id },
        data: { status: PaymentStatus.REFUNDED }
      });

      // Update booking paymentStatus
      await db.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: PaymentStatus.REFUNDED }
      });

      res.status(200).json({
        message: `Booking status updated to ${status} and automatic refund of INR ${refundAmount} has been processed successfully`,
        booking: { ...updatedBooking, paymentStatus: PaymentStatus.REFUNDED },
        refund
      });
      return;
    }

    res.status(200).json({
      message: `Booking status updated successfully to ${status}`,
      booking: updatedBooking
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

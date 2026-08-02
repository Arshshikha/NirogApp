import { Request, Response } from 'express';
import { db } from '../../config/db';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. User counters categorized by role
    const userGroups = await db.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    const userCounts = {
      PATIENT: 0,
      DOCTOR: 0,
      STUDENT: 0,
      PROVIDER: 0,
      ADMIN: 0,
    };

    userGroups.forEach((group) => {
      const roleName = group.role as keyof typeof userCounts;
      if (userCounts[roleName] !== undefined) {
        userCounts[roleName] = group._count.id;
      }
    });

    const totalUsers = Object.values(userCounts).reduce((a, b) => a + b, 0);

    // 2. Pending verifications
    const pendingDoctors = await db.doctorProfile.count({
      where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
    });
    const pendingProviders = await db.providerProfile.count({
      where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
    });
    const pendingStudents = await db.studentProfile.count({
      where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
    });

    const pendingVerifications = pendingDoctors + pendingProviders + pendingStudents;

    // 3. Unresolved reports
    const unresolvedReports = await db.report.count({
      where: { isResolved: false },
    });

    // 4. Booking statistics
    const totalBookings = await db.booking.count();
    
    const bookingsByType = await db.booking.groupBy({
      by: ['appointmentType'],
      _count: {
        id: true,
      },
    });

    const bookingsByStatus = await db.booking.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // 5. Financial Summary
    const salesAggregate = await db.payment.aggregate({
      where: { status: 'PAID' },
      _sum: {
        amount: true,
      },
    });

    const payoutsAggregate = await db.payout.aggregate({
      where: { status: 'SUCCESS' },
      _sum: {
        amount: true,
        platformFee: true,
        netAmount: true,
      },
    });

    const totalSales = Number(salesAggregate._sum.amount || 0);
    const totalPayouts = Number(payoutsAggregate._sum.netAmount || 0);
    const totalPlatformFees = Number(payoutsAggregate._sum.platformFee || 0);
    
    // 6. Trend Charts: Daily user registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const registrations = await db.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group registrations by date string (YYYY-MM-DD)
    const regTrendMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      regTrendMap[dateStr] = 0;
    }

    registrations.forEach((reg) => {
      const dateStr = reg.createdAt.toISOString().split('T')[0];
      if (regTrendMap[dateStr] !== undefined) {
        regTrendMap[dateStr]++;
      }
    });

    const userRegistrationTrend = Object.keys(regTrendMap)
      .sort()
      .map((date) => ({
        date,
        count: regTrendMap[date],
      }));

    // 7. Monthly Revenue Trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const payments = await db.payment.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        paidAt: true,
      },
      orderBy: { paidAt: 'asc' },
    });

    const revenueTrendMap: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      revenueTrendMap[monthKey] = 0;
    }

    payments.forEach((p) => {
      if (p.paidAt) {
        const monthKey = `${monthNames[p.paidAt.getMonth()]} ${p.paidAt.getFullYear()}`;
        if (revenueTrendMap[monthKey] !== undefined) {
          revenueTrendMap[monthKey] += Number(p.amount);
        }
      }
    });

    const monthlyRevenueTrend = Object.keys(revenueTrendMap)
      .map((month) => ({
        month,
        revenue: revenueTrendMap[month],
      }));

    res.status(200).json({
      summary: {
        totalUsers,
        userCounts,
        pendingVerifications,
        unresolvedReports,
        pendingDetails: {
          doctors: pendingDoctors,
          providers: pendingProviders,
          students: pendingStudents,
        },
      },
      bookings: {
        totalBookings,
        byType: bookingsByType,
        byStatus: bookingsByStatus,
      },
      financials: {
        totalSales,
        totalPayouts,
        totalPlatformFees,
        netProfit: totalSales - totalPayouts,
      },
      trends: {
        userRegistrationTrend,
        monthlyRevenueTrend,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

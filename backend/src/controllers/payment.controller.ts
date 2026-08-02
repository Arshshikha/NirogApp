import { Request, Response } from 'express';
import { db } from '../config/db';
import { BookingStatus, PaymentStatus, TransactionType, TransactionStatus, AppointmentType } from '@prisma/client';
import { createNotificationWithPush } from '../utils/pushNotification';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const formatTimeToDb = (timeStr: string): string => {
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) {
    return cleaned.substring(0, 5);
  }
  let hour = parseInt(match[1]);
  const minute = match[2];
  const ampm = match[3];

  if (ampm === 'PM' && hour < 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }

  const hourStr = hour.toString().padStart(2, '0');
  return `${hourStr}:${minute}`;
};

const mapTypeToEnum = (typeStr: string): AppointmentType => {
  const t = typeStr.toUpperCase();
  if (t.includes('VIDEO')) return AppointmentType.ONLINE_VIDEO;
  if (t.includes('CHAT')) return AppointmentType.ONLINE_CHAT;
  if (t.includes('HOSPITAL')) return AppointmentType.HOSPITAL_VISIT;
  if (t.includes('LAB') || t.includes('TEST')) return AppointmentType.LAB_TEST;
  if (t.includes('HOME')) return AppointmentType.HOME_VISIT;
  return AppointmentType.IN_PERSON;
};

export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  const patientId = req.user?.userId;
  const { 
    doctorProfileId, 
    providerProfileId, 
    serviceId, 
    appointmentType, 
    scheduledDate, 
    scheduledTime, 
    durationMinutes, 
    patientNotes,
    payOnsite
  } = req.body;

  if (!patientId || !appointmentType || !scheduledDate || !scheduledTime) {
    res.status(400).json({ error: 'Required fields missing: appointmentType, scheduledDate, scheduledTime' });
    return;
  }

  try {
    let fee = 500.0; // default fallback

    // 1. Resolve fee from Doctor Profile
    if (doctorProfileId) {
      const doc = await db.doctorProfile.findUnique({
        where: { id: doctorProfileId }
      });
      if (doc) {
        const typeEnum = mapTypeToEnum(appointmentType);
        const isOnline = typeEnum === AppointmentType.ONLINE_VIDEO || typeEnum === AppointmentType.ONLINE_CHAT;
        fee = isOnline ? parseFloat(doc.onlineConsultFee.toString()) : parseFloat(doc.consultationFee.toString());
        if (isNaN(fee) || fee <= 0) {
          fee = 500.0;
        }
      }
    } 
    // 2. Resolve fee from Provider Service
    else if (serviceId) {
      const service = await db.providerService.findUnique({
        where: { id: serviceId }
      });
      if (service && service.price) {
        fee = parseFloat(service.price.toString());
      }
    }

    const dateStr = new Date(scheduledDate).toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingReference = `NRG-${dateStr}-${randStr}`;

    if (payOnsite) {
      // Create booking directly in CONFIRMED status for onsite payment
      const booking = await db.booking.create({
        data: {
          bookingReference,
          patientId,
          doctorProfileId: doctorProfileId || null,
          providerProfileId: providerProfileId || null,
          serviceId: serviceId || null,
          appointmentType: mapTypeToEnum(appointmentType),
          scheduledDate: new Date(scheduledDate),
          scheduledTime: formatTimeToDb(scheduledTime),
          durationMinutes: durationMinutes || 15,
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.UNPAID,
          totalFee: fee,
          patientNotes: patientNotes || null
        }
      });

      // Create payment in UNPAID status with method CASH
      const payment = await db.payment.create({
        data: {
          bookingId: booking.id,
          amount: fee,
          currency: 'INR',
          status: PaymentStatus.UNPAID,
          method: 'CASH',
          gatewayOrderId: `onsite_${Date.now()}`
        }
      });

      // Notify doctor/provider
      if (doctorProfileId) {
        const doc = await db.doctorProfile.findUnique({ where: { id: doctorProfileId } });
        if (doc) {
          await createNotificationWithPush({
            userId: doc.userId,
            type: 'BOOKING_CONFIRMATION',
            title: 'New Appointment Booked (Pay Onsite)',
            body: `A new booking has been confirmed for ${scheduledDate} at ${scheduledTime} (payment onsite).`
          });
        }
      } else if (providerProfileId) {
        const prov = await db.providerProfile.findUnique({ where: { id: providerProfileId } });
        if (prov) {
          await createNotificationWithPush({
            userId: prov.userId,
            type: 'BOOKING_CONFIRMATION',
            title: 'New Lab Booking (Pay Onsite)',
            body: `A new lab booking has been confirmed for ${scheduledDate} at ${scheduledTime} (payment onsite).`
          });
        }
      }

      // Notify patient
      await createNotificationWithPush({
        userId: patientId,
        type: 'BOOKING_CONFIRMATION',
        title: 'Appointment Booked',
        body: `Your booking for ${appointmentType} on ${scheduledDate} at ${scheduledTime} is confirmed. Please pay onsite.`
      });

      res.status(200).json({
        bookingId: booking.id,
        paymentId: payment.id,
        payOnsite: true
      });
      return;
    }

    // Create booking in PENDING status for online payment flow
    const booking = await db.booking.create({
      data: {
        bookingReference,
        patientId,
        doctorProfileId: doctorProfileId || null,
        providerProfileId: providerProfileId || null,
        serviceId: serviceId || null,
        appointmentType: mapTypeToEnum(appointmentType),
        scheduledDate: new Date(scheduledDate),
        scheduledTime: formatTimeToDb(scheduledTime),
        durationMinutes: durationMinutes || 15,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalFee: fee,
        patientNotes: patientNotes || null
      }
    });

    // Create payment in PENDING status
    const payment = await db.payment.create({
      data: {
        bookingId: booking.id,
        amount: fee,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        gatewayName: 'razorpay',
        gatewayOrderId: `order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      }
    });

    res.status(200).json({
      paymentId: payment.id,
      gatewayOrderId: payment.gatewayOrderId,
      amount: fee,
      bookingId: booking.id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  const { paymentId, gatewayPaymentId, gatewaySignature, status } = req.body;

  if (!paymentId || !status) {
    res.status(400).json({ error: 'Required fields missing: paymentId, status' });
    return;
  }

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true }
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment record not found' });
      return;
    }

    if (status.toUpperCase() === 'SUCCESS') {
      const amountFloat = parseFloat(payment.amount.toString());
      const platformFee = amountFloat * 0.10; // 10% Platform Commission
      const netAmount = amountFloat - platformFee; // Net Doctor Payout (90%)

      // 1. Update Payment Status to PAID
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          gatewayPaymentId: gatewayPaymentId || null,
          gatewaySignature: gatewaySignature || null,
          paidAt: new Date()
        }
      });

      // 2. Update Booking Status to CONFIRMED and PAID
      const updatedBooking = await db.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID
        }
      });

      // 3. Create Transaction log for full payment
      await db.transaction.create({
        data: {
          paymentId,
          type: TransactionType.BOOKING_PAYMENT,
          status: TransactionStatus.SUCCESS,
          amount: payment.amount,
          currency: 'INR'
        }
      });

      // 4. Create Transaction log for platform fee (10% commission)
      await db.transaction.create({
        data: {
          paymentId,
          type: TransactionType.PLATFORM_FEE,
          status: TransactionStatus.SUCCESS,
          amount: platformFee,
          currency: 'INR'
        }
      });

      // 5. Create Payout log for doctor / provider
      await db.payout.create({
        data: {
          doctorProfileId: payment.booking.doctorProfileId,
          providerProfileId: payment.booking.providerProfileId,
          amount: payment.amount,
          platformFee,
          netAmount,
          status: TransactionStatus.SUCCESS,
          processedAt: new Date()
        }
      });

      // Notify patient
      await createNotificationWithPush({
        userId: payment.booking.patientId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        body: `Payment of ₹${payment.amount} for booking Ref: ${payment.booking.bookingReference} was successful.`
      });

      // Notify doctor/provider
      let targetUserId: string | undefined = undefined;
      if (payment.booking.doctorProfileId) {
        const doc = await db.doctorProfile.findUnique({ where: { id: payment.booking.doctorProfileId } });
        if (doc) targetUserId = doc.userId;
      } else if (payment.booking.providerProfileId) {
        const prov = await db.providerProfile.findUnique({ where: { id: payment.booking.providerProfileId } });
        if (prov) targetUserId = prov.userId;
      }
      
      if (targetUserId) {
        await createNotificationWithPush({
          userId: targetUserId,
          type: 'PAYMENT_SUCCESS',
          title: 'Payment Received',
          body: `You received ₹${netAmount.toFixed(2)} (after 10% platform fee) for booking Ref: ${payment.booking.bookingReference}.`
        });
      }

      res.status(200).json({
        message: 'Payment confirmed and booking finalized',
        booking: updatedBooking,
        payment: updatedPayment
      });
    } else {
      // Payment Failed
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.FAILED }
      });

      const updatedBooking = await db.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.REJECTED,
          paymentStatus: PaymentStatus.FAILED
        }
      });

      await db.transaction.create({
        data: {
          paymentId,
          type: TransactionType.BOOKING_PAYMENT,
          status: TransactionStatus.FAILED,
          amount: payment.amount,
          currency: 'INR'
        }
      });

      // Notify patient
      await createNotificationWithPush({
        userId: payment.booking.patientId,
        type: 'PAYMENT_FAILURE',
        title: 'Payment Failed',
        body: `Payment of ₹${payment.amount} for booking Ref: ${payment.booking.bookingReference} has failed.`
      });

      res.status(200).json({
        message: 'Payment failed and booking cancelled',
        booking: updatedBooking,
        payment: updatedPayment
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getEarnings = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId || !role) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    let payouts: any[] = [];
    if (role === 'DOCTOR') {
      const doc = await db.doctorProfile.findUnique({
        where: { userId }
      });
      if (doc) {
        payouts = await db.payout.findMany({
          where: { doctorProfileId: doc.id },
          orderBy: { createdAt: 'desc' }
        });
      }
    } else if (role === 'PROVIDER') {
      const prov = await db.providerProfile.findUnique({
        where: { userId }
      });
      if (prov) {
        payouts = await db.payout.findMany({
          where: { providerProfileId: prov.id },
          orderBy: { createdAt: 'desc' }
        });
      }
    }

    // Sum totals
    let totalGross = 0;
    let totalCommission = 0;
    let totalEarnings = 0;

    payouts.forEach(p => {
      totalGross += parseFloat(p.amount.toString()) || 0;
      totalCommission += parseFloat(p.platformFee.toString()) || 0;
      totalEarnings += parseFloat(p.netAmount.toString()) || 0;
    });

    res.status(200).json({
      totalGross,
      totalCommission,
      totalEarnings,
      payouts
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getPayments = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const role = req.user?.role || 'PATIENT';

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User identity not found' });
    return;
  }

  try {
    let payments;
    const roleUpper = String(role).toUpperCase();

    if (roleUpper === 'PATIENT') {
      payments = await db.payment.findMany({
        where: {
          booking: {
            patientId: String(userId)
          }
        },
        include: {
          booking: {
            include: {
              doctorProfile: {
                include: {
                  user: {
                    include: { profile: true }
                  }
                }
              },
              providerProfile: {
                include: {
                  user: {
                    include: { profile: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      res.status(403).json({ error: 'Forbidden: Only patients can view payment history' });
      return;
    }

    res.status(200).json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// ─── Razorpay Checkout & Callback Endpoints ────────────────────────────────────

export const razorpayCheckout = async (req: Request, res: Response): Promise<void> => {
  const { courseId, userId, amount } = req.query;

  if (!courseId || !userId || !amount) {
    res.status(400).send('<h1>Bad Request</h1><p>Missing required parameters: courseId, userId, amount</p>');
    return;
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TFPJfIO56NxdBw',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'wJ93ZPkGEXPMEHEO5wmZfWO8',
    });

    const pricePaise = Math.round(parseFloat(String(amount)) * 100);

    const order = await razorpay.orders.create({
      amount: pricePaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nirog Academy Payment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f0f9ff; text-align: center; padding: 40px 20px; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #0ea5e9; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15); display: inline-block; max-width: 400px; width: 100%; box-sizing: border-box; }
          h2 { color: #0f172a; margin-bottom: 8px; font-size: 20px; }
          p { color: #64748b; font-size: 14px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Secure Payment</h2>
          <p>Opening payment gateway overlay. Please do not close this window...</p>
          <div class="loader"></div>
        </div>

        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
          var options = {
            "key": "${process.env.RAZORPAY_KEY_ID || 'rzp_test_TFPJfIO56NxdBw'}",
            "amount": ${pricePaise},
            "currency": "INR",
            "name": "Nirog Academy",
            "description": "Premium Upgrade",
            "order_id": "${order.id}",
            "handler": function (response) {
              const callbackUrl = "/api/payments/razorpay-callback" +
                "?razorpay_payment_id=" + response.razorpay_payment_id +
                "&razorpay_order_id=" + response.razorpay_order_id +
                "&razorpay_signature=" + response.razorpay_signature +
                "&courseId=${courseId}" +
                "&userId=${userId}";
              window.location.href = callbackUrl;
            },
            "prefill": {
              "email": "student@nirog.com"
            },
            "theme": { "color": "#0ea5e9" },
            "modal": {
              "ondismiss": function() {
                window.location.href = "/api/payments/razorpay-callback?status=CANCELLED";
              }
            }
          };
          var rzp = new Razorpay(options);
          rzp.open();
        </script>
      </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Razorpay checkout order creation error:', err);
    res.status(500).send(`<h1>Payment Error</h1><p>${err.message || 'Internal server error'}</p>`);
  }
};

export const razorpayCallback = async (req: Request, res: Response): Promise<void> => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, courseId, userId, status } = req.query;

  if (status === 'CANCELLED') {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px; background-color: #fff7ed; }
          .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: inline-block; max-width: 400px; width: 100%; box-sizing: border-box; }
          h1 { color: #ea580c; font-size: 22px; margin-top: 0; }
          p { color: #7c2d12; font-size: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Payment Cancelled</h1>
          <p>The payment process was cancelled. You can safely close this browser window and try again in the app.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !courseId || !userId) {
    res.status(400).send('<h1>Validation Error</h1><p>Missing payment signature parameters</p>');
    return;
  }

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'wJ93ZPkGEXPMEHEO5wmZfWO8';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400).send('<h1>Signature Verification Failed</h1><p>Payment signature mismatch. Please contact support.</p>');
      return;
    }

    const student = await db.studentProfile.findUnique({
      where: { userId: String(userId) }
    });

    if (!student) {
      res.status(404).send('<h1>Student Profile Not Found</h1><p>Unable to locate student profile associated with the user.</p>');
      return;
    }

    await db.courseEnrollment.upsert({
      where: {
        courseId_studentProfileId: {
          courseId: String(courseId),
          studentProfileId: student.id
        }
      },
      update: {
        isPremiumUnlocked: true
      },
      create: {
        courseId: String(courseId),
        studentProfileId: student.id,
        isPremiumUnlocked: true
      }
    });

    await db.transaction.create({
      data: {
        type: TransactionType.COURSE_PURCHASE,
        status: TransactionStatus.SUCCESS,
        amount: 499.00,
        currency: 'INR',
        metadata: {
          courseId,
          userId,
          razorpay_payment_id,
          razorpay_order_id
        }
      }
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px; background-color: #f0f9ff; }
          .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); display: inline-block; max-width: 400px; width: 100%; box-sizing: border-box; }
          h1 { color: #10b981; font-size: 22px; margin-top: 0; }
          p { color: #047857; font-size: 14px; line-height: 1.5; }
          .checkmark { width: 50px; height: 50px; border-radius: 50%; background-color: #d1fae5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin: 0 auto 15px auto; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="checkmark">✓</div>
          <h1>Upgrade Successful!</h1>
          <p>Thank you! Your payment has been verified and course content is unlocked.</p>
          <p style="margin-top: 10px; font-weight: bold;">Please close this window to return to the app.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Razorpay Callback handling error:', err);
    res.status(500).send(`<h1>Verification Error</h1><p>${err.message || 'Internal server error'}</p>`);
  }
};

export const razorpayPatientCheckout = async (req: Request, res: Response): Promise<void> => {
  const { paymentId } = req.query;

  if (!paymentId) {
    res.status(400).send('<h1>Bad Request</h1><p>Missing required parameter: paymentId</p>');
    return;
  }

  try {
    const payment = await db.payment.findUnique({
      where: { id: String(paymentId) },
      include: { booking: true }
    });

    if (!payment) {
      res.status(404).send('<h1>Payment Record Not Found</h1><p>Unable to locate the booking payment record.</p>');
      return;
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TFPJfIO56NxdBw',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'wJ93ZPkGEXPMEHEO5wmZfWO8',
    });

    const pricePaise = Math.round(parseFloat(payment.amount.toString()) * 100);

    const order = await razorpay.orders.create({
      amount: pricePaise,
      currency: 'INR',
      receipt: payment.id,
    });

    await db.payment.update({
      where: { id: String(paymentId) },
      data: { gatewayOrderId: order.id }
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nirog Academy Booking Payment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f0f9ff; text-align: center; padding: 40px 20px; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #0ea5e9; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15); display: inline-block; max-width: 400px; width: 100%; box-sizing: border-box; }
          h2 { color: #0f172a; margin-bottom: 8px; font-size: 20px; }
          p { color: #64748b; font-size: 14px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Secure Booking Payment</h2>
          <p>Opening payment gateway overlay. Please do not close this window...</p>
          <div class="loader"></div>
        </div>

        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
          var options = {
            "key": "${process.env.RAZORPAY_KEY_ID || 'rzp_test_TFPJfIO56NxdBw'}",
            "amount": ${pricePaise},
            "currency": "INR",
            "name": "Nirog Academy",
            "description": "Appointment Booking",
            "order_id": "${order.id}",
            "handler": function (response) {
              const callbackUrl = "/api/payments/razorpay-patient-callback" +
                "?razorpay_payment_id=" + response.razorpay_payment_id +
                "&razorpay_order_id=" + response.razorpay_order_id +
                "&razorpay_signature=" + response.razorpay_signature +
                "&paymentId=${paymentId}";
              window.location.href = callbackUrl;
            },
            "prefill": {
              "email": "patient@nirog.com"
            },
            "theme": { "color": "#0ea5e9" },
            "modal": {
              "ondismiss": function() {
                window.location.href = "/api/payments/razorpay-patient-callback?status=CANCELLED";
              }
            }
          };
          var rzp = new Razorpay(options);
          rzp.open();
        </script>
      </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Razorpay patient checkout error:', err);
    res.status(500).send(`<h1>Payment Error</h1><p>${err.message || 'Internal server error'}</p>`);
  }
};

export const razorpayPatientCallback = async (req: Request, res: Response): Promise<void> => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, paymentId, status } = req.query;

  if (status === 'CANCELLED') {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px; background-color: #fff7ed; }
          .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: inline-block; max-width: 400px; width: 100%; box-sizing: border-box; }
          h1 { color: #ea580c; font-size: 22px; margin-top: 0; }
          p { color: #7c2d12; font-size: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Payment Cancelled</h1>
          <p>The booking payment process was cancelled. You can safely close this browser window and retry in the app.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !paymentId) {
    res.status(400).send('<h1>Validation Error</h1><p>Missing signature parameters</p>');
    return;
  }

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'wJ93ZPkGEXPMEHEO5wmZfWO8';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400).send('<h1>Signature Verification Failed</h1><p>Payment signature mismatch.</p>');
      return;
    }

    const payment = await db.payment.findUnique({
      where: { id: String(paymentId) },
      include: { booking: true }
    });

    if (!payment) {
      res.status(404).send('<h1>Payment Record Not Found</h1><p>Could not load associated booking payment.</p>');
      return;
    }

    const amountFloat = parseFloat(payment.amount.toString());
    const platformFee = amountFloat * 0.10;
    const netAmount = amountFloat - platformFee;

    // 1. Update Payment Status to PAID
    await db.payment.update({
      where: { id: String(paymentId) },
      data: {
        status: PaymentStatus.PAID,
        gatewayPaymentId: String(razorpay_payment_id),
        gatewaySignature: String(razorpay_signature),
        paidAt: new Date()
      }
    });

    // 2. Update Booking Status to CONFIRMED and PAID
    await db.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID
      }
    });

    // 3. Create Transaction log for full payment
    await db.transaction.create({
      data: {
        paymentId: String(paymentId),
        type: TransactionType.BOOKING_PAYMENT,
        status: TransactionStatus.SUCCESS,
        amount: payment.amount,
        currency: 'INR'
      }
    });

    // 4. Create Transaction log for platform fee (10% commission)
    await db.transaction.create({
      data: {
        paymentId: String(paymentId),
        type: TransactionType.PLATFORM_FEE,
        status: TransactionStatus.SUCCESS,
        amount: platformFee,
        currency: 'INR'
      }
    });

    // 5. Create Payout log for doctor / provider
    await db.payout.create({
      data: {
        doctorProfileId: payment.booking.doctorProfileId,
        providerProfileId: payment.booking.providerProfileId,
        amount: payment.amount,
        platformFee,
        netAmount,
        status: TransactionStatus.SUCCESS,
        processedAt: new Date()
      }
    });

    // 6. Notify patient
    await createNotificationWithPush({
      userId: payment.booking.patientId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Successful',
      body: `Payment of ₹${payment.amount} for booking Ref: ${payment.booking.bookingReference} was successful.`
    });

    // 7. Notify doctor/provider
    let targetUserId: string | undefined = undefined;
    if (payment.booking.doctorProfileId) {
      const doc = await db.doctorProfile.findUnique({ where: { id: payment.booking.doctorProfileId } });
      if (doc) targetUserId = doc.userId;
    } else if (payment.booking.providerProfileId) {
      const prov = await db.providerProfile.findUnique({ where: { id: payment.booking.providerProfileId } });
      if (prov) targetUserId = prov.userId;
    }
    
    if (targetUserId) {
      await createNotificationWithPush({
        userId: targetUserId,
        type: 'BOOKING_CONFIRMATION',
        title: 'Appointment Booked',
        body: `A new booking (Ref: ${payment.booking.bookingReference}) has been confirmed.`
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px; background-color: #f0f9ff; }
          .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); display: inline-block; max-width: 400px; width: 100%; box-sizing: border-box; }
          h1 { color: #10b981; font-size: 22px; margin-top: 0; }
          p { color: #047857; font-size: 14px; line-height: 1.5; }
          .checkmark { width: 50px; height: 50px; border-radius: 50%; background-color: #d1fae5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin: 0 auto 15px auto; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="checkmark">✓</div>
          <h1>Booking Confirmed!</h1>
          <p>Thank you! Your payment has been verified and booking is successfully confirmed.</p>
          <p style="margin-top: 10px; font-weight: bold;">Please close this window to return to the app.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Razorpay patient Callback handling error:', err);
    res.status(500).send(`<h1>Verification Error</h1><p>${err.message || 'Internal server error'}</p>`);
  }
};

export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  const { paymentId } = req.params;

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    res.status(200).json({ status: payment.status });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

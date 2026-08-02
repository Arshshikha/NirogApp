import { Request, Response } from 'express';
import { db } from '../config/db';

export const submitReview = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { bookingId, rating, comment } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!bookingId || !rating) {
    res.status(400).json({ error: 'Required fields missing: bookingId, rating' });
    return;
  }

  const parsedRating = parseInt(rating);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    return;
  }

  try {
    // 1. Resolve Patient Profile ID
    const patient = await db.patientProfile.findUnique({
      where: { userId }
    });

    if (!patient) {
      res.status(404).json({ error: 'Patient profile not found' });
      return;
    }

    // 2. Fetch the Booking to confirm owner and completeness
    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking record not found' });
      return;
    }

    if (booking.patientId !== patient.userId) {
      res.status(403).json({ error: 'You are not authorized to review this booking' });
      return;
    }

    // 3. Prevent duplicate reviews for the same booking
    const existingReview = await db.review.findUnique({
      where: { bookingId }
    });

    if (existingReview) {
      res.status(400).json({ error: 'You have already submitted a review for this booking' });
      return;
    }

    // 4. Create the Review record
    const review = await db.review.create({
      data: {
        bookingId,
        patientProfileId: patient.id,
        doctorProfileId: booking.doctorProfileId || null,
        providerProfileId: booking.providerProfileId || null,
        rating: parsedRating,
        comment: comment || null,
        isVerified: true
      }
    });

    // 5. If it's a Doctor Booking, update DoctorProfile avgRating and totalReviews
    if (booking.doctorProfileId) {
      const doctorReviews = await db.review.findMany({
        where: { doctorProfileId: booking.doctorProfileId }
      });
      const totalReviews = doctorReviews.length;
      const sumRating = doctorReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalReviews > 0 ? (sumRating / totalReviews) : 5.0;

      await db.doctorProfile.update({
        where: { id: booking.doctorProfileId },
        data: {
          totalReviews,
          avgRating
        }
      });
    }

    // 6. If it's a Provider Booking, update ProviderProfile avgRating and totalReviews
    if (booking.providerProfileId) {
      const providerReviews = await db.review.findMany({
        where: { providerProfileId: booking.providerProfileId }
      });
      const totalReviews = providerReviews.length;
      const sumRating = providerReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalReviews > 0 ? (sumRating / totalReviews) : 5.0;

      await db.providerProfile.update({
        where: { id: booking.providerProfileId },
        data: {
          totalReviews,
          avgRating
        }
      });
    }

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  const { doctorProfileId, providerProfileId } = req.query;

  try {
    let reviews: any[] = [];
    if (doctorProfileId) {
      reviews = await db.review.findMany({
        where: { doctorProfileId: doctorProfileId as string },
        include: {
          patientProfile: {
            include: {
              user: {
                select: {
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (providerProfileId) {
      reviews = await db.review.findMany({
        where: { providerProfileId: providerProfileId as string },
        include: {
          patientProfile: {
            include: {
              user: {
                select: {
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

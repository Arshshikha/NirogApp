import { Request, Response } from 'express';
import { db } from '../../config/db';
import { VerificationStatus } from '@prisma/client';

// Get a consolidated queue of all profile verification requests
export const getVerificationQueue = async (req: Request, res: Response): Promise<void> => {
  const { status, type } = req.query;

  try {
    const filterStatus = status ? (String(status).toUpperCase() as VerificationStatus) : undefined;
    const filterType = type ? String(type).toLowerCase() : undefined; // "doctor", "student", "provider"

    let doctors: any[] = [];
    let students: any[] = [];
    let providers: any[] = [];

    // Fetch doctors if type filter is empty or matches 'doctor'
    if (!filterType || filterType === 'doctor') {
      doctors = await db.doctorProfile.findMany({
        where: filterStatus ? { verificationStatus: filterStatus } : { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
        include: {
          user: {
            include: {
              profile: {
                include: { address: true }
              }
            }
          },
          licenseDocument: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Fetch students if type filter is empty or matches 'student'
    if (!filterType || filterType === 'student') {
      students = await db.studentProfile.findMany({
        where: filterStatus ? { verificationStatus: filterStatus } : { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
        include: {
          user: {
            include: {
              profile: {
                include: { address: true }
              }
            }
          },
          studentIdFile: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Fetch providers if type filter is empty or matches 'provider'
    if (!filterType || filterType === 'provider') {
      providers = await db.providerProfile.findMany({
        where: filterStatus ? { verificationStatus: filterStatus } : { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
        include: {
          user: {
            include: {
              profile: {
                include: { address: true }
              }
            }
          },
          permitFile: true,
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Map profiles into a unified queue structure
    const queue = [
      ...doctors.map(d => ({
        id: d.id,
        userId: d.userId,
        type: 'DOCTOR',
        name: `${d.user.profile?.firstName || ''} ${d.user.profile?.lastName || ''}`.trim() || d.user.email,
        email: d.user.email,
        registrationNumber: d.registrationNumber,
        specialties: d.specialties,
        category: d.category,
        experience: d.experience,
        verificationStatus: d.verificationStatus,
        documentUrl: d.licenseDocument?.publicUrl || d.licenseDocument?.storagePath || null,
        documentName: d.licenseDocument?.originalName || 'License Document',
        createdAt: d.createdAt,
      })),
      ...students.map(s => ({
        id: s.id,
        userId: s.userId,
        type: 'STUDENT',
        name: `${s.user.profile?.firstName || ''} ${s.user.profile?.lastName || ''}`.trim() || s.user.email,
        email: s.user.email,
        registrationNumber: s.enrollmentNumber || 'N/A',
        institutionName: s.institutionName,
        courseOfStudy: s.courseOfStudy,
        yearOfStudy: s.yearOfStudy,
        verificationStatus: s.verificationStatus,
        documentUrl: s.studentIdFile?.publicUrl || s.studentIdFile?.storagePath || null,
        documentName: s.studentIdFile?.originalName || 'Student ID Card',
        createdAt: s.createdAt,
      })),
      ...providers.map(p => ({
        id: p.id,
        userId: p.userId,
        type: 'PROVIDER',
        name: p.legalName || `${p.user.profile?.firstName || ''} ${p.user.profile?.lastName || ''}`.trim() || p.user.email,
        email: p.user.email,
        registrationNumber: p.registrationNumber || 'N/A',
        providerType: p.providerType,
        verificationStatus: p.verificationStatus,
        documentUrl: p.permitFile?.publicUrl || p.permitFile?.storagePath || null,
        documentName: p.permitFile?.originalName || 'Permit Document',
        createdAt: p.createdAt,
      }))
    ];

    // Sort combined queue by oldest first to resolve queues first-in-first-out
    queue.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.status(200).json({ queue });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Process an approval or rejection status update
export const processVerification = async (req: Request, res: Response): Promise<void> => {
  const { profileId } = req.params;
  const { type, action, notes } = req.body; // type: "DOCTOR" | "STUDENT" | "PROVIDER", action: "APPROVE" | "REJECT", notes: string

  try {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      res.status(401).json({ error: 'Unauthorized admin user' });
      return;
    }

    // Resolve current admin profile
    let adminProfile = await db.adminProfile.findUnique({
      where: { userId: adminUserId }
    });

    // If admin profile doesn't exist, create it on-the-fly to prevent constraint failures
    if (!adminProfile) {
      adminProfile = await db.adminProfile.create({
        data: {
          userId: adminUserId,
          department: 'Operations',
          permissions: ['SUPER_ADMIN']
        }
      });
    }

    const newStatus = action === 'APPROVE' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
    const lowerType = String(type).toLowerCase();

    let previousStatus: VerificationStatus = VerificationStatus.PENDING;
    let subjectId: string = profileId;

    if (lowerType === 'doctor') {
      const doc = await db.doctorProfile.findUnique({ where: { id: profileId } });
      if (!doc) {
        res.status(404).json({ error: 'Doctor profile not found' });
        return;
      }
      previousStatus = doc.verificationStatus;
      await db.doctorProfile.update({
        where: { id: profileId },
        data: { verificationStatus: newStatus }
      });
    } else if (lowerType === 'student') {
      const stud = await db.studentProfile.findUnique({ where: { id: profileId } });
      if (!stud) {
        res.status(404).json({ error: 'Student profile not found' });
        return;
      }
      previousStatus = stud.verificationStatus;
      await db.studentProfile.update({
        where: { id: profileId },
        data: { verificationStatus: newStatus }
      });
    } else if (lowerType === 'provider') {
      const prov = await db.providerProfile.findUnique({ where: { id: profileId } });
      if (!prov) {
        res.status(404).json({ error: 'Provider profile not found' });
        return;
      }
      previousStatus = prov.verificationStatus;
      await db.providerProfile.update({
        where: { id: profileId },
        data: { verificationStatus: newStatus }
      });
    } else {
      res.status(400).json({ error: `Invalid subject type '${type}'` });
      return;
    }

    // Write audit log to VerificationLog
    const log = await db.verificationLog.create({
      data: {
        subjectType: lowerType,
        subjectId,
        adminProfileId: adminProfile.id,
        previousStatus,
        newStatus,
        notes: notes || (action === 'APPROVE' ? 'Approved by Admin' : 'Rejected by Admin'),
      }
    });

    res.status(200).json({
      message: `Profile verification processed successfully as ${newStatus}`,
      log
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

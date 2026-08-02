import { Request, Response } from 'express';
import { db } from '../../config/db';
import { ContentStatus } from '@prisma/client';

// Fetch unresolved or resolved support/moderation reports
export const getReports = async (req: Request, res: Response): Promise<void> => {
  const { isResolved, type } = req.query;

  try {
    const whereClause: any = {};
    if (isResolved !== undefined) {
      whereClause.isResolved = String(isResolved) === 'true';
    }
    if (type) {
      whereClause.subjectType = String(type).toLowerCase(); // "user", "content", "review"
    }

    const reports = await db.report.findMany({
      where: whereClause,
      include: {
        reportedBy: {
          include: { profile: true }
        },
        subjectUser: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ reports });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Resolve a report ticket with custom resolution notes
export const resolveReport = async (req: Request, res: Response): Promise<void> => {
  const { reportId } = req.params;
  const { resolvedNotes } = req.body;

  try {
    const report = await db.report.findUnique({ where: { id: reportId } });
    if (!report) {
      res.status(404).json({ error: 'Report ticket not found' });
      return;
    }

    const updatedReport = await db.report.update({
      where: { id: reportId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedNotes: resolvedNotes || 'Resolved by administrator',
      }
    });

    // Log the resolution action
    await db.auditLog.create({
      data: {
        actorId: req.user?.userId || null,
        action: 'RESOLVE_REPORT',
        entityType: 'report',
        entityId: reportId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
        metadata: { resolvedNotes }
      }
    });

    res.status(200).json({
      message: 'Report ticket resolved successfully',
      report: updatedReport,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Toggle content visibility status (e.g., Flag or Publish article/course)
export const moderateContent = async (req: Request, res: Response): Promise<void> => {
  const { contentId } = req.params;
  const { status } = req.body; // DRAFT | PUBLISHED | ARCHIVED | FLAGGED

  try {
    const content = await db.content.findUnique({ where: { id: contentId } });
    if (!content) {
      res.status(404).json({ error: 'Content article not found' });
      return;
    }

    const updatedContent = await db.content.update({
      where: { id: contentId },
      data: { status: status as ContentStatus },
    });

    await db.auditLog.create({
      data: {
        actorId: req.user?.userId || null,
        action: `MODERATE_CONTENT_${status}`,
        entityType: 'content',
        entityId: contentId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
        metadata: { title: content.title }
      }
    });

    res.status(200).json({
      message: `Content status successfully updated to ${status}`,
      content: updatedContent
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Moderate (soft delete) a comment on an article
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const { commentId } = req.params;

  try {
    const comment = await db.contentComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    await db.contentComment.update({
      where: { id: commentId },
      data: { isDeleted: true },
    });

    await db.auditLog.create({
      data: {
        actorId: req.user?.userId || null,
        action: 'MODERATE_DELETE_COMMENT',
        entityType: 'comment',
        entityId: commentId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      }
    });

    res.status(200).json({ message: 'Comment soft-deleted by moderator successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Moderate (delete) a review
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  const { reviewId } = req.params;

  try {
    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    await db.review.delete({ where: { id: reviewId } });

    await db.auditLog.create({
      data: {
        actorId: req.user?.userId || null,
        action: 'MODERATE_DELETE_REVIEW',
        entityType: 'review',
        entityId: reviewId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      }
    });

    res.status(200).json({ message: 'Review deleted by moderator successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Fetch system Audit logs
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await db.auditLog.findMany({
      include: {
        actor: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Cap at 100 recent entries
    });

    res.status(200).json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

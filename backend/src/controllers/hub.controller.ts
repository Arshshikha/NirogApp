import { Request, Response } from 'express';
import { db } from '../config/db';
import { ContentType, CourseLevel, ContentStatus } from '@prisma/client';

const mapTypeToEnum = (typeStr: string): ContentType => {
  const t = typeStr.toUpperCase();
  if (t === 'BLOG') return ContentType.BLOG;
  if (t === 'ARTICLE') return ContentType.ARTICLE;
  if (t === 'SPECIAL CASE' || t === 'SPECIALCASE' || t === 'CASE_STUDY') return ContentType.CASE_STUDY;
  if (t === 'COURSE') return ContentType.COURSE;
  if (t === 'WEBINAR') return ContentType.WEBINAR;
  if (t === 'PODCAST') return ContentType.PODCAST;
  return ContentType.BLOG;
};

export const getHubItems = async (req: Request, res: Response): Promise<void> => {
  const { type } = req.query;

  try {
    const whereClause: any = { status: ContentStatus.PUBLISHED };
    if (type) {
      whereClause.type = mapTypeToEnum(String(type));
    }

    const items = await db.content.findMany({
      where: whereClause,
      include: {
        author: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        course: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getCourseDetails = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;

  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        content: {
          include: {
            author: {
              include: {
                user: {
                  include: { profile: true }
                }
              }
            }
          }
        },
        modules: {
          orderBy: { moduleNumber: 'asc' },
          include: {
            objectives: true,
            lessons: true,
            keyTerms: true
          }
        }
      }
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    res.status(200).json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const createHubItem = async (req: Request, res: Response): Promise<void> => {
  const { 
    authorId, 
    title, 
    type, 
    content, 
    videoUrl, 
    thumbnailFileId,
    courseDetails 
  } = req.body;

  if (!authorId || !title || !type || !content) {
    res.status(400).json({ error: 'Required fields missing: authorId, title, type, content' });
    return;
  }

  try {
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const typeEnum = mapTypeToEnum(type);

    const hubItem = await db.content.create({
      data: {
        authorId,
        type: typeEnum,
        status: ContentStatus.PUBLISHED,
        title,
        slug,
        excerpt: content.substring(0, 150),
        body: content,
        videoUrl: videoUrl || null,
        thumbnailFileId: thumbnailFileId || null,
        course: typeEnum === ContentType.COURSE && courseDetails ? {
          create: {
            level: courseDetails.level ? (courseDetails.level.toUpperCase() as CourseLevel) : CourseLevel.BEGINNER,
            price: courseDetails.price ? parseFloat(courseDetails.price) : 0.0,
            language: courseDetails.language || 'Hindi',
            totalModules: courseDetails.modules ? courseDetails.modules.length : 0,
            modules: courseDetails.modules ? {
              create: courseDetails.modules.map((mod: any) => ({
                moduleNumber: mod.moduleNumber,
                title: mod.title,
                summary: mod.summary || '',
                durationMins: mod.durationMins || 0,
                isPremium: mod.isPremium || false,
                isPublished: true,
                objectives: mod.objectives ? {
                  create: mod.objectives.map((obj: string, idx: number) => ({ objective: obj, sortOrder: idx }))
                } : undefined,
                lessons: mod.lessons ? {
                  create: mod.lessons.map((les: any) => ({ 
                    lessonNumber: les.lessonNumber, 
                    title: les.title, 
                    body: les.body,
                    durationMins: les.durationMins || 10
                  }))
                } : undefined,
                keyTerms: mod.keyTerms ? {
                  create: mod.keyTerms.map((kt: any) => ({ term: kt.term, definition: kt.definition }))
                } : undefined
              }))
            } : undefined
          }
        } : undefined
      },
      include: {
        course: true
      }
    });

    res.status(201).json({ message: 'Hub item created successfully', hubItem });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getCourseStatus = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ error: 'Missing required query parameter: userId' });
    return;
  }

  try {
    const student = await db.studentProfile.findUnique({
      where: { userId: String(userId) }
    });

    if (!student) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    const enrollment = await db.courseEnrollment.findUnique({
      where: {
        courseId_studentProfileId: {
          courseId: courseId,
          studentProfileId: student.id
        }
      }
    });

    res.status(200).json({
      enrolled: !!enrollment,
      isPremiumUnlocked: enrollment ? enrollment.isPremiumUnlocked : false
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};


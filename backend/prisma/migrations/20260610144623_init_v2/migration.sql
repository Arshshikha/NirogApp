-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'DOCTOR', 'STUDENT', 'PROVIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MedicalCategory" AS ENUM ('ALLOPATHY', 'AYURVEDA', 'HOMEOPATHY', 'UNANI', 'SIDDHA', 'NATUROPATHY', 'DENTISTRY', 'PHYSIOTHERAPY', 'PSYCHOLOGY', 'NUTRITION', 'OTHER');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('HOSPITAL', 'CLINIC', 'LAB', 'PHARMACY', 'DIAGNOSTIC_CENTER', 'BLOOD_BANK', 'REHABILITATION_CENTER');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('IN_PERSON', 'ONLINE_VIDEO', 'ONLINE_CHAT', 'HOME_VISIT');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_PROVIDER', 'NO_SHOW', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'UPI', 'NET_BANKING', 'WALLET', 'CASH', 'INSURANCE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BOOKING_PAYMENT', 'REFUND', 'PLATFORM_FEE', 'PAYOUT', 'SUBSCRIPTION', 'COURSE_PURCHASE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'BLOG', 'CASE_STUDY', 'COURSE', 'WEBINAR', 'PODCAST');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PUBLISHED', 'ARCHIVED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_REMINDER', 'BOOKING_CANCELLATION', 'PAYMENT_SUCCESS', 'PAYMENT_FAILURE', 'VERIFICATION_UPDATE', 'NEW_MESSAGE', 'REVIEW_RECEIVED', 'COURSE_ENROLLED', 'GENERAL', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('PATIENT', 'DOCTOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('AVATAR', 'LICENSE_DOCUMENT', 'STUDENT_ID', 'PERMIT_DOCUMENT', 'PRESCRIPTION', 'LAB_REPORT', 'MEDICAL_RECORD', 'CHAT_ATTACHMENT', 'COURSE_MATERIAL', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "MimeType" AS ENUM ('IMAGE_JPEG', 'IMAGE_PNG', 'IMAGE_WEBP', 'APPLICATION_PDF', 'VIDEO_MP4', 'VIDEO_WEBM', 'AUDIO_MP3', 'AUDIO_WAV');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAUSED', 'TRIAL');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'MISINFORMATION', 'INAPPROPRIATE_CONTENT', 'FAKE_PROFILE', 'FRAUD', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(150),
    "phone" VARCHAR(20),
    "dateOfBirth" DATE,
    "gender" "Gender",
    "avatarFileId" UUID,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userProfileId" UUID NOT NULL,
    "line1" VARCHAR(255) NOT NULL,
    "line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "providerUid" VARCHAR(255) NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL DEFAULT 'UNKNOWN',
    "allergies" TEXT[],
    "chronicConditions" TEXT[],
    "emergencyContactName" VARCHAR(150),
    "emergencyContactPhone" VARCHAR(20),
    "insuranceProvider" VARCHAR(150),
    "insurancePolicyNumber" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "registrationNumber" VARCHAR(100) NOT NULL,
    "category" "MedicalCategory" NOT NULL,
    "specialties" VARCHAR(100)[],
    "subSpecialties" VARCHAR(100)[],
    "qualifications" VARCHAR(200)[],
    "experience" INTEGER NOT NULL DEFAULT 0,
    "consultationFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "onlineConsultFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "languages" VARCHAR(50)[],
    "hospitalAffiliations" VARCHAR(255)[],
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "isAvailableOnline" BOOLEAN NOT NULL DEFAULT false,
    "avgRating" DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "licenseDocumentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_availability_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctorProfileId" UUID NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 15,
    "appointmentType" "AppointmentType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,

    CONSTRAINT "doctor_availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_availability_overrides" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slotId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "startTime" VARCHAR(5),
    "endTime" VARCHAR(5),
    "reason" VARCHAR(255),

    CONSTRAINT "doctor_availability_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "institutionName" VARCHAR(255) NOT NULL,
    "enrollmentNumber" VARCHAR(100),
    "courseOfStudy" VARCHAR(150),
    "yearOfStudy" INTEGER,
    "graduationYear" INTEGER,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "studentIdFileId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "providerType" "ProviderType" NOT NULL,
    "legalName" VARCHAR(255) NOT NULL,
    "registrationNumber" VARCHAR(100),
    "description" TEXT,
    "website" VARCHAR(255),
    "operatingHours" JSONB,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "avgRating" DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "permitFileId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "providerProfileId" UUID NOT NULL,
    "line1" VARCHAR(255) NOT NULL,
    "line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "provider_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "providerProfileId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2),
    "durationMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "department" VARCHAR(100),
    "permissions" VARCHAR(100)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingReference" VARCHAR(20) NOT NULL,
    "patientId" UUID NOT NULL,
    "doctorProfileId" UUID,
    "providerProfileId" UUID,
    "serviceId" UUID,
    "appointmentType" "AppointmentType" NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "scheduledTime" VARCHAR(5) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 15,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "totalFee" DECIMAL(10,2) NOT NULL,
    "patientNotes" TEXT,
    "providerNotes" TEXT,
    "cancellationReason" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "method" "PaymentMethod",
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayName" VARCHAR(50),
    "gatewayOrderId" VARCHAR(255),
    "gatewayPaymentId" VARCHAR(255),
    "gatewaySignature" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paymentId" UUID,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paymentId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayRefundId" VARCHAR(255),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctorProfileId" UUID,
    "providerProfileId" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "platformFee" DECIMAL(10,2) NOT NULL,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "bankAccount" VARCHAR(255),
    "utrNumber" VARCHAR(100),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "gatewaySubscriptionId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patientProfileId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "recordDate" DATE NOT NULL,
    "tags" VARCHAR(100)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_record_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medicalRecordId" UUID NOT NULL,
    "fileId" UUID NOT NULL,

    CONSTRAINT "medical_record_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "notes" TEXT,
    "diagnosis" TEXT,
    "followUpDate" DATE,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_medicines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prescriptionId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "duration" VARCHAR(100) NOT NULL,
    "instructions" VARCHAR(500),

    CONSTRAINT "prescription_medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prescriptionId" UUID NOT NULL,
    "fileId" UUID NOT NULL,

    CONSTRAINT "prescription_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "doctorProfileId" UUID,
    "providerProfileId" UUID,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL,
    "senderType" "MessageSenderType" NOT NULL,
    "senderId" UUID,
    "body" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "messageId" UUID NOT NULL,
    "fileId" UUID NOT NULL,

    CONSTRAINT "chat_message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "authorId" UUID NOT NULL,
    "type" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(550) NOT NULL,
    "excerpt" TEXT,
    "body" TEXT,
    "thumbnailFileId" UUID,
    "videoUrl" VARCHAR(500),
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(110) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_tags" (
    "contentId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "content_tags_pkey" PRIMARY KEY ("contentId","tagId")
);

-- CreateTable
CREATE TABLE "content_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contentId" UUID NOT NULL,
    "studentProfileId" UUID NOT NULL,
    "isLiked" BOOLEAN NOT NULL DEFAULT false,
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contentId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" UUID,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contentId" UUID NOT NULL,
    "level" "CourseLevel" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "language" VARCHAR(50) NOT NULL DEFAULT 'Hindi',
    "totalModules" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "estimatedHours" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "certificateOffered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseId" UUID NOT NULL,
    "moduleNumber" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "summary" TEXT,
    "durationMins" INTEGER NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_objectives" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseModuleId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "objective" TEXT NOT NULL,

    CONSTRAINT "course_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_lessons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseModuleId" UUID NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "body" TEXT,
    "videoUrl" VARCHAR(500),
    "durationMins" INTEGER NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_key_terms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseModuleId" UUID NOT NULL,
    "term" VARCHAR(255) NOT NULL,
    "definition" TEXT NOT NULL,

    CONSTRAINT "course_key_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseId" UUID NOT NULL,
    "studentProfileId" UUID NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "certificateUrl" VARCHAR(500),

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "enrollmentId" UUID NOT NULL,
    "moduleId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3),
    "timeSpentMins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "course_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "uploaderType" VARCHAR(50) NOT NULL,
    "uploaderId" UUID,
    "category" "FileCategory" NOT NULL,
    "originalName" VARCHAR(500) NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "mimeType" "MimeType" NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSecs" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subjectType" VARCHAR(50) NOT NULL,
    "subjectId" UUID NOT NULL,
    "adminProfileId" UUID NOT NULL,
    "previousStatus" "VerificationStatus" NOT NULL,
    "newStatus" "VerificationStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reportedById" UUID NOT NULL,
    "subjectUserId" UUID,
    "subjectType" VARCHAR(50) NOT NULL,
    "subjectId" UUID NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorId" UUID,
    "action" VARCHAR(255) NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" UUID,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_profiles_phone_idx" ON "user_profiles"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_userProfileId_key" ON "addresses"("userProfileId");

-- CreateIndex
CREATE INDEX "addresses_city_idx" ON "addresses"("city");

-- CreateIndex
CREATE INDEX "addresses_pincode_idx" ON "addresses"("pincode");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_providerUid_key" ON "oauth_accounts"("provider", "providerUid");

-- CreateIndex
CREATE INDEX "otp_codes_userId_idx" ON "otp_codes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_userId_key" ON "patient_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_userId_key" ON "doctor_profiles"("userId");

-- CreateIndex
CREATE INDEX "doctor_profiles_category_idx" ON "doctor_profiles"("category");

-- CreateIndex
CREATE INDEX "doctor_profiles_verificationStatus_idx" ON "doctor_profiles"("verificationStatus");

-- CreateIndex
CREATE INDEX "doctor_profiles_avgRating_idx" ON "doctor_profiles"("avgRating");

-- CreateIndex
CREATE INDEX "doctor_profiles_consultationFee_idx" ON "doctor_profiles"("consultationFee");

-- CreateIndex
CREATE INDEX "doctor_availability_slots_doctorProfileId_idx" ON "doctor_availability_slots"("doctorProfileId");

-- CreateIndex
CREATE INDEX "doctor_availability_slots_dayOfWeek_idx" ON "doctor_availability_slots"("dayOfWeek");

-- CreateIndex
CREATE INDEX "doctor_availability_overrides_slotId_idx" ON "doctor_availability_overrides"("slotId");

-- CreateIndex
CREATE INDEX "doctor_availability_overrides_date_idx" ON "doctor_availability_overrides"("date");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_institutionName_idx" ON "student_profiles"("institutionName");

-- CreateIndex
CREATE INDEX "student_profiles_verificationStatus_idx" ON "student_profiles"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "provider_profiles_userId_key" ON "provider_profiles"("userId");

-- CreateIndex
CREATE INDEX "provider_profiles_providerType_idx" ON "provider_profiles"("providerType");

-- CreateIndex
CREATE INDEX "provider_profiles_verificationStatus_idx" ON "provider_profiles"("verificationStatus");

-- CreateIndex
CREATE INDEX "provider_profiles_avgRating_idx" ON "provider_profiles"("avgRating");

-- CreateIndex
CREATE UNIQUE INDEX "provider_addresses_providerProfileId_key" ON "provider_addresses"("providerProfileId");

-- CreateIndex
CREATE INDEX "provider_addresses_city_idx" ON "provider_addresses"("city");

-- CreateIndex
CREATE INDEX "provider_addresses_pincode_idx" ON "provider_addresses"("pincode");

-- CreateIndex
CREATE INDEX "provider_services_providerProfileId_idx" ON "provider_services"("providerProfileId");

-- CreateIndex
CREATE INDEX "provider_services_name_idx" ON "provider_services"("name");

-- CreateIndex
CREATE INDEX "provider_services_isActive_idx" ON "provider_services"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingReference_key" ON "bookings"("bookingReference");

-- CreateIndex
CREATE INDEX "bookings_patientId_idx" ON "bookings"("patientId");

-- CreateIndex
CREATE INDEX "bookings_doctorProfileId_idx" ON "bookings"("doctorProfileId");

-- CreateIndex
CREATE INDEX "bookings_providerProfileId_idx" ON "bookings"("providerProfileId");

-- CreateIndex
CREATE INDEX "bookings_scheduledDate_idx" ON "bookings"("scheduledDate");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_paymentStatus_idx" ON "bookings"("paymentStatus");

-- CreateIndex
CREATE INDEX "bookings_bookingReference_idx" ON "bookings"("bookingReference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bookingId_key" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_gatewayOrderId_idx" ON "payments"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "transactions_paymentId_idx" ON "transactions"("paymentId");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "refunds_paymentId_idx" ON "refunds"("paymentId");

-- CreateIndex
CREATE INDEX "payouts_doctorProfileId_idx" ON "payouts"("doctorProfileId");

-- CreateIndex
CREATE INDEX "payouts_providerProfileId_idx" ON "payouts"("providerProfileId");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions"("plan");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "medical_records_patientProfileId_idx" ON "medical_records"("patientProfileId");

-- CreateIndex
CREATE INDEX "medical_records_recordDate_idx" ON "medical_records"("recordDate");

-- CreateIndex
CREATE INDEX "medical_record_files_medicalRecordId_idx" ON "medical_record_files"("medicalRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_bookingId_key" ON "prescriptions"("bookingId");

-- CreateIndex
CREATE INDEX "prescriptions_bookingId_idx" ON "prescriptions"("bookingId");

-- CreateIndex
CREATE INDEX "prescription_medicines_prescriptionId_idx" ON "prescription_medicines"("prescriptionId");

-- CreateIndex
CREATE INDEX "prescription_files_prescriptionId_idx" ON "prescription_files"("prescriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");

-- CreateIndex
CREATE INDEX "reviews_doctorProfileId_idx" ON "reviews"("doctorProfileId");

-- CreateIndex
CREATE INDEX "reviews_providerProfileId_idx" ON "reviews"("providerProfileId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_bookingId_key" ON "conversations"("bookingId");

-- CreateIndex
CREATE INDEX "conversation_members_userId_idx" ON "conversation_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_members_conversationId_userId_key" ON "conversation_members"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "chat_message_attachments_messageId_idx" ON "chat_message_attachments"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "content_slug_key" ON "content"("slug");

-- CreateIndex
CREATE INDEX "content_authorId_idx" ON "content"("authorId");

-- CreateIndex
CREATE INDEX "content_type_idx" ON "content"("type");

-- CreateIndex
CREATE INDEX "content_status_idx" ON "content"("status");

-- CreateIndex
CREATE INDEX "content_isPremium_idx" ON "content"("isPremium");

-- CreateIndex
CREATE INDEX "content_publishedAt_idx" ON "content"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "content_tags_tagId_idx" ON "content_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "content_interactions_contentId_studentProfileId_key" ON "content_interactions"("contentId", "studentProfileId");

-- CreateIndex
CREATE INDEX "content_comments_contentId_idx" ON "content_comments"("contentId");

-- CreateIndex
CREATE INDEX "content_comments_parentId_idx" ON "content_comments"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_contentId_key" ON "courses"("contentId");

-- CreateIndex
CREATE INDEX "courses_level_idx" ON "courses"("level");

-- CreateIndex
CREATE INDEX "course_modules_courseId_idx" ON "course_modules"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_courseId_moduleNumber_key" ON "course_modules"("courseId", "moduleNumber");

-- CreateIndex
CREATE INDEX "course_objectives_courseModuleId_idx" ON "course_objectives"("courseModuleId");

-- CreateIndex
CREATE INDEX "course_lessons_courseModuleId_idx" ON "course_lessons"("courseModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "course_lessons_courseModuleId_lessonNumber_key" ON "course_lessons"("courseModuleId", "lessonNumber");

-- CreateIndex
CREATE INDEX "course_key_terms_courseModuleId_idx" ON "course_key_terms"("courseModuleId");

-- CreateIndex
CREATE INDEX "course_enrollments_courseId_idx" ON "course_enrollments"("courseId");

-- CreateIndex
CREATE INDEX "course_enrollments_studentProfileId_idx" ON "course_enrollments"("studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_courseId_studentProfileId_key" ON "course_enrollments"("courseId", "studentProfileId");

-- CreateIndex
CREATE INDEX "course_progress_enrollmentId_idx" ON "course_progress"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "course_progress_enrollmentId_moduleId_key" ON "course_progress"("enrollmentId", "moduleId");

-- CreateIndex
CREATE INDEX "media_files_uploaderType_uploaderId_idx" ON "media_files"("uploaderType", "uploaderId");

-- CreateIndex
CREATE INDEX "media_files_category_idx" ON "media_files"("category");

-- CreateIndex
CREATE INDEX "verification_logs_subjectType_subjectId_idx" ON "verification_logs"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "verification_logs_adminProfileId_idx" ON "verification_logs"("adminProfileId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "reports_reportedById_idx" ON "reports"("reportedById");

-- CreateIndex
CREATE INDEX "reports_subjectUserId_idx" ON "reports"("subjectUserId");

-- CreateIndex
CREATE INDEX "reports_subjectType_subjectId_idx" ON "reports"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_licenseDocumentId_fkey" FOREIGN KEY ("licenseDocumentId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability_slots" ADD CONSTRAINT "doctor_availability_slots_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability_overrides" ADD CONSTRAINT "doctor_availability_overrides_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "doctor_availability_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_studentIdFileId_fkey" FOREIGN KEY ("studentIdFileId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_permitFileId_fkey" FOREIGN KEY ("permitFileId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_addresses" ADD CONSTRAINT "provider_addresses_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "provider_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_files" ADD CONSTRAINT "medical_record_files_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_files" ADD CONSTRAINT "medical_record_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "media_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_medicines" ADD CONSTRAINT "prescription_medicines_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_files" ADD CONSTRAINT "prescription_files_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_files" ADD CONSTRAINT "prescription_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "media_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_attachments" ADD CONSTRAINT "chat_message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_attachments" ADD CONSTRAINT "chat_message_attachments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "media_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_thumbnailFileId_fkey" FOREIGN KEY ("thumbnailFileId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_interactions" ADD CONSTRAINT "content_interactions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_interactions" ADD CONSTRAINT "content_interactions_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_comments" ADD CONSTRAINT "content_comments_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_comments" ADD CONSTRAINT "content_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "content_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_objectives" ADD CONSTRAINT "course_objectives_courseModuleId_fkey" FOREIGN KEY ("courseModuleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_courseModuleId_fkey" FOREIGN KEY ("courseModuleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_key_terms" ADD CONSTRAINT "course_key_terms_courseModuleId_fkey" FOREIGN KEY ("courseModuleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "course_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_adminProfileId_fkey" FOREIGN KEY ("adminProfileId") REFERENCES "admin_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

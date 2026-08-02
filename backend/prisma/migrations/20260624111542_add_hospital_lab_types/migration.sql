-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppointmentType" ADD VALUE 'HOSPITAL_VISIT';
ALTER TYPE "AppointmentType" ADD VALUE 'LAB_TEST';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "medicalWing" VARCHAR(100);

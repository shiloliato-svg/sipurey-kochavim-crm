-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "leadSource" TEXT,
ADD COLUMN     "processStatus" TEXT NOT NULL DEFAULT 'חדש',
ADD COLUMN     "productInterest" TEXT;

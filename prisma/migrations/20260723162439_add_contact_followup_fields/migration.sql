-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "lastFollowUpAt" TIMESTAMP(3),
ADD COLUMN     "lastFollowUpMessage" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "lastFollowUpAt" TIMESTAMP(3),
ADD COLUMN     "lastFollowUpMessage" TEXT;

/*
  Warnings:

  - You are about to drop the column `userId` on the `Tasks` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Tasks" DROP CONSTRAINT "Tasks_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Tasks" DROP COLUMN "userId",
ADD COLUMN     "isFinish" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderAt" TIMESTAMP(3);

/*
  Warnings:

  - You are about to drop the column `reminderAt` on the `Tasks` table. All the data in the column will be lost.
  - The `priority` column on the `Tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."TaskPriority" AS ENUM ('LOW', 'NORMAL', 'URGENT');

-- AlterTable
ALTER TABLE "public"."Tasks" DROP COLUMN "reminderAt",
DROP COLUMN "priority",
ADD COLUMN     "priority" "public"."TaskPriority" NOT NULL DEFAULT 'NORMAL';

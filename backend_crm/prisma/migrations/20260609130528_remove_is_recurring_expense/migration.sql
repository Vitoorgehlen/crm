/*
  Warnings:

  - You are about to drop the column `isRecurring` on the `Expense` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."recurrenceTypes" ADD VALUE 'NONE';

-- AlterTable
ALTER TABLE "public"."Expense" DROP COLUMN "isRecurring";

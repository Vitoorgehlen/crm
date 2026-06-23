/*
  Warnings:

  - You are about to drop the column `balance` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Company" DROP COLUMN "balance",
ADD COLUMN     "autoPayExpenses" BOOLEAN NOT NULL DEFAULT true;

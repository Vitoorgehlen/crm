/*
  Warnings:

  - Made the column `expiresAt` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Made the column `plan` on table `Company` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Company" ALTER COLUMN "expiresAt" SET NOT NULL,
ALTER COLUMN "plan" SET NOT NULL;

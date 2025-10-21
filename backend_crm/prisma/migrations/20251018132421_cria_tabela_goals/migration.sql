/*
  Warnings:

  - You are about to drop the column `updatedBy` on the `Tasks` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Tasks" DROP COLUMN "updatedBy",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."Goals" (
    "id" SERIAL NOT NULL,
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goals_pkey" PRIMARY KEY ("id")
);

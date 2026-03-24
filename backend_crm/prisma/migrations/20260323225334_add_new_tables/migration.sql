/*
  Warnings:

  - You are about to drop the column `notes` on the `Expense` table. All the data in the column will be lost.
  - Added the required column `newDueDate` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum Documentation
DO $$ BEGIN
    CREATE TYPE "public"."Documentation" AS ENUM (
        'ENGINEERING',
        'PROPERTY_REGISTRY',
        'DEED_FINANCED_SBPE',
        'DEED_FINANCED_MIN_SBPE',
        'DEED_FINANCED_MCMV',
        'DEED_FINANCED_MIN_MCMV',
        'DEED_CASH',
        'ITBI_FINANCED',
        'ITBI_CASH',
        'REGISTRATION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum recurrenceTypes
DO $$ BEGIN
    CREATE TYPE "public"."recurrenceTypes" AS ENUM (
        'MONTHLY',
        'YEARLY',
        'WEEKLY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "public"."Expense" DROP COLUMN "notes",
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newDueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "recurrenceType" "public"."recurrenceTypes";

-- CreateTable
CREATE TABLE "public"."DocumentationValueDefault" (
    "id" SERIAL NOT NULL,
    "documentation" "public"."Documentation" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DocumentationValueDefault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentationValueCustom" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "documentation" "public"."Documentation" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DocumentationValueCustom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentationValue" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "documentation" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "DocumentationValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentationValueDefault_documentation_key" ON "public"."DocumentationValueDefault"("documentation");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentationValueCustom_companyId_documentation_key" ON "public"."DocumentationValueCustom"("companyId", "documentation");

-- AddForeignKey
ALTER TABLE "public"."DocumentationValueCustom" ADD CONSTRAINT "DocumentationValueCustom_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "public"."ContractPersonType" AS ENUM ('SINGULAR_M', 'SINGULAR_F', 'PLURAL_M', 'PLURAL_F');

-- CreateEnum
CREATE TYPE "public"."GeneratedContractStatus" AS ENUM ('DRAFT', 'FINALIZED', 'SIGNED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Permission" ADD VALUE 'CONTRACT_CREATE';
ALTER TYPE "public"."Permission" ADD VALUE 'CONTRACT_READ';
ALTER TYPE "public"."Permission" ADD VALUE 'CONTRACT_UPDATE';
ALTER TYPE "public"."Permission" ADD VALUE 'CONTRACT_DELETE';

-- CreateTable
CREATE TABLE "public"."ContractTemplate" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sellerType" "public"."ContractPersonType" NOT NULL DEFAULT 'SINGULAR_M',
    "buyerType" "public"."ContractPersonType" NOT NULL DEFAULT 'SINGULAR_M',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneratedContract" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "dealId" INTEGER,
    "templateId" INTEGER,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "public"."GeneratedContractStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "finalizedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContractVariableDefinition" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "ContractVariableDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractTemplate_companyId_idx" ON "public"."ContractTemplate"("companyId");

-- CreateIndex
CREATE INDEX "GeneratedContract_companyId_dealId_idx" ON "public"."GeneratedContract"("companyId", "dealId");

-- CreateIndex
CREATE INDEX "GeneratedContract_templateId_idx" ON "public"."GeneratedContract"("templateId");

-- CreateIndex
CREATE INDEX "GeneratedContract_createdBy_idx" ON "public"."GeneratedContract"("createdBy");

-- CreateIndex
CREATE INDEX "ContractVariableDefinition_companyId_idx" ON "public"."ContractVariableDefinition"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractVariableDefinition_companyId_key_key" ON "public"."ContractVariableDefinition"("companyId", "key");

-- AddForeignKey
ALTER TABLE "public"."ContractTemplate" ADD CONSTRAINT "ContractTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedContract" ADD CONSTRAINT "GeneratedContract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedContract" ADD CONSTRAINT "GeneratedContract_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedContract" ADD CONSTRAINT "GeneratedContract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedContract" ADD CONSTRAINT "GeneratedContract_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedContract" ADD CONSTRAINT "GeneratedContract_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractVariableDefinition" ADD CONSTRAINT "ContractVariableDefinition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

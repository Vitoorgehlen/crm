/*
  Warnings:

  - You are about to drop the column `isDefault` on the `ContractTemplate` table. All the data in the column will be lost.
  - Made the column `templateId` on table `GeneratedContract` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdBy` on table `GeneratedContract` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedBy` on table `GeneratedContract` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."ContractTemplate" DROP COLUMN "isDefault",
ADD COLUMN     "createdBy" INTEGER,
ADD COLUMN     "updatedBy" INTEGER;

-- AlterTable
ALTER TABLE "public"."GeneratedContract" ALTER COLUMN "templateId" SET NOT NULL,
ALTER COLUMN "createdBy" SET NOT NULL,
ALTER COLUMN "updatedBy" SET NOT NULL;

-- CreateIndex
CREATE INDEX "ContractTemplate_createdBy_idx" ON "public"."ContractTemplate"("createdBy");

-- CreateIndex
CREATE INDEX "ContractTemplate_updatedBy_idx" ON "public"."ContractTemplate"("updatedBy");

-- AddForeignKey
ALTER TABLE "public"."ContractTemplate" ADD CONSTRAINT "ContractTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractTemplate" ADD CONSTRAINT "ContractTemplate_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

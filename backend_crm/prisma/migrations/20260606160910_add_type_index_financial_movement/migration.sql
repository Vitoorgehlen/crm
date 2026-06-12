-- DropIndex
DROP INDEX "public"."FinancialMovement_companyId_createdAt_idx";

-- CreateIndex
CREATE INDEX "FinancialMovement_companyId_createdAt_type_idx" ON "public"."FinancialMovement"("companyId", "createdAt", "type");

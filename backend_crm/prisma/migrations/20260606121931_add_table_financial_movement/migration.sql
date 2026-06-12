-- CreateEnum
CREATE TYPE "public"."FinancialMovementType" AS ENUM ('INCOME', 'EXPENSE', 'COMMISSION');

-- CreateTable
CREATE TABLE "public"."FinancialMovement" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "type" "public"."FinancialMovementType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expenseId" INTEGER,
    "dealShareId" INTEGER,
    "userId" INTEGER,

    CONSTRAINT "FinancialMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialMovement_expenseId_key" ON "public"."FinancialMovement"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialMovement_dealShareId_key" ON "public"."FinancialMovement"("dealShareId");

-- CreateIndex
CREATE INDEX "FinancialMovement_companyId_createdAt_idx" ON "public"."FinancialMovement"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."FinancialMovement" ADD CONSTRAINT "FinancialMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialMovement" ADD CONSTRAINT "FinancialMovement_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialMovement" ADD CONSTRAINT "FinancialMovement_dealShareId_fkey" FOREIGN KEY ("dealShareId") REFERENCES "public"."DealShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialMovement" ADD CONSTRAINT "FinancialMovement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialMovement" ADD CONSTRAINT "FinancialMovement_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialMovement" ADD CONSTRAINT "FinancialMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "public"."Client" DROP CONSTRAINT "Client_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Deal" DROP CONSTRAINT "Deal_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."DealShare" DROP CONSTRAINT "DealShare_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."DocumentationCost" DROP CONSTRAINT "DocumentationCost_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Expense" DROP CONSTRAINT "Expense_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."FinancialMovement" DROP CONSTRAINT "FinancialMovement_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Schedule" DROP CONSTRAINT "Schedule_updatedBy_fkey";

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deal" ADD CONSTRAINT "Deal_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DealShare" ADD CONSTRAINT "DealShare_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentationCost" ADD CONSTRAINT "DocumentationCost_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialMovement" ADD CONSTRAINT "FinancialMovement_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

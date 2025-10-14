-- DropForeignKey
ALTER TABLE "public"."DealShare" DROP CONSTRAINT "DealShare_dealId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DocumentationCost" DROP CONSTRAINT "DocumentationCost_dealId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_dealId_fkey";

-- AlterTable
ALTER TABLE "public"."Deal"
ADD COLUMN     "downPaymentValue" DECIMAL(10,2),
ADD COLUMN     "financialInstitution" TEXT,
ADD COLUMN     "subsidyValue" DECIMAL(10,2);

UPDATE "Deal"
SET "downPaymentValue" = "cashValue"
WHERE "paymentMethod" = 'FINANCING'
  OR  "paymentMethod" = 'CREDIT_LETTER';

-- AddForeignKey
ALTER TABLE "public"."DealShare" ADD CONSTRAINT "DealShare_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentationCost" ADD CONSTRAINT "DocumentationCost_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "parentExpenseId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_parentExpenseId_fkey" FOREIGN KEY ("parentExpenseId") REFERENCES "public"."Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

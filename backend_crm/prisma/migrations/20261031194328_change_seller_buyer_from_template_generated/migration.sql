/*
  Warnings:

  - You are about to drop the column `buyerType` on the `ContractTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `sellerType` on the `ContractTemplate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ContractTemplate" DROP COLUMN "buyerType",
DROP COLUMN "sellerType";

-- AlterTable
ALTER TABLE "public"."GeneratedContract" ADD COLUMN     "buyerType" "public"."ContractPersonType" NOT NULL DEFAULT 'SINGULAR_M',
ADD COLUMN     "sellerType" "public"."ContractPersonType" NOT NULL DEFAULT 'SINGULAR_M';

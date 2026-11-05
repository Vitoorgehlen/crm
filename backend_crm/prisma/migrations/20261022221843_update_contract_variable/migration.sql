/*
  Warnings:

  - You are about to drop the column `key` on the `ContractVariable` table. All the data in the column will be lost.
  - Added the required column `variableType` to the `ContractVariable` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ContractVariableType" AS ENUM ('party', 'conditional');

-- DropIndex
DROP INDEX "public"."ContractVariable_companyId_key_key";

-- AlterTable
ALTER TABLE "public"."ContractVariable" DROP COLUMN "key",
ADD COLUMN     "variableType" "public"."ContractVariableType" NOT NULL;

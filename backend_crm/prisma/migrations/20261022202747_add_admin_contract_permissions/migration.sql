/*
  Warnings:

  - You are about to drop the `ContractVariableDefinition` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ContractVariableDefinition" DROP CONSTRAINT "ContractVariableDefinition_companyId_fkey";

-- DropTable
DROP TABLE "public"."ContractVariableDefinition";

-- CreateTable
CREATE TABLE "public"."ContractVariable" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "ContractVariable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractVariable_companyId_idx" ON "public"."ContractVariable"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractVariable_companyId_key_key" ON "public"."ContractVariable"("companyId", "key");

-- AddForeignKey
ALTER TABLE "public"."ContractVariable" ADD CONSTRAINT "ContractVariable_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Grant contract permissions to ADMIN role for all existing companies
INSERT INTO "public"."RolePermission" (
    "companyId",
    "role",
    "permission",
    "allowed"
)
SELECT
    c."id",
    'ADMIN'::"public"."UserRole",
    p.permission::"public"."Permission",
    TRUE
FROM "public"."Company" c
CROSS JOIN (
    VALUES
        ('CONTRACT_CREATE'),
        ('CONTRACT_READ'),
        ('CONTRACT_UPDATE'),
        ('CONTRACT_DELETE')
) AS p(permission)
ON CONFLICT ("companyId", "role", "permission")
DO UPDATE SET
    "allowed" = TRUE;

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('SOLO', 'TEAM', 'AGENCY', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "plan" "public"."SubscriptionPlan";

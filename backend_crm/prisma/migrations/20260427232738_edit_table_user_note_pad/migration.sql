/*
  Warnings:

  - You are about to drop the `UserNotePad` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserNotePad" DROP CONSTRAINT "UserNotePad_userId_fkey";

-- DropTable
DROP TABLE "public"."UserNotePad";

-- CreateTable
CREATE TABLE "public"."NotePad" (
    "id" SERIAL NOT NULL,
    "slot" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "NotePad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotePad_slot_userId_key" ON "public"."NotePad"("slot", "userId");

-- AddForeignKey
ALTER TABLE "public"."NotePad" ADD CONSTRAINT "NotePad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `NotePad` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "NotePad_userId_key" ON "public"."NotePad"("userId");

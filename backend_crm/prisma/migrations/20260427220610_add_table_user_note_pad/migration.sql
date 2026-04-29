-- DropForeignKey
ALTER TABLE "public"."Schedule" DROP CONSTRAINT "Schedule_dealId_fkey";

-- CreateTable
CREATE TABLE "public"."UserNotePad" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "UserNotePad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotePad_userId_key" ON "public"."UserNotePad"("userId");

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserNotePad" ADD CONSTRAINT "UserNotePad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

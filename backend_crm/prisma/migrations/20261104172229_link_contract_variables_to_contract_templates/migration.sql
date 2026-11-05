-- CreateTable
CREATE TABLE "public"."_TemplateContractVariables" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TemplateContractVariables_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_GeneratedContractVariables" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GeneratedContractVariables_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TemplateContractVariables_B_index" ON "public"."_TemplateContractVariables"("B");

-- CreateIndex
CREATE INDEX "_GeneratedContractVariables_B_index" ON "public"."_GeneratedContractVariables"("B");

-- AddForeignKey
ALTER TABLE "public"."_TemplateContractVariables" ADD CONSTRAINT "_TemplateContractVariables_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ContractTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_TemplateContractVariables" ADD CONSTRAINT "_TemplateContractVariables_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ContractVariable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GeneratedContractVariables" ADD CONSTRAINT "_GeneratedContractVariables_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ContractVariable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GeneratedContractVariables" ADD CONSTRAINT "_GeneratedContractVariables_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."GeneratedContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

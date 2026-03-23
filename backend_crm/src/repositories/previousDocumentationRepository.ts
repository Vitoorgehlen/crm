import { prisma } from "../prisma-client";
import { Documentation, Prisma } from '@prisma/client';
//! ----------------------------- DEFAULT -------------------------------

// CRIA OU ATUALIZA um DocumentationDefault (SUPER User)
export async function upsertDocumentationDefaults(
  docs: Prisma.DocumentationValueDefaultCreateInput[]
) {
  return prisma.$transaction(
    docs.map((doc) =>
      prisma.documentationValueDefault.upsert({
        where: { documentation: doc.documentation as Documentation},
        update: { value: doc.value },
        create: doc,
      })
    )
  );
}

// Pega as documentações (Super User)
export function getDocumentationDefaultSU() {
  return prisma.$transaction(async (tx) => {
    return await tx.documentationValueDefault.findMany();
})};

// Pega as documentações (todos)
export function getDocumentationDefault(userId: number) {
  return prisma.$transaction(async (tx) => {
    let customDocs: any[] = [];

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user) throw new Error('Usuário não encontrado.');

    customDocs = await tx.documentationValueCustom.findMany({
      where: { companyId: user.companyId }
    })

    const defaultDocs = await tx.documentationValueDefault.findMany();

    const customMap = new Map(
      customDocs.map((doc) => [doc.documentation, doc])
    );

    const result = defaultDocs.map((defaultDocs) => {
      const custom = customMap.get(defaultDocs.documentation);

      return custom ?? defaultDocs;
    })

    return result;
})};

// Apaga documentação
export async function deleteDocumentationDefault(
  id: number,
) {
  return prisma.$transaction(async (tx) => {
    const documentationExist = await tx.documentationValueDefault.findFirst({
      where: { id },
    });
    if (!documentationExist) throw new Error('Documentação não existe.');

    return tx.documentationValueDefault.delete({
      where: { id }
    });
  });
}

//! ----------------------------- CUSTOM -------------------------------
export async function upsertDocumentationCustom(
  docs: { documentation: Documentation; value: number }[],
  userId: number
) {
  const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { companyId: true }
    });
    if (!user) throw new Error('Usuário não encontrado.');

  return prisma.$transaction(
    docs.map((doc) =>
      prisma.documentationValueCustom.upsert({
        where: {
          companyId_documentation: {
            companyId: user.companyId,
            documentation: doc.documentation as Documentation
          }
        },
        update: { value: doc.value },
        create: {
          documentation: doc.documentation  as Documentation,
          value: doc.value,
          companyId: user.companyId
        }
      })
    )
  );
}

// Apaga documentação
export async function deleteDocumentationCustom(
  id: number,
  userId: number
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id: userId },
      select: { companyId: true }
    });
    if (!user) throw new Error('Usuário não encontrado.');

    const documentationExist = await tx.documentationValueCustom.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });
    if (!documentationExist) throw new Error('Documentação não existe.');

    return tx.documentationValueCustom.delete({
      where: { id }
    });
  });
}

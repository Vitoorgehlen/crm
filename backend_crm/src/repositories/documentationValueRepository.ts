import { prisma } from "../prisma-client";
import { Prisma } from '@prisma/client';


// Criar um DocumentationValue
export async function addDocumentationValue(
  data: Prisma.DocumentationValueCreateInput,
  userId: number,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!user) throw new Error('Usuário não encontrado.');

    const documentationExist = await tx.documentationValue.findFirst({
      where: {
        companyId: user?.companyId,
        documentation: data.documentation
      },
    });
    if (documentationExist) throw new Error('Documentação já existe.');

    return tx.documentationValue.create({
      data: {
        ...data,
        companyId: user?.companyId,
      }
    });
  });
}

// Pega as documentações
export function getDocumentationValue(userId: number) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!user) throw new Error('Usuário não encontrado.');

    return prisma.documentationValue.findMany({
      where: { companyId: user.companyId },
    });
})};

// Atualizar documentação
export async function updateDocumentationValue(
  id: number,
  newData: Partial<Prisma.DocumentationValueUncheckedUpdateInput>,
  userId: number
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!user) throw new Error('Usuário não encontrado.');

    const documentationExist = await tx.documentationValue.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });
    if (!documentationExist) throw new Error('Documentação já existe.');

    return tx.documentationValue.update({
      where: { id },
      data: {
        companyId: user?.companyId,
        ...newData,
      }
    });
  });
}

// Apaga documentação
export async function deleteDocumentationValue(
  id: number,
  userId: number
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!user) throw new Error('Usuário não encontrado.');

    const documentationExist = await tx.documentationValue.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });
    if (!documentationExist) throw new Error('Documentação já existe.');

    return tx.documentationValue.delete({
      where: { id }
    });
  });
}

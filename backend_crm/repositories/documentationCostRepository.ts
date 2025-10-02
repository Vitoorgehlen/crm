import { prisma } from "../prisma/client";
import { Prisma } from '@prisma/client';
import { checkUserPermission } from './rolePermissionRepository';


// Criar um DocumentationCost
export async function addDocumentationCost(
  data: Omit<Prisma.DocumentationCostCreateInput,
  'creator' | 'deal' | 'updater' > & {
    creatorId: number;
    dealId: number;
  },
  userId: number,
) {
  const { creatorId, dealId, ...documentationData } = data;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      createdBy: true,
      companyId: true,
    },
  });
  if (!deal) throw new Error('Deal não encontrado.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  if (deal.companyId !== user.companyId) throw new Error('Você não pode adicionar documentação para essa empresa.');

  if (deal.createdBy !== userId) {
    const canCreateDeal = await checkUserPermission(userId, 'ALL_DEAL_CREATE');
    if (!canCreateDeal) throw new Error('Você não tem permissão para criar documentações');
  } else {
    const canCreateDeal = await checkUserPermission(userId, 'DEAL_CREATE');
    if (!canCreateDeal) throw new Error('Você não tem permissão para criar documentações');
  }

  return prisma.documentationCost.create({
    data: {
      ...documentationData,
      deal: { connect: { id: dealId } },
      creator: { connect: { id: creatorId } },
      updater: { connect: { id: creatorId } },
    },
  });
}

// Pega o valor da documentação
export function getDocumentationCost(dealId: number) {
  return prisma.documentationCost.findMany({
    where: { dealId },
    orderBy: { createdAt: 'desc' }
  });
}

// Atualizar documentação
export async function updateDocumentationCost(
  id: number,
  newData: Partial<Prisma.DocumentationCostUncheckedUpdateInput>,
  userId: number
) {
  const updateData = { ...newData, updatedBy: userId };
  const docCost = await prisma.documentationCost.findUnique({
    where: { id },
    select: {
      deal: true,
      createdBy: true,
    },
  });
  if (!docCost) throw new Error('Documentação não encontrada.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  if (docCost.deal.companyId !== user.companyId) throw new Error('Você não pode editar documentação para essa empresa.');

  if (docCost.createdBy !== userId) {
    const canUpdateDoc = await checkUserPermission(userId, 'ALL_DEAL_UPDATE');
    if (!canUpdateDoc) throw new Error('Você não tem permissão para editar documentações');
  } else {
    const canUpdateDoc = await checkUserPermission(userId, 'DEAL_UPDATE');
    if (!canUpdateDoc) throw new Error('Você não tem permissão para editar documentações');
  }

  return prisma.documentationCost.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteDocumentationCost(
  id: number,
  userId: number
) {
  const docCost = await prisma.documentationCost.findUnique({
    where: { id },
    select: {
      createdBy: true,
      deal: true,
    },
  });
  if (!docCost) throw new Error('Documentação não encontrada.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  if (docCost.deal.companyId !== user.companyId) throw new Error('Você não pode editar documentação para essa empresa.');

  if (docCost.createdBy !== userId) {
    const canUpdateDoc = await checkUserPermission(userId, 'ALL_DEAL_DELETE');
    if (!canUpdateDoc) throw new Error('Você não tem permissão para editar documentações');
  } else {
    const canUpdateDoc = await checkUserPermission(userId, 'DEAL_DELETE');
    if (!canUpdateDoc) throw new Error('Você não tem permissão para editar documentações');
  }
  return prisma.documentationCost.delete({ where: { id }})
}

import { prisma } from "../prisma-client";
import { Prisma } from '@prisma/client';
import { checkUserPermission } from './rolePermissionRepository';

// Criar uma nota
export async function addNote(
  data: Omit<Prisma.NoteCreateInput, 'creator' | 'deal' | 'updater'> & {
    creatorId: number;
    dealId: number;
  },
  userId: number
) {
  const { creatorId, dealId, content } = data;

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

  if (deal.companyId !== user.companyId) throw new Error('Você não pode adicionar nota para essa empresa.');

  if (deal.createdBy !== userId) {
    const canCreateNote = await checkUserPermission(userId, 'ALL_DEAL_CREATE');
    if (!canCreateNote) throw new Error('Você não tem permissão para criar nota');
  } else {
    const canCreateNote = await checkUserPermission(userId, 'DEAL_CREATE');
    if (!canCreateNote) throw new Error('Você não tem permissão para criar nota');
  }

  return prisma.note.create({
    data: {
      content,
      deal: { connect: { id: dealId } },
      creator: { connect: { id: creatorId } },
      updater: { connect: { id: creatorId } },
    },
  });
}

// Pega o valor da Nota
export function getNote(dealId: number) {
  return prisma.note.findMany({
    where: { dealId },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Atualizar Nota
export async function updateNote(
  id: number,
  newContent: string,
  userId: number,
) {
  const updateData = {
    content: newContent,
    updatedBy: userId
  };
  const note = await prisma.note.findUnique({
    where: { id },
    select: {
      deal: true,
      createdBy: true,
    },
  });
  if (!note) throw new Error('Nota não encontrada.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  if (note.deal.companyId !== user.companyId) throw new Error('Você não pode editar nota para essa empresa.');

  if (note.createdBy !== userId) {
    const canUpdateNote = await checkUserPermission(userId, 'ALL_DEAL_UPDATE');
    if (!canUpdateNote) throw new Error('Você não tem permissão para editar nota');
  } else {
    const canUpdateNote = await checkUserPermission(userId, 'DEAL_UPDATE');
    if (!canUpdateNote) throw new Error('Você não tem permissão para editar nota');
  }

  return prisma.note.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteNote(
  id: number,
  userId: number
 ) {
  const note = await prisma.note.findUnique({
    where: { id },
    select: {
      createdBy: true,
      deal: true,
    },
  });
  if (!note) throw new Error('Nota não encontrada.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  if (note.deal.companyId !== user.companyId) throw new Error('Você não pode apagar nota para essa empresa.');

  if (note.createdBy !== userId) {
    const canDeleteNote = await checkUserPermission(userId, 'ALL_DEAL_DELETE');
    if (!canDeleteNote) throw new Error('Você não tem permissão para apagar nota');
  } else {
    const canDeleteNote = await checkUserPermission(userId, 'DEAL_DELETE');
    if (!canDeleteNote) throw new Error('Você não tem permissão para apagar nota');
  }

  return await prisma.note.delete({ where: { id }})
}

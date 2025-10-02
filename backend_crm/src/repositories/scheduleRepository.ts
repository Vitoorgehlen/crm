import { prisma } from "../../prisma/client";
import { Prisma } from '@prisma/client';
import { checkUserPermission } from './rolePermissionRepository';

// Criar um compromisso
export async function addSchedule(
  data: Omit<Prisma.ScheduleUncheckedCreateInput, "creator" | "updater" | "deal"> & { dealId?: number; },
  userId: number
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    })
    if (!user) throw new Error('Usuário não encontrado.');

    const { dealId, finish, ...rest } = data;
    if (dealId) {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
        select: {
          createdBy: true,
          companyId: true,
        },
      });

      if (!deal) throw new Error('Negociação não encontrado.');

      if (deal.companyId !== user.companyId) {
        throw new Error('Você não pode adicionar compromisso com essa negociação.');
      }

      if (deal.createdBy !== userId) {
        const canCreateNote = await checkUserPermission(userId, 'ALL_DEAL_CREATE');
        if (!canCreateNote) throw new Error('Você não tem permissão para criar compromisso');
      } else {
        const canCreateNote = await checkUserPermission(userId, 'DEAL_CREATE');
        if (!canCreateNote) throw new Error('Você não tem permissão para criar compromisso');
      }

      return tx.schedule.create({
        data: {
          ...rest,
          companyId: user.companyId,
          dealId,
          finish: false,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    return tx.schedule.create({
      data: {
        ...rest,
        companyId: user.companyId,
        finish: false,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  });
}

// Pega o compromissos
export function getSchedules(userId: number) {
  return prisma.schedule.findMany({
    where: { createdBy: userId },
    include: {
      deal : {
        include: {
          client: {
            select: { name: true }
          }
        }
       }
     }
  });
}

export async function editSchedule(
  id: number,
  data: Omit<Prisma.ScheduleUncheckedCreateInput, "creator" | "updater" | "deal"> & { dealId?: number; },
  userId: number
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    })
    if (!user) throw new Error('Usuário não encontrado.');

    const { dealId, ...rest } = data;

    const schedule = await tx.schedule.findUnique({
      where: { id },

    });
    if (!schedule) throw new Error('Compromisso não encontrado.');
    if (schedule.createdBy !== userId) throw new Error('Você não tem permissão para editar esse compromisso.');

    if (dealId) {
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
        select: {
          createdBy: true,
          companyId: true,
        },
      });

      if (!deal) throw new Error('Cliente não encontrado.');

      if (deal.companyId !== user.companyId) {
        throw new Error('Você não pode adicionar compromisso com essa negociação.');
      }

      if (deal.createdBy !== userId) {
        const canCreateNote = await checkUserPermission(userId, 'ALL_DEAL_CREATE');
        if (!canCreateNote) throw new Error('Você não tem permissão para criar compromisso');
      } else {
        const canCreateNote = await checkUserPermission(userId, 'DEAL_CREATE');
        if (!canCreateNote) throw new Error('Você não tem permissão para criar compromisso');
      }

      return tx.schedule.update({
        where: { id },
        data: {
          ...rest,
          companyId: user.companyId,
          dealId,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    return tx.schedule.update({
      where: { id },
      data: {
        ...rest,
        companyId: user.companyId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  });
}

export async function deleteSchedule(
  id: number,
  userId: number
 ) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
  });
  if (!schedule) throw new Error('Compromisso não encontrado.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  if (schedule.companyId !== user.companyId) throw new Error('Você não pode apagar compromissos para essa empresa.');

  if (schedule.createdBy !== userId) {
    throw new Error('Você não tem permissão para apagar compromissos.');
  }

  return await prisma.schedule.delete({ where: { id }})
}

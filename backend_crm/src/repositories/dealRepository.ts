import { prisma } from "../prisma-client";
import { Prisma, User } from '@prisma/client';
import { checkUserPermission } from './rolePermissionRepository';


// Criar um Deal
export async function addDeal(
  data: Omit<Prisma.DealCreateInput, 'creator' | 'client' | 'company'> & {
    creatorId: number;
    clientId: number;
  },
  userId: number,
) {
  const canCreateDeal = await checkUserPermission(userId, 'DEAL_CREATE');
  if (!canCreateDeal) throw new Error('Você não tem permissão para criar negociações');

  const { creatorId, clientId, ...dealData } = data;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { companyId: true },
  });
  if (!client) throw new Error('Cliente não encontrado.');

  const creator = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  });
  if (!creator) throw new Error('Usuário não encontrado.');

  if (client.companyId !== creator.companyId) throw new Error('Você não pode criar uma negociação para essa empresa.');

  return prisma.deal.create({
    data: {
      ...dealData,
      status: 'POTENTIAL_CLIENTS',
      creator: { connect: { id: creatorId } },
      client: { connect: { id: clientId } },
      updater: { connect: { id: creatorId } },
      company: { connect: { id: client.companyId } },
    },
  });
}

// Pega todos os clientes, menos os reprovados e que desistiram
export async function getDeals(
  userId: number,
  filter: { search?: string; status?: string[]; statusClient?: string[]}
) {
  const canReadDeal = await checkUserPermission(userId, 'DEAL_READ');
  if (!canReadDeal) throw new Error('Você não tem permissão para visualizar as negociações');

  const where: any = {
    createdBy: userId,
  }

  if (filter?.search && filter.search.trim()) {
    where.client = {
      OR: [
        {
          name: {
            contains: filter.search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: filter.search,
            mode: 'insensitive',
          },
        }
      ]
    }
  }

  if (filter?.status && filter.status.length > 0) {
    where.status = { in: filter.status }
  }

  if (filter?.statusClient && filter.statusClient.length > 0) {
    where.statusClient = { in: filter.statusClient }
  }

  return prisma.deal.findMany({
    where,
    include: {
      client: true,
      creator: { select: { id: true, name: true } },
      updater: { select: { id: true, name: true } },
      DealShare: {
        include: {
          user: {select: {id: true, name: true }}
        }
      }

    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getTeamPerformace(
  userId: number,
  startDate: string,
  endDate: string,
  selectedUser?: number,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');

  const canReadPerformance = await checkUserPermission(userId, 'ALL_DEAL_READ');
  if (!canReadPerformance) throw new Error('Você não tem permissão para visualizar a performace');

  const dealsWhere: any = {
    companyId: user.companyId,
  }

  if (selectedUser) {
    dealsWhere.createdBy = selectedUser
  }

  if (startDate && endDate) {
    dealsWhere.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    }
  }

  const dealsAndClients = await prisma.deal.findMany({
    where: dealsWhere,
    include: {
      client: { select: { name: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const clientWhere = {
    ...dealsWhere,
    deals: {
      none: {}
    }
  }

  const clientsWithoutDeals = await prisma.client.findMany({
    where: clientWhere,
    include: {
      creator: { select: { id: true, name: true } },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return { dealsAndClients, clientsWithoutDeals };
}

export async function getDealsByClient(id: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const userCompany = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!userCompany) throw new Error ('Usuário não encontrado');

    const targetClient = await prisma.client.findUnique({
      where: { id },
      select: { creator: {
        select: {
          id: true,
          companyId: true
        }
      }},
    });
    if (!targetClient) throw new Error ('Usuário não encontrado');

    if (userCompany.companyId !== targetClient.creator.companyId) {
      throw new Error ('Você não tem permissão de ver usuários dessa empresa');
    }

    if (userId !== targetClient.creator.id) {
      const canReadDeal = await checkUserPermission(userId, 'ALL_DEAL_READ');
      if (!canReadDeal) throw new Error('Você não tem permissão para ver as negociações');
    } else {
      const canReadDeal = await checkUserPermission(userId, 'DEAL_READ');
      if (!canReadDeal) throw new Error('Você não tem permissão para ver as negociações');
    }

    return tx.deal.findMany({
      where: { clientId: id }
    });
  });
}

export async function getTeamDeals(
  userId: number,
  filter: { search?: string; status?: string[]; statusClient?: string[]; selectedUserId?: number }
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado.');

    const canReadDeal = await checkUserPermission(userId, 'ALL_DEAL_READ');
    if (!canReadDeal) throw new Error('Você não tem permissão para visualizar as negociações');

    const where: any = {
      companyId: user.companyId,
    }

    if (filter?.search && filter.search.trim()) {
      where.client = {
        OR: [
          {
            name: {
              contains: filter.search,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: filter.search,
              mode: 'insensitive',
            },
          }
        ]
      }
    }

    if (filter?.status && filter.status.length > 0) {
      where.status = { in: filter.status }
    }

    if (filter?.statusClient && filter.statusClient.length > 0) {
      where.statusClient = { in: filter.statusClient }
    }


    if (filter.selectedUserId) {
      const selectedUser = await tx.user.findUnique({
        where: { id: filter.selectedUserId },
        select: { companyId: true }
      });

      if (user.companyId !== selectedUser?.companyId) throw new Error('Sem permissão para ler clientes desse usuário');

      where.createdBy = filter.selectedUserId
    }

    return tx.deal.findMany({
      where,
      include: {
        client: true,
        creator: { select: { id: true, name: true } },
        updater: { select: { id: true, name: true } },
        DealShare: {
          include: {
            user: {select: {id: true, name: true }}
          }
        }

      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });
}

export async function getDealDeletedRequest(userId: number) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user) throw new Error('Usuário não encontrado.');

    return await tx.deal.findMany({
      where: {
        companyId: user.companyId,
        deleteRequest: true,
      },
      include: {
        client: true,
        deleteRequester: { select: { name: true }}
      },
    });
  });
}

// Atualizar deal
export async function updateDeal(
  id: number,
  newData: Partial<Prisma.DealUncheckedUpdateInput>,
  userId: number,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');

  const targetDeal = await prisma.deal.findUnique({ where: { id } });
  if (!targetDeal) throw new Error('Negociação não encontrada.');

  if (user.companyId !== targetDeal.companyId) {
    throw new Error('Você não tem permissão para editar as negociações dessa empresa');
  }

  if (userId !== targetDeal.createdBy) {
    const canUpdateDeal = await checkUserPermission(userId, 'ALL_DEAL_UPDATE');
    if (!canUpdateDeal) throw new Error('Você não tem permissão para editar as negociações');
  } else {
    const canUpdateDeal = await checkUserPermission(userId, 'DEAL_UPDATE');
    if (!canUpdateDeal) throw new Error('Você não tem permissão para editar as negociações');
  }

  const updateData = { ...newData, updatedBy: userId };

  if (newData.status === 'CLOSED' || newData.status === 'FINISHED') {
    throw new Error('Para fechar ou finalizar a negociação, utilize a função adequada.');
  }

  let newStatus = newData.status;
  if (newData.statusClient) {
    if (newData.statusClient === 'REJECTED' || newData.statusClient === 'DROPPED_OUT') {
      newStatus = 'OLD_CLIENTS';
    } else if (targetDeal.status === 'OLD_CLIENTS'){
      newStatus = 'POTENTIAL_CLIENTS';
    }
  }

  return await prisma.deal.update({
    where: { id },
    data: {
      ...updateData,
      status: newStatus,
    },
  });
}

export async function deleteDeal(
  id: number,
  userId: number,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado.');

    const targetDeal = await tx.deal.findUnique({
      where: { id },
      include: { client: true }
      });
    if (!targetDeal) throw new Error('Negociação não encontrada.');

    if (user.companyId !== targetDeal.companyId) {
      throw new Error('Você não tem permissão para apagar as negociações dessa empresa');
    }

    if (userId !== targetDeal.client.createdBy) {
      const canDeleteDeal = await checkUserPermission(userId, 'ALL_DEAL_DELETE');
      if (!canDeleteDeal) throw new Error('Você não tem permissão para apagar as negociações');
    } else {
      const canDeleteDeal = await checkUserPermission(userId, 'DEAL_DELETE');
      if (!canDeleteDeal) {
        return tx.deal.update({
            where: { id },
            data: {
              deleteRequest: true,
              deleteRequestBy: userId,
              deleteRequestAt: new Date(),
             },
          });
      }
    }

    await tx.note.deleteMany({ where: { dealId: id } })

    return tx.deal.delete({ where: { id } });
  })
}

import { prisma } from "../prisma-client";
import { Prisma } from '@prisma/client';
import { checkUserPermission } from './rolePermissionRepository';
import { PLAN_CONFIG } from "../utils/plans";

export async function addClient(
  creatorId: number,
  data: Prisma.ClientCreateInput
) {
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { companyId: true }
  });
  if (!creator) throw new Error('Usuário criador não encontrado');

  const canCreateClient = await checkUserPermission(creatorId, 'DEAL_CREATE');
  if (!canCreateClient) throw new Error('Você não tem permissão para criar clientes');

  if (!data.name || data.name.length <= 2) throw new Error('Nome curto demais');

  const { dateOfBirth, ...rest } = data;
  let parsedDate: Date | null = null;

  if (dateOfBirth) {
    if (typeof dateOfBirth === "string") {
      const [year, month, day] = dateOfBirth.split("-").map(Number);
      parsedDate = new Date(year, month - 1, day);
    } else if (dateOfBirth instanceof Date) {
      parsedDate = new Date(
        dateOfBirth.getFullYear(),
        dateOfBirth.getMonth(),
        dateOfBirth.getDate()
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const newClient = await tx.client.create({
      data: {
        ...rest,
        dateOfBirth: parsedDate,
        company: { connect: { id: creator.companyId } },
        creator: { connect: { id: creatorId } },
        updater: { connect: { id: creatorId } },
      },
      include: {
        company: { select: { name: true } },
        creator: { select: { name: true, email: true } },
        updater: { select: { name: true, email: true } }
      }
    });

    return newClient;
  });
}

export async function getClientById(
  id: number,
  userId: number,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        company: { select: { plan: true } },
        companyId: true },
    });
    if (!user) throw new Error('Usuário não encontrado.');

    const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.TEAM_DEALS;
    if (!hasTeamDeals)
      throw new Error('Seu plano não possui permissão para ler clientes da equipe');

    const client = await tx.client.findUnique({
      where: { id, companyId: user.companyId },
      include: {
        creator: { select: { name: true, email: true } },
        updater: { select: { name: true, email: true } }
      },
    });
    if (!client) throw new Error ('Cliente não encontrado');

    if (userId !== client.createdBy) {
      const canReadClient = await checkUserPermission(userId, 'ALL_DEAL_READ');
      if (!canReadClient) throw new Error('Você não tem permissão para ver os clientes.');
    } else {
      const canReadClient = await checkUserPermission(userId, 'DEAL_READ');
      if (!canReadClient) throw new Error('Você não tem permissão para ver os clientes.');
    }

    return client;
  })
}

export async function getBirthdayClients(
  month: number,
  userId: number,
) {
  const canReadClient = await checkUserPermission(userId, 'DEAL_READ');
  if (!canReadClient) throw new Error('Você não tem permissão para ver os clientes.');

  let startMonth = month - 1;
  let endMonth = month + 1;

  if (startMonth < 1) startMonth = 12;
  if (endMonth > 12) endMonth = 1;

  return await prisma.$queryRaw`
    SELECT * FROM "Client"
    WHERE EXTRACT(MONTH FROM "dateOfBirth") IN (${startMonth}, ${month}, ${endMonth})
    AND "createdBy" = ${userId}
  `;
}

export async function getClientDeletedRequest(userId: number) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        company: { select: { plan: true } },
        companyId: true },
    });
    if (!user) throw new Error('Usuário não encontrado.');

    const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.DELETE_REQUESTS;
    if (!hasTeamDeals)
      throw new Error('Seu plano não possui acesso a requisições');

    const canReadClient = await checkUserPermission(userId, 'ALL_DEAL_DELETE');
    if (!canReadClient) throw new Error('Você não tem permissão para ver os clientes.');

    return tx.client.findMany({
      where: {
        companyId: user.companyId,
        deleteRequest: true,
      },
      include: {
        deals: true,
        deleteRequester: { select: { name: true }}
      },
    });
  });
}

export async function getMyClients(
  userId: number,
  search: string,
  page: number,
  limit: number,
  clientId?: number
) {
  const where: any = {
    createdBy: userId,
  };

  const canReadClient = await checkUserPermission(userId, 'DEAL_READ');
  if (!canReadClient) throw new Error('Você não tem permissão para ver os clientes.');

  if (clientId) {
      const data = await prisma.client.findMany({
        where: { id: clientId },
        include: {
          creator: { select: { name: true, email: true } },
          updater: { select: { name: true, email: true } }
        }
      });

      const total = await prisma.client.count({ where });

      return { data, total};
    } else if (search) {
    where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        }
      ]
  }
  return prisma.$transaction(async (tx) => {
    const data = await tx.client.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { isPriority: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
          creator: { select: { name: true, email: true } },
          updater: { select: { name: true, email: true } }
        }
      });

    const total = await tx.client.count({ where });

    return { data, total}
  });
}

export async function getTeamClients(
  userId: number,
  search: string,
  page: number,
  limit: number,
  selectedUser: number | null,
  clientId?: number) {
  const canReadClient = await checkUserPermission(userId, 'ALL_DEAL_READ');
  if (!canReadClient) throw new Error('Você não tem permissão para ler clientes da equipe');

  const where: any = {};

  return prisma.$transaction(async (tx) => {
    const company = await tx.user.findUnique({
      where: { id: userId },
      select: {
        company: { select: { plan: true } },
        companyId: true }
    });
    if (!company) throw new Error('Empresa não encontrada');

    const hasTeamDeals = PLAN_CONFIG[company.company.plan].features.TEAM_DEALS;
    if (!hasTeamDeals)
      throw new Error('Seu plano não possui acesso a negociações em equipe');

    if (selectedUser !== null) {
      const userSelected = await tx.user.findUnique({
        where: { id: selectedUser },
        select: { companyId: true }
      });
      if (company.companyId !== userSelected?.companyId) throw new Error('Sem permissão para visualizar os clientes desse usuário');

      where.AND = [{ createdBy: selectedUser }];
    } else where.AND = [{ companyId: company.companyId }];

    if (clientId) {
      const data = await prisma.client.findMany({
        where: { id: clientId },
        include: {
          creator: { select: { name: true, email: true } },
          updater: { select: { name: true, email: true } }
        }
      });

      const total = await prisma.client.count({ where });

      return { data, total};
    } else if (search) {
      where.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: search,
              mode: 'insensitive',
            },
          }
        ]
    }

    const data = await tx.client.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { isPriority: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        creator: { select: { name: true } },
        updater: { select: { name: true } }
      }
    });

    const total = await tx.client.count({ where })

    return ({ data, total })
  })
}

export async function updateClient(
  id: number,
  newData: Partial<Prisma.ClientUncheckedUpdateInput>,
  userId: number,
) {
  return prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { company: { select: { plan: true } }, companyId: true }
    });
    if (!currentUser) throw new Error('Usuario não encontrado não encontrado');

    const clientToUpdate = await tx.client.findUnique({
      where: { id, companyId: currentUser.companyId }
    });
    if (!clientToUpdate) throw new Error('Cliente não encontrado');

    if (userId !== clientToUpdate.createdBy) {
      const hasTeamDeals = PLAN_CONFIG[currentUser.company.plan].features.TEAM_DEALS;
      if (!hasTeamDeals)
        throw new Error('Seu plano não possui acesso a negociações em equipe');

      const canUpdateClient = await checkUserPermission(userId, 'ALL_DEAL_UPDATE');
      if (!canUpdateClient) throw new Error('Você não tem permissão para atualizar clientes.');
    } else {
      const canUpdateClient = await checkUserPermission(userId, 'DEAL_UPDATE');
      if (!canUpdateClient) throw new Error('Você não tem permissão para atualizar clientes.');
    }

    const updateData = { ...newData,updatedBy: userId };

    if (updateData.dateOfBirth === '') {
      updateData.dateOfBirth = null;
    } else if (typeof updateData.dateOfBirth === 'string') {
      const [year, month, day] = updateData.dateOfBirth.split("-").map(Number);
      updateData.dateOfBirth = new Date(year, month - 1, day);
    } else if (updateData.dateOfBirth instanceof Date) {
      updateData.dateOfBirth = new Date(
        updateData.dateOfBirth.getFullYear(),
        updateData.dateOfBirth.getMonth(),
        updateData.dateOfBirth.getDate()
      );
    }

    return tx.client.update({
      where: { id },
      data: updateData,
    });
  })
}

export async function deleteClient(id: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { company: {select: { plan: true } }, companyId: true }
    });
    if (!currentUser) throw new Error('Usuario não encontrado não encontrado');

    const clientToDelete = await tx.client.findUnique({
      where: { id, companyId: currentUser.companyId }
    });
    if (!clientToDelete) throw new Error('Cliente não encontrado');

    if (clientToDelete.createdBy !== userId) {
      const hasTeamDeals = PLAN_CONFIG[currentUser.company.plan].features.DELETE_REQUESTS;
      if (!hasTeamDeals)
        throw new Error('Seu plano não possui acesso a negociações em equipe');

      const canDeleteClient = await checkUserPermission(userId, 'ALL_DEAL_DELETE');
      if (!canDeleteClient) throw new Error('Você não tem permissão para apagar clientes');
    } else {
      const canDeleteClient = await checkUserPermission(userId, 'DEAL_DELETE');
      if (!canDeleteClient) {
        return tx.client.update({
          where: { id },
          data: {
            deleteRequest: true,
            deleteRequestBy: userId,
            deleteRequestAt: new Date(),
          },
        });
      }
    }

    await tx.deal.deleteMany({
      where: { clientId: id }
    });

    return tx.client.delete({ where: { id } });
  });
}

import { prisma } from "../prisma-client";
import { Prisma, UserRole } from '@prisma/client';
import { checkUserPermission } from './rolePermissionRepository';

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

  const { dateOfBirth, ...rest } = data;

  return prisma.$transaction(async (tx) => {
    const newClient = await tx.client.create({
      data: {
        ...rest,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
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
  const client = await prisma.client.findUnique({
    where: { id },
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
}

export async function getClientDeletedRequest(userId: number) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!user) throw new Error('Usuário não encontrado.');

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

// Pega todos os clientes feitos pelo User
export async function getMyClients(userId: number) {
  return prisma.client.findMany({
    where: { createdBy: userId },
    include: {
        creator: { select: { name: true, email: true } },
        updater: { select: { name: true, email: true } }
      }
  });
}

// Pega clientes feitos pelo User procurando pelo nome
export async function getMyClientsBySearch(userId: number, search: string) {
  return prisma.client.findMany({
    where: {
      createdBy: userId,
      OR: [
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

    },
    include: {
        creator: { select: { name: true, email: true } },
        updater: { select: { name: true, email: true } }
      }
  });
}

// Pega todos os clientes feitos pela equipe
export async function getTeamClients(userId: number) {
  const canReadClient = await checkUserPermission(userId, 'ALL_DEAL_READ');
  if (!canReadClient) throw new Error('Você não tem permissão para ler clientes');

  const company = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  });
  if (!company) throw new Error('Empresa não encontrada');

  return prisma.client.findMany({
    where: { companyId: company.companyId },
    include: {
      creator: { select: { name: true } },
      updater: { select: { name: true } }
    }
  });
}

export async function getTeamClientsBySearch(userId: number, search: string) {
  const canReadClient = await checkUserPermission(userId, 'ALL_DEAL_READ');
  if (!canReadClient) throw new Error('Você não tem permissão para ler clientes');

  const company = await prisma.user.findUnique({
    where: { id: userId },
    select: {companyId: true }
  });
  if (!company) throw new Error('Empresa não encontrada');

  return prisma.client.findMany({
    where: {
      companyId: company.companyId,
      OR: [
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
    },
    include: {
        creator: { select: { name: true, email: true } },
        updater: { select: { name: true, email: true } }
      }
  });
}

// Atualizar cliente
export async function updateClient(
  id: number,
  newData: Partial<Prisma.ClientUncheckedUpdateInput>,
  userId: number,
) {
  const clientToUpdate = await prisma.client.findUnique({
    where: { id }
  });
  if (!clientToUpdate) throw new Error('Cliente não encontrado');

  const currentUser = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!currentUser) throw new Error('Usuario não encontrado não encontrado');

  if (clientToUpdate.companyId !== currentUser.companyId) {
    throw new Error('Você não tem permissão de editar clientes dessa empresa');
  }

  if (userId !== clientToUpdate.createdBy) {
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
    let date = new Date(updateData.dateOfBirth);
    if (isNaN(date.getTime())) {
      date = new Date(`${updateData.dateOfBirth}T00:00:00Z`);
    }
    if (isNaN(date.getTime())) {
      throw new Error('Formato de dateOfBirth inválido. Use YYYY-MM-DD ou ISO-8601.');
    }
    updateData.dateOfBirth = date;
  }
  return prisma.client.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteClient(id: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const clientToDelete = await tx.client.findUnique({
      where: { id }
    });
    if (!clientToDelete) throw new Error('Cliente não encontrado');

    const currentUser = await tx.user.findUnique({
      where: { id: userId }
    });
    if (!currentUser) throw new Error('Usuario não encontrado não encontrado');


    if (currentUser.companyId !== clientToDelete.companyId) {
      throw new Error('Você não tem permissão para apagar clientes desta empresa.');
    }

    if (clientToDelete.createdBy !== currentUser.id) {
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

import { prisma } from "../prisma/client";
import { checkUserPermission } from './rolePermissionRepository';

// Pega todos os DealShare que é do User
export async function getCommission(
  userId: number,
  filters: {
    name?: string;
    // year?: number;
  }
) {
  const canReadDeal = await checkUserPermission(userId, 'DEAL_READ');
  if (!canReadDeal) throw new Error('Você não tem permissão para visualizar as negociações');

  const where: any = {
    DealShare: {
      some: {
        userId: userId,
      }
    },
    status: { in: ['CLOSED', 'FINISHED']}
  }

  if (filters?.name) {
    where.client = {
      name: {
        contains: filters.name,
        mode: 'insensitive'
      }
    }
  }


  return prisma.deal.findMany({
    where,
    include: {
      client: true,
      creator: { select: { id: true, name: true } },
      DealShare: {
        where: { userId },
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

export async function getTeamDeals(
  userId: number,
  filter: { name?: string; status?: string[]; statusClient?: string[]}
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');

  const canReadDeal = await checkUserPermission(userId, 'ALL_DEAL_READ');
  if (!canReadDeal) throw new Error('Você não tem permissão para visualizar as negociações');

  const where: any = {
    companyId: user.companyId,
  }

  if (filter?.name && filter.name.trim()) {
    where.client = {
      name: {
        contains: filter.name,
        mode: 'insensitive'
      }
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

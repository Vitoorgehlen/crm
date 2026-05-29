import { prisma } from "../prisma-client";
import { checkUserPermission } from './rolePermissionRepository';

export async function getCommission(
  userId: number,
  filters: { name?: string }
) {
  const canReadDeal = await checkUserPermission(userId, 'DEAL_READ');
  if (!canReadDeal) throw new Error('Você não tem permissão para visualizar as negociações');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  });

  if (!user) throw new Error('Usuário não encontrado');

  const where: any = {
    companyId: user.companyId,
    DealShare: {
      some: { userId }
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

export async function getChartCommissions(userId: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);

  return prisma.dealShare.findMany({
    where: {
      userId,
      isPaid: true,
      paidAt : {
        gte: startDate,
        lte: endDate
      }
    }
  });
}

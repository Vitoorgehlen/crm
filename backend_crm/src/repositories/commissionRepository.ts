import { prisma } from "../prisma-client";
import { checkUserPermission } from './rolePermissionRepository';
import { PLAN_CONFIG } from "../utils/plans";

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

  const commissions = await prisma.dealShare.findMany({
    where: {
      userId,
      isPaid: true,
      paidAt : {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const monthlyRevenue = Array.from({ length: 12 }, () => 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  for (const commission of commissions) {
    if (!commission.paidAt) continue;

    const monthDiff =
      (currentYear - commission.paidAt.getFullYear()) * 12 +
      (currentMonth - commission.paidAt.getMonth());

    if (monthDiff >= 0 && monthDiff < 12) {
      monthlyRevenue[monthDiff] += Number(commission.amount);
    }
  }

  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  return monthlyRevenue.map((value, index) => ({
    name: months[(currentMonth - index + 12) % 12],
    value,
  }));
}

export async function getCompanyRevenue(userId: number) {
  const canReadCommissions = await checkUserPermission(userId, 'EXPENSE_READ');
  if (!canReadCommissions) throw new Error('Você não tem permissão para visualizar as comissões da empresa');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { company: { select: { plan: true } }, companyId: true }
  });
  if (!user) throw new Error('Usuário não encontrado');

  const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
  if (!hasTeamDeals)
    throw new Error('Seu plano não possui acesso a despesas');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);

  const companyCommissions = await prisma.dealShare.findMany({
    where: {
      companyId: user.companyId,
      isCompany: true,
      isPaid: true,
      paidAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const companyIncome = await prisma.expense.findMany({
    where: {
      companyId: user.companyId,
      isIncome: true,
      isPaid: true,
      newDueDate : {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const monthlyRevenue = Array.from({ length: 12 }, () => 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  for (const commission of companyCommissions) {
    if (!commission.paidAt) continue;

    const monthDiff =
      (currentYear - commission.paidAt.getFullYear()) * 12 +
      (currentMonth - commission.paidAt.getMonth());

    if (monthDiff >= 0 && monthDiff < 12) {
      monthlyRevenue[monthDiff] += Number(commission.amount);
    }
  }

  for (const income of companyIncome) {
    const monthDiff =
      (currentYear - income.newDueDate.getFullYear()) * 12 +
      (currentMonth - income.newDueDate.getMonth());

    if (monthDiff >= 0 && monthDiff < 12) {
      monthlyRevenue[monthDiff] += Number(income.value);
    }
  }

  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  return monthlyRevenue.map((value, index) => ({
    name: months[(currentMonth - index + 12) % 12],
    value,
  }));
}

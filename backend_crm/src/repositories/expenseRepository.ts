import { prisma } from "../prisma-client";
import { Prisma } from '@prisma/client';
import { checkUserPermission } from './rolePermissionRepository';
import { PLAN_CONFIG } from "../utils/plans";

export async function addExpense(
  data: Prisma.ExpenseUncheckedCreateInput,
  userId: number
) {
  const { isPaid } = data;
  if (isPaid) throw new Error('Despesa já paga.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { company: { select: { plan: true } }, companyId: true }
  });
  if (!user) throw new Error('Usuário não encontrado.');

  const canCreateExpense = await checkUserPermission(userId, 'EXPENSE_CREATE');
  if (!canCreateExpense) throw new Error('Você não tem permissão para criar despesa');

  const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
  if (!hasTeamDeals)
    throw new Error('Seu plano não possui acesso a negociações em equipe');

  return prisma.expense.create({
    data: {
      ...data,
      newDueDate: new Date(data.newDueDate),
      isPaid: false,
      companyId: user.companyId,
      createdBy: userId,
      updatedBy: userId,
    },
  });
}

export async function getExpense(userId: number, year: string) {
    const user = await prisma.user.findUnique({
      where: { id : userId },
      select: { company: { select: { plan: true } }, companyId: true }
    });
    if (!user) throw new Error('Empresa não encontrada');

    const canUpdateExpense = await checkUserPermission(userId, 'EXPENSE_READ');
    if (!canUpdateExpense) throw new Error('Você não tem permissão para ler as despesas');

    const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
    if (!hasTeamDeals)
      throw new Error('Seu plano não possui acesso a negociações em equipe');

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    return prisma.expense.findMany({
      where: {
        companyId: user.companyId,
        newDueDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
}

export async function getFirstExpenseMonth(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { company: { select: { plan: true } }, companyId: true }
  });

  if (!user?.companyId) throw new Error('Empresa não encontrada');

  const canUpdateExpense = await checkUserPermission(userId, 'EXPENSE_READ');
  if (!canUpdateExpense) throw new Error('Você não tem permissão para ler as despesas');

  const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
  if (!hasTeamDeals)
    throw new Error('Seu plano não possui acesso a negociações em equipe');

  return prisma.client.findFirst({
    where: { companyId: user.companyId },
    select: {
      createdAt: true,
    },
  });
}

export async function updateExpense(
  id: number,
  data: Prisma.ExpenseUpdateInput,
  userId: number,
) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new Error('Despesa não encontrada.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { company: { select: { plan: true } }, companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  if (expense.companyId !== user.companyId) throw new Error('Você não pode editar despesa para essa empresa.');

  const canUpdateExpense = await checkUserPermission(userId, 'EXPENSE_UPDATE');
  if (!canUpdateExpense) throw new Error('Você não tem permissão para editar despesas');

  const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
  if (!hasTeamDeals)
    throw new Error('Seu plano não possui acesso a negociações em equipe');

  const parsedNewDueDate =
  typeof data.newDueDate === 'string'
    ? new Date(data.newDueDate)
    : data.newDueDate;

  return prisma.expense.update({
    where: { id },
    data: { ...data, newDueDate: parsedNewDueDate,updatedBy: userId },
  });
}

export async function deleteExpense(
  id: number,
  userId: number
 ) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { company: { select: { plan: true } }, companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  const expense = await prisma.expense.findUnique({
    where: { id, companyId: user.companyId },
    select: { companyId: true }
  });
  if (!expense) throw new Error('Despesa não encontrada.');

  if (expense.companyId !== user.companyId) throw new Error('Você não pode apagar despesas desta empresa.');

  const canDeleteExpense = await checkUserPermission(userId, 'EXPENSE_DELETE');
  if (!canDeleteExpense) throw new Error('Você não tem permissão para apagar despesas');

  const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
  if (!hasTeamDeals)
    throw new Error('Seu plano não possui acesso a negociações em equipe');

  return await prisma.expense.delete({ where: { id, companyId: user.companyId } })
}

import { prisma } from "../prisma-client";
import { Prisma } from '@prisma/client';
import { checkUserPermission } from './rolePermissionRepository';

// Criar uma despesa
export async function addExpense(
  data: Prisma.ExpenseUncheckedCreateInput,
  userId: number
) {
  const { isPaid } = data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  const canCreateExpense = await checkUserPermission(userId, 'EXPENSE_CREATE');
  if (!canCreateExpense) throw new Error('Você não tem permissão para criar despesa');

  if (isPaid) throw new Error('Despesa já paga.');

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

// Pega o valor da Despesa
export async function getExpense(userId: number, year: string) {
    const user = await prisma.user.findUnique({
      where: { id : userId },
      select: { companyId: true },
    });

    if (!user) throw new Error('Empresa não encontrada');

    const canUpdateExpense = await checkUserPermission(userId, 'EXPENSE_READ');
    if (!canUpdateExpense) throw new Error('Você não tem permissão para ler as despesas');

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

// Pega o valor da Despesa
export async function getFirstExpenseMonth(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  });

  if (!user?.companyId) throw new Error('Empresa não encontrada');

  return prisma.client.findFirst({
    where: { companyId: user.companyId },
    select: {
      createdAt: true,
    },
  });
}

// Atualizar Nota
export async function updateExpense(
  id: number,
  data: Prisma.ExpenseUpdateInput,
  userId: number,
) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new Error('Despesa não encontrada.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  if (expense.companyId !== user.companyId) throw new Error('Você não pode editar despesa para essa empresa.');

  const canUpdateExpense = await checkUserPermission(userId, 'EXPENSE_UPDATE');
  if (!canUpdateExpense) throw new Error('Você não tem permissão para editar despesas');

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
  const expense = await prisma.expense.findUnique({
    where: { id },
    select: { companyId: true }
  });
  if (!expense) throw new Error('Despesa não encontrada.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })
  if (!user) throw new Error('Usuário não encontrado.');

  if (expense.companyId !== user.companyId) throw new Error('Você não pode apagar despesas desta empresa.');

  const canDeleteExpense = await checkUserPermission(userId, 'EXPENSE_DELETE');
  if (!canDeleteExpense) throw new Error('Você não tem permissão para apagar despesas');

  return await prisma.expense.delete({ where: { id }})
}

import { prisma } from "../prisma-client";
import { Prisma } from '@prisma/client';
import { checkUserPermission } from './rolePermissionRepository';
import { PLAN_CONFIG } from "../utils/plans";

export async function addExpense(
  data: Prisma.ExpenseUncheckedCreateInput,
  userId: number
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { company: { select: { plan: true } }, companyId: true }
  });
  if (!user) throw new Error('Usuário não encontrado.');

  const canCreateExpense = await checkUserPermission(userId, 'EXPENSE_CREATE');
  if (!canCreateExpense) throw new Error('Você não tem permissão para criar despesa');

  const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
  if (!hasTeamDeals)
    throw new Error('Seu plano não possui acesso a despesas');

  return prisma.$transaction(async (tx) => {
    const createdCompany = await tx.client.findFirst({
      where: { companyId: user.companyId },
      select: { createdAt: true },
    });

    if (!createdCompany) throw new Error('Erro ao buscar despesas');
    if (new Date(data.newDueDate) < createdCompany.createdAt)
      throw new Error(`Você só pode salvar despesas após a data de criação da sua empresa. (${new Date(createdCompany.createdAt).toLocaleDateString('pt-BR')})`);
    const isPaid = data.isIncome || data.recurrenceType === 'NONE';

    const dueDates: Date[] = [];
    const startDate = new Date(data.newDueDate);

    if (
      data.recurrenceType === 'WEEKLY' ||
      data.recurrenceType === 'BIWEEKLY'
    ) {
      const increment = data.recurrenceType === 'WEEKLY' ? 7 : 14;
      let currentDate = new Date(startDate);

      while (currentDate.getMonth() === startDate.getMonth()) {
        dueDates.push(new Date(currentDate));

        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + increment);
      }
    } else {
      dueDates.push(startDate);
    }

    const firstExpense = await tx.expense.create({
      data: {
        ...data,
        isPaid,
        companyId: user.companyId,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    let newExpense = [firstExpense];

    for (let i = 1; i < dueDates.length; i++) {
      const expense = await tx.expense.create({
        data: {
          ...data,
          isPaid,
          label: `${data.label} (${i})`,
          newDueDate: dueDates[i],
          parentExpenseId: firstExpense.id,
          companyId: user.companyId,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      newExpense.push(expense)
    }

    let movement = null;

    if (isPaid && !data.isRecurringActive) {
      movement = await tx.financialMovement.create({
        data: {
          companyId: user.companyId,
          type: data.isIncome ? 'INCOME' : 'EXPENSE',
          description: data.label,
          amount: data.value,
          expenseId: newExpense[0].id,
          createdBy: userId,
          updatedBy: userId,
        }
      });
    }

    return {newExpense, movement}
  })
}

export async function getExpense(userId: number, month: number, year: number) {
    const user = await prisma.user.findUnique({
      where: { id : userId },
      select: { company: { select: { plan: true } }, companyId: true }
    });
    if (!user) throw new Error('Empresa não encontrada');

    const canUpdateExpense = await checkUserPermission(userId, 'EXPENSE_READ');
    if (!canUpdateExpense) throw new Error('Você não tem permissão para ler as despesas');

    const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
    if (!hasTeamDeals)
      throw new Error('Seu plano não possui acesso a despesas');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return prisma.expense.findMany({
      where: {
        companyId: user.companyId,
        newDueDate: {
          gte: startDate,
          lt: endDate,
        }
      },
      include: {
        creator: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
}

export async function getExpenseRange(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { company: { select: { plan: true } }, companyId: true }
  });

  if (!user?.companyId) throw new Error('Empresa não encontrada');

  const canUpdateExpense = await checkUserPermission(userId, 'EXPENSE_READ');
  if (!canUpdateExpense) throw new Error('Você não tem permissão para ler as despesas');

  const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
  if (!hasTeamDeals)
    throw new Error('Seu plano não possui acesso a despesas');

  const createdCompany = await prisma.client.findFirst({
    where: { companyId: user.companyId },
    select: { createdAt: true },
  });

  const lastExpense = await prisma.expense.findFirst({
    where: { companyId: user.companyId },
    orderBy: { newDueDate: 'desc'},
    select: { newDueDate: true },
  });

  return {createdCompany, lastExpense}
}

export async function getRecurringExpense(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id : userId },
    select: { company: { select: { plan: true } }, companyId: true }
  });
  if (!user) throw new Error('Empresa não encontrada');

  const canUpdateExpense = await checkUserPermission(userId, 'EXPENSE_READ');
  if (!canUpdateExpense) throw new Error('Você não tem permissão para ler as despesas');

  const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
  if (!hasTeamDeals)
    throw new Error('Seu plano não possui acesso a despesas');

  return prisma.expense.findMany({
    where: {
      companyId: user.companyId,
      isRecurringActive: true,
      parentExpenseId: null,
    },
    include: {
      creator: {
        select: {
          name: true,
        },
      },
      childExpenses: {
        orderBy: {
          newDueDate: 'desc',
        },
        take: 1,
        select: {
          id: true,
          label: true,
          value: true,
          newDueDate: true,
        },
      },
    },
  });
}

export async function updateExpense(
  id: number,
  data: Prisma.ExpenseUncheckedUpdateInput,
  userId: number,
) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new Error('Despesa não encontrada.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      company: { select: { plan: true } },
      companyId: true,
    },
  });

  if (!user) throw new Error('Usuário não encontrado.');

  if (expense.companyId !== user.companyId)
    throw new Error('Você não pode editar despesa para essa empresa.');

  const canUpdateExpense = await checkUserPermission(
    userId,
    'EXPENSE_UPDATE',
  );

  if (!canUpdateExpense)
    throw new Error('Você não tem permissão para editar despesas');

  const hasTeamDeals =
    PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;

  if (!hasTeamDeals)
    throw new Error(
      'Seu plano não possui acesso a despesas',
    );

  if (expense.isIncome !== data.isIncome)
    throw new Error('Não é permitido alterar o tipo da movimentação');

  const parsedNewDueDate =
    data.newDueDate instanceof Date
      ? data.newDueDate
      : data.newDueDate
        ? new Date(String(data.newDueDate))
        : expense.newDueDate;

  const newValue = data.value !== undefined ? Number(data.value) : expense.value.toNumber();

  const newIsPaid = expense.isIncome
    ? true
    : data.isPaid !== undefined
      ? Boolean(data.isPaid)
      : expense.isPaid;

  const description =
    typeof data.label === 'string'
      ? data.label
      : expense.label;

  return prisma.$transaction(async (tx) => {
    const createdCompany = await tx.client.findFirst({
      where: { companyId: user.companyId },
      select: { createdAt: true },
    });

    if (!createdCompany) throw new Error('Erro ao buscar despesas');
    if (parsedNewDueDate < createdCompany.createdAt)
      throw new Error(`Você só pode salvar despesas após a data de criação da sua empresa. (${new Date(createdCompany.createdAt).getDate()})`);

    const updatedExpense = await tx.expense.update({
      where: { id },
      data: {
        ...data,
        isPaid: newIsPaid,
        isRecurringActive: data.recurrenceType !== 'NONE',
        newDueDate: parsedNewDueDate,
        updatedBy: userId,
      },
    });

    let updatedMovement;
    const movement = await tx.financialMovement.findUnique({ where: { expenseId: expense.id }});
    if (newIsPaid) {
      if (movement) {
        updatedMovement = await tx.financialMovement.update({
          where: { expenseId: expense.id },
          data: {
            description,
            amount: newValue,
            updatedBy: userId
          }
        });
      } else {
        updatedMovement = await tx.financialMovement.create({
          data: {
            companyId: user.companyId,
            type: expense.isIncome ? 'INCOME' : 'EXPENSE',
            description,
            amount: newValue,
            expenseId: expense.id,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }
    } else {
      if (movement) {
        updatedMovement = await tx.financialMovement.delete({
          where: { expenseId: expense.id }
        });
      }
    }

    const recurrenceChanged =
      expense.recurrenceType !== data.recurrenceType ||
      expense.isRecurringActive !== data.isRecurringActive;

    if (recurrenceChanged) {
      const rootExpenseId = expense.parentExpenseId ?? expense.id;

      await tx.expense.deleteMany({
        where: {
          parentExpenseId: rootExpenseId,
          newDueDate: {
            gt: expense.newDueDate,
          },
        },
      });

      const recurrenceType = data.recurrenceType ?? expense.recurrenceType;
      const startDate = parsedNewDueDate instanceof Date
        ? parsedNewDueDate
        : (expense.newDueDate instanceof Date ? expense.newDueDate : new Date());      const dueDates: Date[] = [];

      if (recurrenceType === 'WEEKLY') {
        let current = new Date(startDate);

        while (current.getMonth() === startDate.getMonth()) {
          dueDates.push(new Date(current));
          current.setDate(current.getDate() + 7);
        }
      }

      if (recurrenceType === 'BIWEEKLY') {
        let current = new Date(startDate);

        while (current.getMonth() === startDate.getMonth()) {
          dueDates.push(new Date(current));
          current.setDate(current.getDate() + 14);
        }
      }

      if (
        recurrenceType === 'WEEKLY' ||
        recurrenceType === 'BIWEEKLY'
      ) {
        for (let i = 1; i < dueDates.length; i++) {
          await tx.expense.create({
            data: {
              label: description,
              value: newValue,
              isPaid: false,
              isIncome: expense.isIncome,

              recurrenceType,
              isRecurringActive: true,

              newDueDate: dueDates[i],

              parentExpenseId: rootExpenseId,

              companyId: user.companyId,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
      }
    }

    return { expense: updatedExpense, movement: updatedMovement };
  });
}

export async function updateRecurringStatus(
  id: number,
  isRecurringActive: boolean,
  userId: number
) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new Error('Despesa não encontrada.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      company: { select: { plan: true } },
      companyId: true,
    },
  });

  if (!user) throw new Error('Usuário não encontrado.');

  if (expense.companyId !== user.companyId)
    throw new Error('Você não pode editar despesa para essa empresa.');

  const canUpdateExpense = await checkUserPermission(
    userId,
    'EXPENSE_UPDATE',
  );

  if (!canUpdateExpense)
    throw new Error('Você não tem permissão para editar despesas');

  const hasTeamDeals =
    PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;

  if (!hasTeamDeals)
    throw new Error(
      'Seu plano não possui acesso a despesas',
    );

  return await prisma.expense.update({
    where: { id },
    data: { isRecurringActive }
  })
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
  });
  if (!expense) throw new Error('Despesa não encontrada.');

  if (expense.companyId !== user.companyId) throw new Error('Você não pode apagar despesas desta empresa.');

  const canDeleteExpense = await checkUserPermission(userId, 'EXPENSE_DELETE');
  if (!canDeleteExpense) throw new Error('Você não tem permissão para apagar despesas');

  const hasTeamDeals = PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
  if (!hasTeamDeals)
    throw new Error('Seu plano não possui acesso a despesas');

  return prisma.$transaction(async (tx) => {
    const deletedExpense = await prisma.expense.delete({ where: { id } });

    let deletedMovements;
    const movement = await tx.financialMovement.findUnique({ where: { expenseId: expense.id }});
    if (movement) {
      deletedMovements = await tx.financialMovement.delete({
          where: { expenseId: expense.id }
        });
    }

    return { deletedExpense, deletedMovements };
  });
}

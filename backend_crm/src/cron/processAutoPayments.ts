import { prisma } from "../prisma-client";
import { SubscriptionPlan } from "@prisma/client";
import { PLAN_CONFIG } from "../utils/plans";

export async function processAutoPayments() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const plansWithExpenseDashboard = (
    Object.keys(PLAN_CONFIG) as SubscriptionPlan[]
  ).filter((plan) => PLAN_CONFIG[plan].features.EXPENSE_DASHBOARD);

  return prisma.$transaction(async (tx) => {
    const dueExpenses = await tx.expense.findMany({
      where: {
        isPaid: false,
        newDueDate: {
          lte: today,
        },
        financialMovements: {
          none: {},
        },
        company: {
          autoPayExpenses: true,
          isActive: true,
          plan: {
            in: plansWithExpenseDashboard,
          },
        },
      },
      select: {
        id: true,
        companyId: true,
        label: true,
        value: true,
        isIncome: true,
      },
    });

    if (!dueExpenses.length) return [];

    const updatedExpense = await tx.expense.updateMany({
      where: {
        id: {
          in: dueExpenses.map((e) => e.id),
        },
      },
      data: {
        isPaid: true,
        updatedBy: 0,
      },
    });

    const movement = await tx.financialMovement.createMany({
      data: dueExpenses.map((expense) => ({
        companyId: expense.companyId,
        type: expense.isIncome ? "INCOME" : "EXPENSE",
        description: expense.label,
        amount: expense.value,
        expenseId: expense.id,
        createdBy: 0,
        updatedBy: 0,
      })),
    });

    return { updatedExpense, movement };
  });
}

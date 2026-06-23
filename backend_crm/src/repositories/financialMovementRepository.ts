import { prisma } from "../prisma-client";
import { Prisma } from "@prisma/client";
import { checkUserPermission } from "./rolePermissionRepository";
import { PLAN_CONFIG } from "../utils/plans";

export async function getFinancialMovement(
  userId: number,
  start: string,
  end: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { company: { select: { plan: true } }, companyId: true },
  });
  if (!user) throw new Error("Empresa não encontrada");

  const canReadExpense = await checkUserPermission(userId, "EXPENSE_READ");
  if (!canReadExpense)
    throw new Error("Você não tem permissão para ler as despesas");

  const hasTeamDeals =
    PLAN_CONFIG[user.company.plan].features.EXPENSE_DASHBOARD;
  if (!hasTeamDeals) throw new Error("Seu plano não possui acesso a despesas");

  const [startYear, startMonth] = start.split("-");
  const [endYear, endMonth] = end.split("-");

  const startDate = new Date(
    Number(startYear),
    Number(startMonth) - 1,
    1,
    0,
    0,
    0,
    0,
  );

  const endDate = new Date(
    Number(endYear),
    Number(endMonth),
    0,
    23,
    59,
    59,
    999,
  );

  if (startDate > endDate)
    throw new Error("Data inicial não pode ser maior que a final");

  const financialMovements = await prisma.financialMovement.findMany({
    where: {
      companyId: user.companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      creator: { select: { name: true } },
      dealShare: {
        select: {
          deal: {
            select: {
              client: { select: { name: true } },
              id: true,
            },
          },
        },
      },
      expense: { select: { label: true, id: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const previousMovements = await prisma.financialMovement.findMany({
    where: {
      companyId: user.companyId,
      createdAt: { lt: startDate },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let initialBalance = new Prisma.Decimal(0);

  for (const movement of previousMovements) {
    if (movement.type === "INCOME" || movement.type === "COMMISSION") {
      initialBalance = initialBalance.add(movement.amount);
    } else if (movement.type === "EXPENSE") {
      initialBalance = initialBalance.sub(movement.amount);
    }
  }

  let runningBalance = initialBalance;
  const movementsWithBalance = financialMovements.map((movement) => {
    if (movement.type === "INCOME" || movement.type === "COMMISSION") {
      runningBalance = runningBalance.add(movement.amount);
    } else {
      runningBalance = runningBalance.sub(movement.amount);
    }

    return {
      ...movement,
      balanceAfter: runningBalance.toNumber(),
    };
  });

  return {
    financialMovements: movementsWithBalance,
    initialBalance: initialBalance.toNumber(),
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
  };
}

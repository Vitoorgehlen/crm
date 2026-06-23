import { prisma } from "../prisma-client";
import { PLAN_CONFIG } from "../utils/plans";
import { SubscriptionPlan } from "@prisma/client";
import { checkUserPermission } from "./rolePermissionRepository";

export async function addCompany(
  superUserId: number,
  name: string,
  expiresAt: number,
  plan: SubscriptionPlan,
  maxUsers?: number,
) {
  const isSuperUser = await prisma.superUser.findUnique({
    where: { id: superUserId },
  });

  if (!isSuperUser) {
    throw new Error("Você não tem permisão de criar uma empresa.");
  }

  const planConfig = PLAN_CONFIG[plan];
  if (!planConfig) {
    throw new Error("Plano não encontrado.");
  }

  const finalExpire = new Date();
  finalExpire.setDate(finalExpire.getDate() + expiresAt);

  const finalMaxUsers =
    maxUsers && maxUsers > 0 ? maxUsers : planConfig.limits.maxUsers;

  return prisma.company.create({
    data: {
      name: name,
      expiresAt: finalExpire,
      plan,
      maxUsers: finalMaxUsers,
      isActive: true,
    },
  });
}

export async function getMaxUsersCompany(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user?.companyId) {
    throw new Error("Empresa não encontrada.");
  }

  return prisma.company.findUnique({
    where: { id: user.companyId },
    select: {
      maxUsers: true,
      users: { select: { id: true } },
    },
  });
}

export function getCompany() {
  return prisma.company.findMany();
}

export async function getAutoPayment(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuário não encontrado.");

  const canCreateDeal = await checkUserPermission(userId, "EXPENSE_UPDATE");
  if (!canCreateDeal)
    throw new Error("Você não tem permissão para editar despesas");

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { autoPayExpenses: true },
  });

  return company?.autoPayExpenses;
}

export async function toggleAutoPayment(userId: number, autoPayment: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuário não encontrado.");

  const canCreateDeal = await checkUserPermission(userId, "EXPENSE_UPDATE");
  if (!canCreateDeal)
    throw new Error("Você não tem permissão para editar despesas");

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  });
  if (!company) throw new Error("Empresa não encontrada.");

  return prisma.company.update({
    where: { id: company.id },
    data: { autoPayExpenses: autoPayment },
  });
}

export async function updateCompany(
  superUserId: number,
  companyId: number,
  name?: string,
  expiresAt?: number,
  plan?: SubscriptionPlan,
  maxUsers?: number,
  isActive?: boolean,
) {
  const isSuperUser = await prisma.superUser.findUnique({
    where: { id: superUserId },
  });

  if (!isSuperUser) {
    throw new Error("Você não tem permissão de editar uma empresa.");
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error("Empresa não encontrada.");
  }

  let finalMaxUsers: number | null | undefined;

  if (plan) {
    const planConfig = PLAN_CONFIG[plan];

    if (!planConfig) {
      throw new Error("Plano não encontrado.");
    }

    finalMaxUsers =
      maxUsers && maxUsers > 0 ? maxUsers : planConfig.limits.maxUsers;
  }

  let finalExpire: Date | undefined;

  if (expiresAt !== undefined && expiresAt > 1) {
    const today = new Date();

    const baseDate =
      company.expiresAt && company.expiresAt > today
        ? new Date(company.expiresAt)
        : today;

    baseDate.setDate(baseDate.getDate() + expiresAt);
    finalExpire = baseDate;
  }

  return prisma.company.update({
    where: { id: companyId },
    data: {
      ...(name !== undefined && { name }),
      ...(plan !== undefined && { plan }),
      ...(finalExpire !== undefined && {
        expiresAt: finalExpire,
      }),
      ...(finalMaxUsers !== undefined && {
        maxUsers: finalMaxUsers,
      }),
      ...(typeof isActive === "boolean" && { isActive }),
    },
  });
}

export async function deleteCompany(id: number) {
  await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      where: { companyId: id },
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);

    await tx.documentationCost.deleteMany({
      where: {},
    });

    // Agora deletar a empresa (que deletará os usuários em cascade)
    await tx.company.delete({ where: { id } });
  });
}

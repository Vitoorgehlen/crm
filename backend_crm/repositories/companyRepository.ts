import { prisma } from "../prisma/client";

export async function addCompany(
  superUserId: number,
  name: string,
  maxUsers?: number,
) {
  const isSuperUser = await prisma.superUser.findUnique({
    where: { id: superUserId },
  });

  if (!isSuperUser) {
    throw new Error('Você não tem permisão de criar uma empresa.');
  }

  const DEFAULT_MAX_USERS = 2;
  const DEFAULT_ACTIVE = true;

  return prisma.company.create({
    data: {
      name: name,
      maxUsers: maxUsers ?? DEFAULT_MAX_USERS,
      isActive: DEFAULT_ACTIVE,
    },
  });
}

export async function getMaxUsersCompany(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user?.companyId) {
    throw new Error('Empresa não encontrada.');
  }

  return prisma.company.findUnique({
    where: { id: user.companyId },
    select: {
      maxUsers: true,
      users: { select: { id: true }},
    },
  });
}

export function getCompany() {
  return prisma.company.findMany();
}

export async function updateCompany(
  superUserId: number,
  companyId: number,
  name?: string,
  maxUsers?: number,
  isActive?: boolean,
) {
  const isSuperUser = await prisma.superUser.findUnique({
    where: { id: superUserId },
  });

  if (!isSuperUser) {
    throw new Error('Você não tem permisão de criar uma empresa.');
  }

  const company = await prisma.company.findUnique({ where: { id: companyId }})
  if (!company) throw new Error('Empresa não encontrada.');

  return prisma.company.update({
    where: {id: companyId },
    data: {
      name: name !== undefined ? name : company.name,
      maxUsers: maxUsers !== undefined ? maxUsers : company.maxUsers,
      isActive: isActive !== undefined ? isActive : company.isActive,
    },
  });
}

export function deleteCompany(id: number) {
  return prisma.company.delete({
      where: { id }
  });
}

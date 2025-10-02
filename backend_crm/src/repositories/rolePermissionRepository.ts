import { prisma } from "../prisma-client";
import { Permission, Prisma, UserRole } from '@prisma/client';

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
  'USER_CREATE', 'USER_UPDATE',
  'DEAL_CREATE', 'DEAL_READ', 'DEAL_UPDATE', 'DEAL_DELETE',
  'ALL_DEAL_CREATE', 'ALL_DEAL_READ', 'ALL_DEAL_UPDATE', 'ALL_DEAL_DELETE',
  'DEAL_CLOSE', 'DEAL_CLOSE_DELETE',
  'ALL_DEAL_CLOSE', 'ALL_DEAL_CLOSE_DELETE',
  'EXPENSE_CREATE', 'EXPENSE_READ', 'EXPENSE_UPDATE', 'EXPENSE_DELETE',
],
MANAGER: [
  'USER_UPDATE',
  'DEAL_CREATE', 'DEAL_READ', 'DEAL_UPDATE', 'DEAL_DELETE',
  'ALL_DEAL_CREATE', 'ALL_DEAL_READ', 'ALL_DEAL_UPDATE', 'ALL_DEAL_DELETE',
  'DEAL_CLOSE', 'DEAL_CLOSE_DELETE',
  'ALL_DEAL_CLOSE',
],
BROKER: [
  'DEAL_CREATE', 'DEAL_READ', 'DEAL_UPDATE',
  'DEAL_CLOSE',
],
ASSISTANT: [
  'DEAL_READ', 'DEAL_UPDATE', 'DEAL_DELETE',
  'ALL_DEAL_READ', 'ALL_DEAL_UPDATE', 'ALL_DEAL_DELETE',
],
SECRETARY: [
  'DEAL_READ', 'DEAL_UPDATE',
  'ALL_DEAL_READ', 'ALL_DEAL_UPDATE',
  'DEAL_CLOSE',
  'ALL_DEAL_CLOSE',
  'EXPENSE_CREATE', 'EXPENSE_READ', 'EXPENSE_UPDATE', 'EXPENSE_DELETE',
  ],
};

type PermissionUpdate = { permission: Permission; allowed: boolean };

export async function createDefaultRolePermissions(companyId: number) {
  const permissionsToCreate = Object.entries(DEFAULT_ROLE_PERMISSIONS)
    .flatMap(([role, permissions]) =>
      permissions.map(permission => ({
        companyId,
        role: role as UserRole,
        permission,
        allowed: true,
      }))
    );

  return prisma.rolePermission.createMany({
    data: permissionsToCreate,
  });
}

export async function getMyRolePermissions(
  userId: number
): Promise<Permission[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true, role: true },
  });

  if (!user) throw new Error('Empresa não encontrada.');

  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      companyId: user.companyId,
      role: user.role,
      allowed: true,
    },
    select: { permission: true },
  });

  return rolePermissions.map(rolePer => rolePer.permission);
}

export async function getRolePermissionsByCompany(
  userId: number,
  role: UserRole
) {
  if (role !== 'ADMIN') throw new Error('Você não tem permissão de editar.');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) throw new Error('Empresa não encontrada.');

  return prisma.rolePermission.findMany({
    where: { companyId: user.companyId },
  });
}

export async function checkUserPermission(
  userId: number,
  requiredPermission: Permission
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      companyId: true
    }
  });

  if (!user) throw new Error('Usuário não encontrado');

  const permission = await prisma.rolePermission.findUnique({
    where: {
      companyId_role_permission: {
        companyId: user.companyId,
        role: user.role,
        permission: requiredPermission
      }
    }
  });

  return permission?.allowed ?? false;
}

type PermissionUpdateRaw = any;

export async function updateRolePermission(
  userId: number,
  userRole: UserRole,
  role: UserRole,
  updatesRaw: PermissionUpdateRaw
) {
  if (userRole !== 'ADMIN') throw new Error("Somente administradores podem editar as regras");
  let updates: PermissionUpdate[] = [];

  if (Array.isArray(updatesRaw)) {
    updates = updatesRaw;
  } else if (updatesRaw && typeof updatesRaw === "object" && "permission" in updatesRaw) {
    updates = [updatesRaw];
  } else {
    throw new Error("Campo 'updates' precisa ser um array de { permission, allowed }.");
  }

  if (!updates.every(u => typeof u.permission === "string" && typeof u.allowed === "boolean")) {
    throw new Error("Cada item precisa de { permission: string, allowed: boolean }.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) throw new Error("Usuário não encontrado");
  const companyId = user.companyId;

  const validPermissions = new Set(Object.values(Permission));

  const cleaned: { permission: Permission; allowed: boolean }[] = updates
    .map((u) => ({ permission: u.permission as Permission, allowed: !!u.allowed }))
    .filter((u) => validPermissions.has(u.permission));

  if (cleaned.length === 0) {
    return { created: [], deleted: [], current: [] };
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.rolePermission.findMany({
      where: { companyId, role },
      select: { permission: true },
    });

    const currentSet = new Set(current.map((c) => c.permission as Permission));

    const toCreate: Prisma.RolePermissionCreateManyInput[] = [];
    const toDelete: Permission[] = [];

    cleaned.forEach((u) => {
      const perm = u.permission;
      const allowed = u.allowed;

      if (allowed && !currentSet.has(perm)) {
        toCreate.push({ companyId, role, permission: perm, allowed: true });
      }

      if (!allowed && currentSet.has(perm) && role !== "ADMIN") {
        toDelete.push(perm);
      }
    });

    if (toDelete.length > 0) {
      await tx.rolePermission.deleteMany({
        where: {
          companyId,
          role,
          permission: { in: toDelete },
        },
      });
    }

    if (toCreate.length > 0) {
      await tx.rolePermission.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    const result = await tx.rolePermission.findMany({
      where: { companyId, role },
    });

    return { created: toCreate.map(c => c.permission), deleted: toDelete, current: result };
  });
}

export async function resetRolePermissionsDefault(userId: number, role: UserRole) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  })

  if (!user) throw new Error("Usuário não encontrado");
  if (role !== "ADMIN") throw new Error("Somente administradores podem resetar permissões");

  const companyId = user.companyId;
  await prisma.rolePermission.deleteMany({
    where: { companyId },
  })

  return createDefaultRolePermissions(companyId);
}

export async function deleteRolePermissions(companyId: number) {
  return prisma.rolePermission.deleteMany({
    where: { companyId },
  });
}

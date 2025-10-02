import { prisma } from "../../prisma/client";
import { Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { isEmail } from 'validator';
import { checkUserPermission } from './rolePermissionRepository';
import { sameCompany } from '../utils/sameCompany';


export async function addUser(
  userId: number,
  userRole: UserRole,
  data: {
  email: string;
  password: string;
  name?: string;
  role: 'MANAGER' | 'BROKER' | 'ASSISTANT' | 'SECRETARY';
  amount: number;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  if (userRole !== 'ADMIN') throw new Error('Você não tem permissão de adicionar um usuário.');

  const creator = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  });

  if (!creator) throw new Error('Usuário criador não encontrado');

  const limitUsers = await prisma.company.findUnique({
    where: { id: creator.companyId },
    select: {
      maxUsers: true,
      users: true,
    },
  });

  const sumUsers = limitUsers?.users.length;
  if (sumUsers && limitUsers?.maxUsers && sumUsers >= limitUsers?.maxUsers) {
    throw new Error('O limite de usuários já foi atingido.');
  }
  if (!isEmail(data.email)) throw new Error('Email inválido.');

  return prisma.user.create({
    data: {
      companyId: creator.companyId,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name ?? null,
      role: data.role,
      supervisorId: userId,
      amount: data.amount ?? 0
      },
  });
}

export async function getUser(id: number) {
  const userCompany = await prisma.user.findUnique({
    where: { id },
    select: { companyId: true }
  })

  return prisma.user.findMany({
    where: { companyId: userCompany?.companyId },
  });
}

export async function getMe(id: number) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function updateUser(
  id: number,
  newData: Partial<Prisma.UserUpdateInput>,
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Usuário não encontrado');

  const dataToUpdate: any = { ...newData };

  if (typeof newData.password === 'string' && dataToUpdate.password.trim() !== '') {
    dataToUpdate.password = await bcrypt.hash(newData.password, 10);
  } else {
    delete dataToUpdate.password;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: dataToUpdate,
  });

  return updatedUser;
}

export async function updateTeamUser(
  userId: number,
  id: number,
  newData: Partial<Prisma.UserUpdateInput>,
) {
  const isSameCompany = sameCompany({requesterId: userId, targetId: id});
  if (!isSameCompany) throw new Error('Usuários não são da mesma empresa.' );

  const hasAccess = await checkUserPermission(userId, 'USER_UPDATE');
  if (!hasAccess) throw new Error('Você não tem permissão para editar o usuário.' );

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!user) throw new Error('Usuário não encontrado');
  if (user.role === 'ADMIN') throw new Error('Você não tem permisão de editar esse usuário');

  const dataToUpdate: any = { ...newData };

  if (typeof newData.password === 'string' && dataToUpdate.password.trim() !== '') {
    dataToUpdate.password = await bcrypt.hash(newData.password, 10);
  } else {
    delete dataToUpdate.password;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: dataToUpdate,
  });

  return updatedUser;
}

export async function deleteTeamMember(
  requesterId: number,
  requesterRole: UserRole,
  targetId: number
) {
  const isSameCompany = sameCompany({requesterId, targetId });
  if (!isSameCompany) throw new Error('Usuários não são da mesma empresa.' );

  if (requesterRole !== 'ADMIN') {
    throw new Error('Apenas administradores podem remover usuários');
  }

  return await prisma.user.delete({
    where: { id: targetId }
  });
}

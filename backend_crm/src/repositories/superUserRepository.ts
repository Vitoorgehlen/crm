import { prisma } from "../prisma-client";
import bcrypt from 'bcrypt';

export async function addUserAdmin(data: {
  companyId: number;
  email: string;
  password: string;
  name?: string;
  role: 'ADMIN' | 'MANAGER' | 'BROKER' | 'ASSISTANT' | 'SECRETARY';
  amount?: number;
  supervisorId?: number;
}) {
  return await prisma.$transaction(async (tx) => {
    const company = await tx.company.findUnique({
      where: { id: data.companyId }
    });
    if (!company) throw new Error('Empresa não encontrada');

    const userCount = await tx.user.count({
      where: { companyId: data.companyId }
    });
    if (company.maxUsers && userCount >= company.maxUsers) {
      throw new Error('Limite máximo de usuários atingidos');
    }

    return await tx.user.create({
      data: {
        companyId: data.companyId,
        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        name: data.name,
        role: data.role,
        supervisorId: data.role === 'ADMIN' ? null : data.supervisorId,
        amount: data.amount ?? 0
      }
    });
  });
}

export async function getUsersCompany(id: number) {
  return await prisma.user.findMany({
    where: { companyId: id }
  });
}


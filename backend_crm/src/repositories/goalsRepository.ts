import { Prisma } from "@prisma/client";
import { prisma } from "../prisma-client";

// Criar uma Meta
export async function addGoals(
  newData: Prisma.GoalsUncheckedCreateInput,
  userId: number
) {
  const year = new Date().getFullYear();

  return prisma.goals.create({
    data: {
      ...newData,
      userId,
      year,
    },
  });
}

// Pega as Metas
export function getGoals(userId: number) {
  return prisma.goals.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
  });
}

// Atualizar as Metas
export async function updateGoals(
  id: number,
  newData: Partial<Prisma.GoalsUncheckedUpdateInput>,
  userId: number,
) {
  return prisma.$transaction(async (tx) => {
    const goals = await tx.goals.findUnique({ where: { id } });
    if (!goals) throw new Error('Meta não encontrada.');

    if (goals.userId !== userId) throw new Error('Você não pode editar essa Meta.');

    return await tx.goals.update({
      where: { id },
      data: {
        ...newData,
      },
    });
  });
}

// apagar as Metas
export async function deleteGoals(
  id: number,
  userId: number
 ) {
  return prisma.$transaction(async (tx) => {
    const goals = await tx.goals.findUnique({ where: { id } });
    if (!goals) throw new Error('Meta não encontrada.');

    if (goals.userId !== userId) throw new Error('Você não pode apagar essa Tarefa.');

    return await tx.goals.delete({ where: { id } });
  });
}

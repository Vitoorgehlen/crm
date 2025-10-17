import { Prisma } from "@prisma/client";
import { prisma } from "../prisma-client";

// Criar uma tarefa
export async function addTasks(
  newData: Prisma.TasksUncheckedCreateInput,
  userId: number
) {
  return prisma.tasks.create({
    data: {
      ...newData,
      priority: newData.priority ?? 'NORMAL',
      isFinish: false,
      createdBy: userId,
    },
  });
}

// Pega as Tarefas
export function getTasks(userId: number) {
  return prisma.tasks.findMany({
    where: { createdBy: userId },
    orderBy: { id: 'desc' },
  });
}

// Atualizar as Tarefas
export async function updateTasks(
  id: number,
  newData: Partial<Prisma.TasksUncheckedUpdateInput>,
  userId: number,
) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.tasks.findUnique({ where: { id } });
    if (!task) throw new Error('Tarefa não encontrada.');

    if (task.createdBy !== userId) throw new Error('Você não pode editar essa Tarefa.');

    return await tx.tasks.update({
      where: { id },
      data: {
        ...newData,
      },
    });
  });
}

// apagar as Tarefas
export async function deleteTasks(
  id: number,
  userId: number
 ) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.tasks.findUnique({ where: { id } });
    if (!task) throw new Error('Tarefa não encontrada.');

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Tarefa não encontrada.');

    if (task.createdBy !== user.id) throw new Error('Você não pode apagar essa Tarefa.');

    return await tx.tasks.delete({ where: { id } });
  });
}

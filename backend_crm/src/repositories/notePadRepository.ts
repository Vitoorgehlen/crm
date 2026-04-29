import { prisma } from "../prisma-client";

// Cria/Edita nota Global
export async function addNotePadGlobal(content: string, slot: number | undefined) {
  return prisma.$transaction(async (tx) => {
    if (slot !== undefined) {
      return tx.notePad.updateMany({
        where: {
          slot,
          userId: null,
        },
        data: {
          content,
        },
      });
    }

    const last = await tx.notePad.findFirst({
      where: { userId: null },
      orderBy: { slot: 'desc' },
    });

    const nextSlot = (last?.slot ?? -1) + 1;

    return tx.notePad.create({
      data: {
        content,
        slot: nextSlot,
        userId: null,
      },
    });
  });
}

// Cria/Edita nota
export async function addNotePad(content: string, userId: number) {
  return prisma.notePad.upsert({
    where: { userId },
    create: {
      userId,
      content,
      slot: 0,
    },
    update: {
      content,
    },
  });
}

// Pega as notas Globais
export function getNotePadGlobal() {
  return prisma.notePad.findMany({ where: { userId: null } });
}

// Pega as notas
export function getNotePad(userId: number) {
  return prisma.$transaction(async (tx) => {
    const globals  = await tx.notePad.findMany({ where: { userId: null } });
    const userNote = await tx.notePad.findFirst({ where: { userId } });
    if (!userNote) return globals;

    return [userNote, ...globals.slice(1)];
  });
}

// apagar nota global
export async function deleteNotePadGlobal(slot: number) {
  return prisma.notePad.deleteMany({
    where: {
      slot,
      userId: null,
    },
  });
}

import { prisma } from "../prisma-client";

interface SameCompanyParams {
  requesterId: number;
  targetId: number;
}

export async function sameCompany({
  requesterId,
  targetId
}: SameCompanyParams): Promise<{
  isSameCompany: boolean;
  requesterCompanyId?: number;
  targetCompanyId?: number;
  error?: string;
}> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const [requester, target] = await Promise.all([
        tx.user.findUnique({
          where: { id: requesterId },
          select: { companyId: true }
        }),
        tx.user.findUnique({
          where: { id: targetId },
          select: { companyId: true }
        })
      ]);

      if (!requester) {
        throw new Error('Usuário solicitante não encontrado');
      }

      if (!target) {
        throw new Error('Usuário alvo não encontrado');
      }

      return {
        isSameCompany: requester.companyId === target.companyId,
        requesterCompanyId: requester.companyId,
        targetCompanyId: target.companyId
      };
    });

    return result;
  } catch (error) {
    return {
      isSameCompany: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

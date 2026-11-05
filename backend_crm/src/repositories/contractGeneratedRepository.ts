import { prisma } from "../prisma-client";
import { Prisma } from "@prisma/client";
import type {
  ContractPersonType,
  GeneratedContractStatus,
} from "@prisma/client";
import { checkUserPermission } from "./rolePermissionRepository";

export class GeneratedContractError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "GeneratedContractError";
  }
}

export type AddGeneratedContractData = {
  templateId: number;
  dealId?: number | null;
  name: string;
  content: Prisma.InputJsonValue;
  sellerType?: ContractPersonType;
  buyerType?: ContractPersonType;
  status?: GeneratedContractStatus;
};

export type UpdateGeneratedContractData = {
  templateId?: number | null;
  dealId?: number | null;
  name?: string;
  content?: Prisma.InputJsonValue;
  sellerType?: ContractPersonType;
  buyerType?: ContractPersonType;
  status?: GeneratedContractStatus;
};

// =====================================================
// CREATE GENERATED CONTRACT
// =====================================================

export async function addGeneratedContract(
  data: AddGeneratedContractData,
  userId: number,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) {
    throw new GeneratedContractError(404, "Usuário não encontrado.");
  }

  const canCreate = await checkUserPermission(userId, "CONTRACT_CREATE");

  if (!canCreate) {
    throw new GeneratedContractError(
      403,
      "Você não tem permissão para criar contratos.",
    );
  }

  if (typeof data.name !== "string" || !data.name.trim()) {
    throw new GeneratedContractError(400, "Informe o nome do contrato.");
  }

  if (
    !data.content ||
    typeof data.content !== "object" ||
    Array.isArray(data.content)
  ) {
    throw new GeneratedContractError(400, "O conteúdo do contrato é inválido.");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Busca o modelo e suas variáveis
    const template = await tx.contractTemplate.findFirst({
      where: {
        id: data.templateId,
        companyId: user.companyId,
      },
      select: {
        id: true,
        variables: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!template) {
      throw new GeneratedContractError(
        404,
        "Modelo de contrato não encontrado.",
      );
    }

    // 2. Valida o negócio, caso exista
    if (data.dealId != null) {
      const deal = await tx.deal.findFirst({
        where: {
          id: data.dealId,
          companyId: user.companyId,
        },
        select: {
          id: true,
        },
      });

      if (!deal) {
        throw new GeneratedContractError(404, "Negócio não encontrado.");
      }
    }

    // 3. Define o status inicial
    const status = data.status ?? "DRAFT";
    const now = new Date();

    // 4. Cria o contrato e herda somente as variáveis do modelo
    const generated = await tx.generatedContract.create({
      data: {
        name: data.name.trim(),
        content: data.content,

        sellerType: data.sellerType ?? "SINGULAR_M",
        buyerType: data.buyerType ?? "SINGULAR_M",
        status,

        finalizedAt: status === "FINALIZED" || status === "SIGNED" ? now : null,

        signedAt: status === "SIGNED" ? now : null,

        company: {
          connect: { id: user.companyId },
        },

        template: {
          connect: { id: template.id },
        },

        ...(data.dealId != null
          ? {
              deal: {
                connect: { id: data.dealId },
              },
            }
          : {}),

        creator: {
          connect: { id: userId },
        },

        updater: {
          connect: { id: userId },
        },

        variables: {
          connect: template.variables.map((variable) => ({
            id: variable.id,
          })),
        },
      },

      include: {
        creator: {
          select: { name: true },
        },
        updater: {
          select: { name: true },
        },
        variables: true,
      },
    });

    return generated;
  });
}

// =====================================================
// GET GENERATED CONTRACTS
// =====================================================

export async function getGeneratedContract(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) {
    throw new GeneratedContractError(404, "Usuário não encontrado.");
  }

  const canRead = await checkUserPermission(userId, "CONTRACT_READ");

  if (!canRead) {
    throw new GeneratedContractError(
      403,
      "Você não tem permissão para visualizar contratos.",
    );
  }

  return prisma.generatedContract.findMany({
    where: {
      companyId: user.companyId,
    },

    include: {
      creator: {
        select: { name: true },
      },
      updater: {
        select: { name: true },
      },

      variables: true,

      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },

    orderBy: {
      updatedAt: "desc",
    },
  });
}

// =====================================================
// UPDATE GENERATED CONTRACT
// =====================================================

export async function updateGeneratedContract(
  id: number,
  data: UpdateGeneratedContractData,
  userId: number,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) {
    throw new GeneratedContractError(404, "Usuário não encontrado.");
  }

  const canUpdate = await checkUserPermission(userId, "CONTRACT_UPDATE");

  if (!canUpdate) {
    throw new GeneratedContractError(
      403,
      "Você não tem permissão para editar contratos.",
    );
  }

  return prisma.$transaction(async (tx) => {
    // 1. Busca o contrato pertencente à empresa
    const contract = await tx.generatedContract.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      select: {
        id: true,
        companyId: true,
        templateId: true,
        finalizedAt: true,
        signedAt: true,
        status: true,
      },
    });

    if (!contract) {
      throw new GeneratedContractError(404, "Contrato não encontrado.");
    }

    // 2. Impede a troca do modelo de origem
    if (
      data.templateId !== undefined &&
      data.templateId !== contract.templateId
    ) {
      throw new GeneratedContractError(
        400,
        "Não é permitido alterar o modelo de origem do contrato.",
      );
    }

    // 3. Valida nome, quando informado
    if (
      data.name !== undefined &&
      (typeof data.name !== "string" || !data.name.trim())
    ) {
      throw new GeneratedContractError(
        400,
        "Informe um nome válido para o contrato.",
      );
    }

    // 4. Valida conteúdo, quando informado
    if (
      data.content !== undefined &&
      (!data.content ||
        typeof data.content !== "object" ||
        Array.isArray(data.content))
    ) {
      throw new GeneratedContractError(
        400,
        "O conteúdo do contrato é inválido.",
      );
    }

    // 5. Valida o negócio, caso tenha sido informado
    if (data.dealId !== undefined && data.dealId !== null) {
      const deal = await tx.deal.findFirst({
        where: {
          id: data.dealId,
          companyId: user.companyId,
        },
        select: {
          id: true,
        },
      });

      if (!deal) {
        throw new GeneratedContractError(404, "Negócio não encontrado.");
      }
    }

    // 6. Preserva as datas conforme o status
    const nextStatus = data.status ?? contract.status;
    const now = new Date();

    const finalizedAt =
      nextStatus === "FINALIZED" || nextStatus === "SIGNED"
        ? (contract.finalizedAt ?? now)
        : null;

    const signedAt =
      nextStatus === "SIGNED" ? (contract.signedAt ?? now) : null;

    // 7. Monta somente os campos permitidos
    const updateData: Prisma.GeneratedContractUpdateInput = {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),

      ...(data.content !== undefined ? { content: data.content } : {}),

      ...(data.sellerType !== undefined ? { sellerType: data.sellerType } : {}),

      ...(data.buyerType !== undefined ? { buyerType: data.buyerType } : {}),

      ...(data.status !== undefined ? { status: data.status } : {}),

      ...(data.dealId !== undefined
        ? data.dealId === null
          ? { deal: { disconnect: true } }
          : { deal: { connect: { id: data.dealId } } }
        : {}),

      finalizedAt,
      signedAt,

      updater: {
        connect: { id: userId },
      },
    };

    // 8. Atualiza o contrato sem alterar suas variáveis
    return tx.generatedContract.update({
      where: {
        id: contract.id,
      },
      data: updateData,

      include: {
        creator: {
          select: { name: true },
        },
        updater: {
          select: { name: true },
        },
        variables: true,
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  });
}

// =====================================================
// DELETE GENERATED CONTRACT
// =====================================================

export async function deleteGeneratedContract(id: number, userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) {
    throw new GeneratedContractError(404, "Usuário não encontrado.");
  }

  const canDelete = await checkUserPermission(userId, "CONTRACT_DELETE");

  if (!canDelete) {
    throw new GeneratedContractError(
      403,
      "Você não tem permissão para excluir contratos.",
    );
  }

  return prisma.$transaction(async (tx) => {
    // 1. Busca o contrato e suas variáveis
    const contract = await tx.generatedContract.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      select: {
        id: true,
        variables: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!contract) {
      throw new GeneratedContractError(404, "Contrato não encontrado.");
    }

    // 2. Guarda os IDs antes da exclusão
    const variableIds = contract.variables.map((variable) => variable.id);

    // 3. Exclui o contrato e seus relacionamentos N:N
    const deletedContract = await tx.generatedContract.delete({
      where: {
        id: contract.id,
      },
    });

    // 4. Remove somente as variáveis que não são mais utilizadas
    if (variableIds.length > 0) {
      await tx.contractVariable.deleteMany({
        where: {
          id: {
            in: variableIds,
          },

          companyId: user.companyId,

          templates: {
            none: {},
          },

          generatedContracts: {
            none: {},
          },
        },
      });
    }

    return deletedContract;
  });
}

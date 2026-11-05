import { prisma } from "../prisma-client";
import { Prisma } from "@prisma/client";
import { checkUserPermission } from "./rolePermissionRepository";

export class ContractTemplateError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ContractTemplateError";
  }
}

type AddContractTemplateData = {
  name: string;
  content: Prisma.InputJsonValue;
};

type UpdateContractTemplateData = {
  name?: string;
  content?: Prisma.InputJsonValue;
};

// =====================================================
// CREATE CONTRACT TEMPLATE
// =====================================================

export async function addContractTemplate(
  data: AddContractTemplateData,
  userId: number,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) {
    throw new ContractTemplateError(404, "Usuário não encontrado.");
  }

  const canCreate = await checkUserPermission(userId, "CONTRACT_CREATE");

  if (!canCreate) {
    throw new ContractTemplateError(
      403,
      "Você não tem permissão para criar contratos.",
    );
  }

  const createData: Prisma.ContractTemplateCreateInput = {
    name: data.name.trim(),
    content: data.content,

    company: {
      connect: { id: user.companyId },
    },

    creator: {
      connect: { id: userId },
    },

    updater: {
      connect: { id: userId },
    },
  };

  return prisma.contractTemplate.create({
    data: createData,
  });
}

// =====================================================
// GET CONTRACT TEMPLATES
// =====================================================

export async function getContractTemplate(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) {
    throw new ContractTemplateError(404, "Usuário não encontrado.");
  }

  const canRead = await checkUserPermission(userId, "CONTRACT_READ");

  if (!canRead) {
    throw new ContractTemplateError(
      403,
      "Você não tem permissão para visualizar contratos.",
    );
  }

  return prisma.contractTemplate.findMany({
    where: {
      companyId: user.companyId,
    },
    include: {
      creator: {
        select: {
          name: true,
        },
      },
      updater: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// =====================================================
// UPDATE CONTRACT TEMPLATE
// =====================================================

export async function updateContractTemplate(
  id: number,
  data: UpdateContractTemplateData,
  userId: number,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) {
    throw new ContractTemplateError(404, "Usuário não encontrado.");
  }

  const canUpdate = await checkUserPermission(userId, "CONTRACT_UPDATE");

  if (!canUpdate) {
    throw new ContractTemplateError(
      403,
      "Você não tem permissão para editar contratos.",
    );
  }

  const contract = await prisma.contractTemplate.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
    select: {
      id: true,
    },
  });

  if (!contract) {
    throw new ContractTemplateError(404, "Modelo de contrato não encontrado.");
  }

  const updateData: Prisma.ContractTemplateUpdateInput = {
    ...(data.name !== undefined ? { name: data.name.trim() } : {}),

    ...(data.content !== undefined ? { content: data.content } : {}),

    updater: {
      connect: { id: userId },
    },
  };

  if (data.name === undefined && data.content === undefined) {
    throw new ContractTemplateError(400, "Nenhum campo válido foi informado.");
  }

  return prisma.contractTemplate.update({
    where: {
      id,
    },
    data: updateData,
  });
}

// =====================================================
// DELETE CONTRACT TEMPLATE
// =====================================================

export async function deleteContractTemplate(id: number, userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) {
    throw new ContractTemplateError(404, "Usuário não encontrado.");
  }

  const canDelete = await checkUserPermission(userId, "CONTRACT_DELETE");

  if (!canDelete) {
    throw new ContractTemplateError(
      403,
      "Você não tem permissão para excluir contratos.",
    );
  }

  return prisma.$transaction(async (tx) => {
    // 1. Busca o modelo e suas variáveis antes da exclusão
    const contract = await tx.contractTemplate.findFirst({
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
      throw new ContractTemplateError(
        404,
        "Modelo de contrato não encontrado.",
      );
    }

    // 2. Guarda os IDs das variáveis vinculadas
    const variableIds = contract.variables.map((variable) => variable.id);

    // 3. Exclui o modelo
    const deletedContract = await tx.contractTemplate.delete({
      where: {
        id: contract.id,
      },
    });

    // 4. Exclui somente as variáveis que ficaram órfãs
    if (variableIds.length > 0) {
      await tx.contractVariable.deleteMany({
        where: {
          id: {
            in: variableIds,
          },

          companyId: user.companyId,

          // Não pode estar em outro modelo
          templates: {
            none: {},
          },

          // Não pode estar em nenhum contrato gerado
          generatedContracts: {
            none: {},
          },
        },
      });
    }

    return deletedContract;
  });
}

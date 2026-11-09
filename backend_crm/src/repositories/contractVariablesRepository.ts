import { prisma } from "../prisma-client";
import { Prisma } from "@prisma/client";
import type { ContractVariableType } from "@prisma/client";
import { checkUserPermission } from "./rolePermissionRepository";

export class ContractVariableError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ContractVariableError";
  }
}

export type AddVariableData = {
  label: string;
  variableType: ContractVariableType;
  options: Prisma.InputJsonValue;
  content?: Prisma.InputJsonValue;
} & (
  | {
      templateId: number;
      generatedContractId?: never;
    }
  | {
      templateId?: never;
      generatedContractId: number;
    }
);

export type UpdateVariableData = {
  label?: string;
  variableType?: ContractVariableType;
  options?: Prisma.InputJsonValue;
  content?: Prisma.InputJsonValue | null;
};

type VariableContext = {
  templateId?: number;
  generatedContractId?: number;
};

export function isConditionalContent(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const content = value as Record<string, unknown>;

  return (
    Array.isArray(content.content) &&
    typeof content.openStart === "number" &&
    typeof content.openEnd === "number"
  );
}

async function getCompanyId(userId: number): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user) {
    throw new ContractVariableError(404, "Usuário não encontrado.");
  }

  return user.companyId;
}

export async function addVariables(data: AddVariableData, userId: number) {
  const companyId = await getCompanyId(userId);

  const canCreate = await checkUserPermission(userId, "CONTRACT_CREATE");

  if (!canCreate) {
    throw new ContractVariableError(
      403,
      "Você não tem permissão para criar variáveis.",
    );
  }

  if (
    data.variableType === "conditional" &&
    !isConditionalContent(data.content)
  ) {
    throw new ContractVariableError(
      400,
      "O conteúdo da variável condicional é inválido.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const commonData = {
      label: data.label.trim(),
      variableType: data.variableType,
      options: data.options,
      ...(data.content !== undefined ? { content: data.content } : {}),
      company: {
        connect: { id: companyId },
      },
    };

    if (data.templateId !== undefined) {
      const template = await tx.contractTemplate.findFirst({
        where: {
          id: data.templateId,
          companyId,
        },
        select: { id: true },
      });

      if (!template) {
        throw new ContractVariableError(
          404,
          "Modelo de contrato não encontrado.",
        );
      }

      const createData: Prisma.ContractVariableCreateInput = {
        ...commonData,
        templates: {
          connect: { id: template.id },
        },
      };

      return tx.contractVariable.create({
        data: createData,
      });
    }

    const contract = await tx.generatedContract.findFirst({
      where: {
        id: data.generatedContractId,
        companyId,
      },
      select: { id: true },
    });

    if (!contract) {
      throw new ContractVariableError(404, "Contrato gerado não encontrado.");
    }

    const createData: Prisma.ContractVariableCreateInput = {
      ...commonData,
      generatedContracts: {
        connect: { id: contract.id },
      },
    };

    return tx.contractVariable.create({
      data: createData,
    });
  });
}

export async function getVariables(
  userId: number,
  context: VariableContext = {},
) {
  const companyId = await getCompanyId(userId);

  const canRead = await checkUserPermission(userId, "CONTRACT_READ");

  if (!canRead) {
    throw new ContractVariableError(
      403,
      "Você não tem permissão para visualizar variáveis.",
    );
  }

  const { templateId, generatedContractId } = context;

  if (templateId !== undefined && generatedContractId !== undefined) {
    throw new ContractVariableError(
      400,
      "Informe somente um contexto de busca.",
    );
  }

  // Sempre busca todas as variáveis party da empresa.
  const partyVariables = {
    companyId,
    variableType: "party" as const,
  };

  // Sem contexto, retorna todas as variáveis party.
  if (templateId === undefined && generatedContractId === undefined) {
    return prisma.contractVariable.findMany({
      where: partyVariables,
      orderBy: { id: "asc" },
    });
  }

  // Consulta por modelo.
  if (templateId !== undefined) {
    const template = await prisma.contractTemplate.findFirst({
      where: {
        id: templateId,
        companyId,
      },
      select: { id: true },
    });

    if (!template) {
      throw new ContractVariableError(
        404,
        "Modelo de contrato não encontrado.",
      );
    }

    return prisma.contractVariable.findMany({
      where: {
        companyId,
        OR: [
          partyVariables,
          {
            variableType: "conditional",
            templates: {
              some: { id: templateId },
            },
          },
        ],
      },
      orderBy: { id: "asc" },
    });
  }

  // Consulta por contrato gerado.
  const contract = await prisma.generatedContract.findFirst({
    where: {
      id: generatedContractId,
      companyId,
    },
    select: {
      id: true,
    },
  });

  if (!contract) {
    throw new ContractVariableError(404, "Contrato gerado não encontrado.");
  }

  return prisma.contractVariable.findMany({
    where: {
      companyId,
      OR: [
        partyVariables,
        {
          variableType: "conditional",
          generatedContracts: {
            some: { id: generatedContractId },
          },
        },
      ],
    },
    orderBy: { id: "asc" },
  });
}

export async function updateVariables(
  id: number,
  data: UpdateVariableData,
  userId: number,
) {
  const companyId = await getCompanyId(userId);

  const canUpdate = await checkUserPermission(userId, "CONTRACT_UPDATE");

  if (!canUpdate) {
    throw new ContractVariableError(
      403,
      "Você não tem permissão para editar variáveis.",
    );
  }

  const variable = await prisma.contractVariable.findFirst({
    where: {
      id,
      companyId,
    },
    select: {
      id: true,
      variableType: true,
      content: true,
    },
  });

  if (!variable) {
    throw new ContractVariableError(404, "Variável não encontrada.");
  }

  const nextType = data.variableType ?? variable.variableType;

  const nextContent =
    data.content === undefined ? variable.content : data.content;

  if (nextType === "conditional" && !isConditionalContent(nextContent)) {
    throw new ContractVariableError(
      400,
      "O conteúdo da variável condicional é inválido.",
    );
  }

  const updateData: Prisma.ContractVariableUpdateInput = {
    ...(data.label !== undefined ? { label: data.label.trim() } : {}),

    ...(data.variableType !== undefined
      ? { variableType: data.variableType }
      : {}),

    ...(data.options !== undefined ? { options: data.options } : {}),

    ...(data.content !== undefined
      ? {
          content: data.content === null ? Prisma.DbNull : data.content,
        }
      : {}),
  };

  if (Object.keys(updateData).length === 0) {
    throw new ContractVariableError(400, "Nenhum campo válido foi informado.");
  }

  return prisma.contractVariable.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteVariable(
  id: number,
  userId: number,
  context: VariableContext = {},
) {
  const companyId = await getCompanyId(userId);

  const canDelete = await checkUserPermission(userId, "CONTRACT_DELETE");

  if (!canDelete) {
    throw new ContractVariableError(
      403,
      "Você não tem permissão para excluir variáveis.",
    );
  }

  const { templateId, generatedContractId } = context;

  if (templateId !== undefined && generatedContractId !== undefined) {
    throw new ContractVariableError(
      400,
      "Informe somente um contexto para remover a variável.",
    );
  }

  if (templateId === undefined && generatedContractId === undefined) {
    throw new ContractVariableError(
      400,
      "Informe o modelo ou contrato de onde deseja remover a variável.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const variable = await tx.contractVariable.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!variable) {
      throw new ContractVariableError(404, "Variável não encontrada.");
    }

    // Remoção de variável vinculada a um modelo.
    if (templateId !== undefined) {
      const template = await tx.contractTemplate.findFirst({
        where: {
          id: templateId,
          companyId,
        },
        select: { id: true },
      });

      if (!template) {
        throw new ContractVariableError(
          404,
          "Modelo de contrato não encontrado.",
        );
      }

      const linkedVariable = await tx.contractVariable.findFirst({
        where: {
          id,
          companyId,
          templates: {
            some: { id: templateId },
          },
        },
        select: { id: true },
      });

      // Variáveis condicionais precisam estar vinculadas ao modelo.
      // Variáveis party podem ser compartilhadas pela empresa.
      if (!linkedVariable && variable.variableType === "conditional") {
        throw new ContractVariableError(
          404,
          "Variável não encontrada neste modelo.",
        );
      }

      // Desconecta somente quando existe vínculo.
      if (linkedVariable) {
        await tx.contractVariable.update({
          where: { id },
          data: {
            templates: {
              disconnect: { id: templateId },
            },
          },
        });
      }
    }

    // Remoção de variável vinculada a um contrato gerado.
    if (generatedContractId !== undefined) {
      const contract = await tx.generatedContract.findFirst({
        where: {
          id: generatedContractId,
          companyId,
        },
        select: { id: true },
      });

      if (!contract) {
        throw new ContractVariableError(404, "Contrato gerado não encontrado.");
      }

      const linkedVariable = await tx.contractVariable.findFirst({
        where: {
          id,
          companyId,
          generatedContracts: {
            some: { id: generatedContractId },
          },
        },
        select: { id: true },
      });

      // Variáveis condicionais precisam estar vinculadas ao contrato.
      // Variáveis party podem ser compartilhadas pela empresa.
      if (!linkedVariable && variable.variableType === "conditional") {
        throw new ContractVariableError(
          404,
          "Variável não encontrada neste contrato.",
        );
      }

      // Desconecta somente quando existe vínculo.
      if (linkedVariable) {
        await tx.contractVariable.update({
          where: { id },
          data: {
            generatedContracts: {
              disconnect: { id: generatedContractId },
            },
          },
        });
      }
    }

    // Exclui o registro somente se não houver mais vínculos.
    await deleteOrphanVariables(tx, [id], companyId);

    return variable;
  });
}

export async function deleteOrphanVariables(
  tx: Prisma.TransactionClient,
  variableIds: number[],
  companyId: number,
) {
  if (variableIds.length === 0) return;

  return tx.contractVariable.deleteMany({
    where: {
      id: {
        in: variableIds,
      },
      companyId,
      templates: {
        none: {},
      },
      generatedContracts: {
        none: {},
      },
    },
  });
}

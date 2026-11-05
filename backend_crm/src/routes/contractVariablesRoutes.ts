import { Router, Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/express";
import loginRequired from "../middlewares/loginRequired";

import {
  addVariables,
  deleteVariable,
  getVariables,
  updateVariables,
  isConditionalContent,
  ContractVariableError,
} from "../repositories/contractVariablesRepository";

import type { UpdateVariableData } from "../repositories/contractVariablesRepository";

const router = Router();

function parseOptionalId(value: unknown): number | undefined | null {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function handleError(res: Response, error: unknown, fallback: string) {
  console.error(error);

  if (error instanceof ContractVariableError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  return res.status(500).json({
    error: fallback,
  });
}

router.post(
  "/variables",
  loginRequired,
  async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const userId = user?.id;

    if (!userId) {
      return res.status(400).json({
        error: "Usuário inválido.",
      });
    }

    const body = req.body ?? {};

    const { label, variableType, options, content } = body;

    const templateId = parseOptionalId(body.templateId);
    const generatedContractId = parseOptionalId(body.generatedContractId);

    if (templateId === null || generatedContractId === null) {
      return res.status(400).json({
        error: "ID de modelo ou contrato inválido.",
      });
    }

    if (templateId === undefined && generatedContractId === undefined) {
      return res.status(400).json({
        error: "Informe o templateId ou generatedContractId.",
      });
    }

    if (templateId !== undefined && generatedContractId !== undefined) {
      return res.status(400).json({
        error: "Informe somente o templateId ou generatedContractId.",
      });
    }

    if (typeof label !== "string" || !label.trim()) {
      return res.status(400).json({
        error: "Informe o nome da variável.",
      });
    }

    if (variableType !== "party" && variableType !== "conditional") {
      return res.status(400).json({
        error: "Tipo de variável inválido.",
      });
    }

    if (!Array.isArray(options)) {
      return res.status(400).json({
        error: "As opções devem ser uma lista.",
      });
    }

    if (!options.every((option: unknown) => typeof option === "string")) {
      return res.status(400).json({
        error: "Todas as opções devem ser textos.",
      });
    }

    if (variableType === "conditional" && !isConditionalContent(content)) {
      return res.status(400).json({
        error: "O conteúdo da variável condicional é inválido.",
      });
    }

    try {
      const owner =
        templateId !== undefined
          ? { templateId }
          : { generatedContractId: generatedContractId! };

      const newVariable = await addVariables(
        {
          label: label.trim(),
          variableType,
          options,
          ...(variableType === "conditional" ? { content } : {}),
          ...owner,
        },
        userId,
      );

      return res.status(201).json(newVariable);
    } catch (error) {
      return handleError(res, error, "Erro ao criar variável.");
    }
  },
);

router.get("/variables", loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const userId = user?.id;

  if (!userId) {
    return res.status(400).json({
      error: "Usuário inválido.",
    });
  }

  const templateId = parseOptionalId(req.query.templateId);

  const generatedContractId = parseOptionalId(req.query.generatedContractId);

  if (templateId === null || generatedContractId === null) {
    return res.status(400).json({
      error: "ID inválido.",
    });
  }

  if (templateId !== undefined && generatedContractId !== undefined) {
    return res.status(400).json({
      error: "Informe somente um contexto de consulta.",
    });
  }

  try {
    const variables = await getVariables(userId, {
      ...(templateId !== undefined ? { templateId } : {}),
      ...(generatedContractId !== undefined ? { generatedContractId } : {}),
    });

    return res.status(200).json(variables);
  } catch (error) {
    return handleError(res, error, "Erro ao buscar variáveis.");
  }
});

router.put(
  "/variables/:id",
  loginRequired,
  async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const userId = user?.id;

    if (!userId) {
      return res.status(400).json({
        error: "Usuário inválido.",
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "ID inválido.",
      });
    }

    const body = req.body ?? {};

    const updatedData: UpdateVariableData = {};

    if (body.label !== undefined) {
      if (typeof body.label !== "string" || !body.label.trim()) {
        return res.status(400).json({
          error: "Nome da variável inválido.",
        });
      }

      updatedData.label = body.label.trim();
    }

    if (body.variableType !== undefined) {
      if (
        body.variableType !== "party" &&
        body.variableType !== "conditional"
      ) {
        return res.status(400).json({
          error: "Tipo de variável inválido.",
        });
      }

      updatedData.variableType = body.variableType;
    }

    if (body.options !== undefined) {
      if (
        !Array.isArray(body.options) ||
        !body.options.every((option: unknown) => typeof option === "string")
      ) {
        return res.status(400).json({
          error: "Lista de opções inválida.",
        });
      }

      updatedData.options = body.options;
    }

    if (body.content !== undefined) {
      if (body.content !== null && !isConditionalContent(body.content)) {
        return res.status(400).json({
          error: "Conteúdo da variável inválido.",
        });
      }

      updatedData.content = body.content;
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        error: "Nenhum campo válido foi informado.",
      });
    }

    try {
      const updatedVariable = await updateVariables(id, updatedData, userId);

      return res.status(200).json(updatedVariable);
    } catch (error) {
      return handleError(res, error, "Erro ao atualizar variável.");
    }
  },
);

router.delete(
  "/variables/:id",
  loginRequired,
  async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const userId = user?.id;

    if (!userId) {
      return res.status(400).json({
        error: "Usuário inválido.",
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "ID inválido.",
      });
    }

    const templateId = parseOptionalId(req.query.templateId);
    const generatedContractId = parseOptionalId(req.query.generatedContractId);

    if (templateId === null || generatedContractId === null) {
      return res.status(400).json({
        error: "ID de modelo ou contrato inválido.",
      });
    }

    if (templateId !== undefined && generatedContractId !== undefined) {
      return res.status(400).json({
        error: "Informe somente um contexto de exclusão.",
      });
    }

    try {
      const deletedVariable = await deleteVariable(id, userId, {
        ...(templateId !== undefined ? { templateId } : {}),
        ...(generatedContractId !== undefined ? { generatedContractId } : {}),
      });

      return res.status(200).json(deletedVariable);
    } catch (error) {
      return handleError(res, error, "Erro ao excluir variável.");
    }
  },
);

export default router;

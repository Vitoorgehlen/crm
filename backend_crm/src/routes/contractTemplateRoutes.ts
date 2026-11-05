import { Router, Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/express";
import loginRequired from "../middlewares/loginRequired";

import {
  addContractTemplate,
  deleteContractTemplate,
  getContractTemplate,
  updateContractTemplate,
  ContractTemplateError,
} from "../repositories/contractTemplateRepository";

const router = Router();

function handleError(res: Response, error: unknown, fallback: string) {
  console.error(error);

  if (error instanceof ContractTemplateError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  return res.status(500).json({
    error: fallback,
  });
}

function isValidContent(value: unknown): boolean {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// =====================================================
// CREATE
// =====================================================

router.post(
  "/contractTemplate",
  loginRequired,
  async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const userId = user?.id;

    if (!userId) {
      return res.status(400).json({
        error: "Usuário inválido.",
      });
    }

    const { name, content } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        error: "Informe o nome do contrato.",
      });
    }

    if (!isValidContent(content)) {
      return res.status(400).json({
        error: "O conteúdo do contrato é inválido.",
      });
    }

    try {
      const newContract = await addContractTemplate(
        {
          name: name.trim(),
          content,
        },
        userId,
      );

      return res.status(201).json(newContract);
    } catch (error) {
      return handleError(res, error, "Erro ao criar o contrato.");
    }
  },
);

// =====================================================
// GET
// =====================================================

router.get(
  "/contractTemplate",
  loginRequired,
  async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const userId = user?.id;

    if (!userId) {
      return res.status(400).json({
        error: "Usuário inválido.",
      });
    }

    try {
      const contracts = await getContractTemplate(userId);

      return res.status(200).json(contracts);
    } catch (error) {
      return handleError(res, error, "Erro ao buscar contratos.");
    }
  },
);

// =====================================================
// UPDATE
// =====================================================

router.put(
  "/contractTemplate/:id",
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

    const { name, content } = req.body ?? {};

    if (name === undefined && content === undefined) {
      return res.status(400).json({
        error: "Nenhum campo foi informado.",
      });
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({
        error: "Nome do contrato inválido.",
      });
    }

    if (content !== undefined && !isValidContent(content)) {
      return res.status(400).json({
        error: "O conteúdo do contrato é inválido.",
      });
    }

    try {
      const updatedContract = await updateContractTemplate(
        id,
        {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(content !== undefined ? { content } : {}),
        },
        userId,
      );

      return res.status(200).json(updatedContract);
    } catch (error) {
      return handleError(res, error, "Erro ao atualizar o contrato.");
    }
  },
);

// =====================================================
// DELETE
// =====================================================

router.delete(
  "/contractTemplate/:id",
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

    try {
      const deletedContract = await deleteContractTemplate(id, userId);

      return res.status(200).json(deletedContract);
    } catch (error) {
      return handleError(res, error, "Erro ao excluir o contrato.");
    }
  },
);

export default router;

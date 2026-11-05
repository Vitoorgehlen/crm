import { Router, Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/express";
import loginRequired from "../middlewares/loginRequired";

import {
  addGeneratedContract,
  deleteGeneratedContract,
  getGeneratedContract,
  updateGeneratedContract,
  GeneratedContractError,
} from "../repositories/contractGeneratedRepository";

import type { UpdateGeneratedContractData } from "../repositories/contractGeneratedRepository";

const router = Router();

const personTypes = [
  "SINGULAR_M",
  "SINGULAR_F",
  "PLURAL_M",
  "PLURAL_F",
] as const;

const contractStatuses = ["DRAFT", "FINALIZED", "SIGNED"] as const;

function isValidContent(value: unknown): boolean {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidId(value: unknown): boolean {
  const id = Number(value);

  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isInteger(id) &&
    id > 0
  );
}

function handleError(res: Response, error: unknown, fallback: string) {
  console.error(error);

  if (error instanceof GeneratedContractError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  return res.status(500).json({
    error: fallback,
  });
}

// =====================================================
// CREATE GENERATED CONTRACT
// =====================================================

router.post(
  "/generatedContract",
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

    const { templateId, dealId, name, content, sellerType, buyerType, status } =
      body;

    if (!isValidId(templateId)) {
      return res.status(400).json({
        error: "Selecione um modelo válido.",
      });
    }

    if (
      dealId !== undefined &&
      dealId !== null &&
      dealId !== "" &&
      !isValidId(dealId)
    ) {
      return res.status(400).json({
        error: "Negócio inválido.",
      });
    }

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

    if (sellerType !== undefined && !personTypes.includes(sellerType)) {
      return res.status(400).json({
        error: "Tipo do vendedor inválido.",
      });
    }

    if (buyerType !== undefined && !personTypes.includes(buyerType)) {
      return res.status(400).json({
        error: "Tipo do comprador inválido.",
      });
    }

    if (status !== undefined && !contractStatuses.includes(status)) {
      return res.status(400).json({
        error: "Status do contrato inválido.",
      });
    }

    try {
      const newContract = await addGeneratedContract(
        {
          templateId: Number(templateId),
          dealId:
            dealId === undefined || dealId === null || dealId === ""
              ? null
              : Number(dealId),
          name: name.trim(),
          content,
          ...(sellerType !== undefined ? { sellerType } : {}),
          ...(buyerType !== undefined ? { buyerType } : {}),
          ...(status !== undefined ? { status } : {}),
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
// GET GENERATED CONTRACTS
// =====================================================

router.get(
  "/generatedContract",
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
      const contracts = await getGeneratedContract(userId);

      return res.status(200).json(contracts);
    } catch (error) {
      return handleError(res, error, "Erro ao buscar contratos.");
    }
  },
);

// =====================================================
// UPDATE GENERATED CONTRACT
// =====================================================

router.put(
  "/generatedContract/:id",
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

    const updatedData: UpdateGeneratedContractData = {};

    // Nome
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return res.status(400).json({
          error: "Nome do contrato inválido.",
        });
      }

      updatedData.name = body.name.trim();
    }

    // Conteúdo
    if (body.content !== undefined) {
      if (!isValidContent(body.content)) {
        return res.status(400).json({
          error: "Conteúdo do contrato inválido.",
        });
      }

      updatedData.content = body.content;
    }

    // Negócio
    if (Object.prototype.hasOwnProperty.call(body, "dealId")) {
      if (body.dealId !== null && !isValidId(body.dealId)) {
        return res.status(400).json({
          error: "Negócio inválido.",
        });
      }

      updatedData.dealId = body.dealId === null ? null : Number(body.dealId);
    }

    // Modelo de origem: somente para conferir que não mudou
    if (Object.prototype.hasOwnProperty.call(body, "templateId")) {
      if (body.templateId !== null && !isValidId(body.templateId)) {
        return res.status(400).json({
          error: "Modelo inválido.",
        });
      }

      updatedData.templateId =
        body.templateId === null ? null : Number(body.templateId);
    }

    // Tipo do vendedor
    if (body.sellerType !== undefined) {
      if (!personTypes.includes(body.sellerType)) {
        return res.status(400).json({
          error: "Tipo do vendedor inválido.",
        });
      }

      updatedData.sellerType = body.sellerType;
    }

    // Tipo do comprador
    if (body.buyerType !== undefined) {
      if (!personTypes.includes(body.buyerType)) {
        return res.status(400).json({
          error: "Tipo do comprador inválido.",
        });
      }

      updatedData.buyerType = body.buyerType;
    }

    // Status
    if (body.status !== undefined) {
      if (!contractStatuses.includes(body.status)) {
        return res.status(400).json({
          error: "Status do contrato inválido.",
        });
      }

      updatedData.status = body.status;
    }

    if (
      Object.keys(updatedData).length === 0 ||
      (Object.keys(updatedData).length === 1 &&
        updatedData.templateId !== undefined)
    ) {
      return res.status(400).json({
        error: "Nenhum campo válido para atualização.",
      });
    }

    try {
      const updatedContract = await updateGeneratedContract(
        id,
        updatedData,
        userId,
      );

      return res.status(200).json(updatedContract);
    } catch (error) {
      return handleError(res, error, "Erro ao atualizar o contrato.");
    }
  },
);

// =====================================================
// DELETE GENERATED CONTRACT
// =====================================================

router.delete(
  "/generatedContract/:id",
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
      const deletedContract = await deleteGeneratedContract(id, userId);

      return res.status(200).json(deletedContract);
    } catch (error) {
      return handleError(res, error, "Erro ao excluir o contrato.");
    }
  },
);

export default router;

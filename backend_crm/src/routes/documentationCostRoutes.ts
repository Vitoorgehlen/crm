import { Router, Request, Response } from 'express';
import { addDocumentationCost, deleteDocumentationCost, getDocumentationCost, updateDocumentationCost } from '../repositories/documentationCostRepository'
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { Prisma } from '@prisma/client';

const router = Router();

router.post('/documentationcost/:id', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const { label, value, notes } = req.body;

  try {
    const newDocumantationCost = await addDocumentationCost({
      label,
      value: Number(value),
      notes,
      creatorId: userId,
      dealId: Number(id),
    }, userId);

    res.status(201).json(newDocumantationCost);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar o valor de documentação.' });
  }
});

router.get('/documentationcost/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const documentationCost = await getDocumentationCost(id);
    res.json(documentationCost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar o valor de documentação.' });
  }
});

router.put('/documentationcost/:id', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificado.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const updateData = req.body;

  try {
    const updatedDeal = await updateDocumentationCost(
      id,
      updateData as Partial<Prisma.DocumentationCostUncheckedUpdateInput>,
      userId,
    );
    return res.status(200).json(updatedDeal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar o valor de documentação' });
  }
});

router.delete('/documentationcost/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedDocumentationCost = await deleteDocumentationCost(id, userId);
    return res.status(200).json(deletedDocumentationCost);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar o usuário' });
  }
});

export default router;

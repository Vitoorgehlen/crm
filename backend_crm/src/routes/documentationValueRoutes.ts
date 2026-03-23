import { Router, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { Prisma } from '@prisma/client';
import { addDocumentationValue, deleteDocumentationValue, getDocumentationValue, updateDocumentationValue } from '../repositories/documentationValueRepository';

const router = Router();

router.post('/documentationvalue', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const data = req.body;

  try {
    const newDocumantationCost = await addDocumentationValue(data, userId);

    res.status(201).json(newDocumantationCost);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar documentação.' });
  }
});

router.get('/documentationvalue', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  try {
    const documentationValue = await getDocumentationValue(userId);
    res.json(documentationValue);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar a documentação.' });
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
    const updatedDocumentation = await updateDocumentationValue(
      id,
      updateData as Partial<Prisma.DocumentationValueUncheckedUpdateInput>,
      userId,
    );
    return res.status(200).json(updatedDocumentation);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar a documentação' });
  }
});

router.delete('/documentationvalue/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedDocumentationValue = await deleteDocumentationValue(id, userId);
    return res.status(200).json(deletedDocumentationValue);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar a documentação' });
  }
});

export default router;

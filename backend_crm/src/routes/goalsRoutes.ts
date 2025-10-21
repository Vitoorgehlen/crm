import { Router, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { addGoals, getGoals, updateGoals, deleteGoals } from '../repositories/goalsRepository';

const router = Router();

router.post('/goals', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const { content } = req.body;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'O campo "content" é obrigatório.' });
  }

  try {
    const newTask = await addGoals(content, userId);

    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar meta.' });
  }
});

router.get('/goals', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  try {
    const task = await getGoals(userId);
    res.json(task);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar as metas.' });
  }
});

router.put('/goals/:id', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const { content } = req.body;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'O campo "content" é obrigatório.' });
  }

  try {
    const updatedTask = await updateGoals(id, content, userId);
    return res.status(200).json(updatedTask);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

router.delete('/goals/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedTask = await deleteGoals(id, userId);
    return res.status(200).json(deletedTask);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar meta' });
  }
});

export default router;

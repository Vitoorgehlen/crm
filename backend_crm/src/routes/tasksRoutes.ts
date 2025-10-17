import { Router, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { addTasks, deleteTasks, getTasks, updateTasks } from '../repositories/tasksRepository';

const router = Router();

router.post('/tasks', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const { content } = req.body;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'O campo "content" é obrigatório.' });
  }

  try {
    const newTask = await addTasks(content, userId);

    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar a tarefa.' });
  }
});

router.get('/tasks', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  try {
    const task = await getTasks(userId);
    res.json(task);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar as tarefas.' });
  }
});

router.put('/tasks/:id', loginRequired, async (req: Request, res: Response) => {
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
    const updatedTask = await updateTasks(id, content, userId);
    return res.status(200).json(updatedTask);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar a Tarefa' });
  }
});

router.delete('/tasks/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedTask = await deleteTasks(id, userId);
    return res.status(200).json(deletedTask);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar a Tarefa' });
  }
});

export default router;

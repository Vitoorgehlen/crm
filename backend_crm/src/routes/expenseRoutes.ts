import { Router, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { addExpense, deleteExpense, getExpense, getFirstExpenseMonth, updateExpense } from '../repositories/expenseRepository';

const router = Router();

router.post('/expense/', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const data = req.body;

    try {
    const newExpense = await addExpense(data, userId);

    res.status(201).json(newExpense);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao despesa.' });
  }
});

router.get('/expense/', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  const { year } = req.query;
  const selectYear = typeof year === 'string' ? year : undefined;

  if (!selectYear) {
    return res.status(400).json({ error: 'Data inválida.' });
  }

  try {
    const expense = await getExpense(userId, selectYear);
    res.json(expense);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar o valor de nota.' });
  }
});

router.get('/first-expense/', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const expense = await getFirstExpenseMonth(userId);
    res.json(expense);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar o valor de nota.' });
  }
});

router.put('/expense/:id', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const data = req.body;

  try {
    const updatedDeal = await updateExpense(
      id,
      data,
      userId
    );
    return res.status(200).json(updatedDeal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar a despesa' });
  }
});

router.delete('/expense/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedExpense = await deleteExpense(id, userId);
    return res.status(200).json(deletedExpense);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar o despesa' });
  }
});

export default router;

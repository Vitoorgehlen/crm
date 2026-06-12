import { Router, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { addExpense, deleteExpense, getExpense, getExpenseRange, getRecurringExpense, updateExpense, updateRecurringStatus } from '../repositories/expenseRepository';
import { cronOnly } from '../middlewares/cronOnly';
import { generateRecurringExpenses } from '../cron/recurringExpenses';

const router = Router();

router.get('/generate-recurring-expenses', cronOnly, async (req, res) => {
  try {
    await generateRecurringExpenses();

    res.status(200).json({
      success: true,
      message: 'Despesas recorrentes geradas com sucesso'
    });
  } catch (error) {
    console.error('[CRON] Erro ao gerar despesas recorrentes:', error);
    res.status(500).json({
      error: 'Erro ao gerar despesas recorrentes'
    });
  }
});

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

    return res.status(400).json({
      error: err instanceof Error
        ? err.message
        : 'Erro ao adicionar a despesa.'
    });
  }
});

router.get('/expense/', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  const { year, month } = req.query;
  const selectMonth = typeof month === 'string' ? month : undefined;
  const selectYear = typeof year === 'string' ? year : undefined;

  if (!selectMonth || !selectYear) {
    return res.status(400).json({ error: 'Data inválida.' });
  }

  try {
    const expense = await getExpense(userId, Number(selectMonth), Number(selectYear));
    res.json(expense);
  } catch (err) {
    console.error(err);

    return res.status(400).json({
      error: err instanceof Error
        ? err.message
        : 'Erro ao ler a despesa.'
    });
  }
});

router.get('/expense-range/', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const expense = await getExpenseRange(userId);
    res.json(expense);
  } catch (err) {
    console.error(err);

    return res.status(400).json({
      error: err instanceof Error
        ? err.message
        : 'Erro ao ler a despesa.'
    });
  }
});


router.get('/recurring-expense/', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const expense = await getRecurringExpense(userId);
    res.json(expense);
  } catch (err) {
    console.error(err);

    return res.status(400).json({
      error: err instanceof Error
        ? err.message
        : 'Erro ao adicionar a despesa.'
    });
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

    return res.status(400).json({
      error: err instanceof Error
        ? err.message
        : 'Erro ao editar a despesa.'
    });
  }
});

router.put('/expense/:id/recurrence/', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const data = req.body;
  const isRecurringActive = data.isRecurringActive;
  if (typeof isRecurringActive !== 'boolean')
    return res.status(400).json({ error: 'Erro ao achar atualização.' });

  try {
    const updatedDeal = await updateRecurringStatus(id, isRecurringActive, userId);
    return res.status(200).json(updatedDeal);
  } catch (err) {
    console.error(err);

    return res.status(400).json({
      error: err instanceof Error
        ? err.message
        : 'Erro ao editar a despesa.'
    });
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

    return res.status(400).json({
      error: err instanceof Error
        ? err.message
        : 'Erro ao excluir a despesa.'
    });
  }
});

export default router;

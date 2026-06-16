import { Router } from 'express';
import { getChartCommissions, getCommission, getCompanyRevenue } from '../repositories/commissionRepository'
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';

const router = Router();

router.get('/commissions', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const name = String(req.query.name || '').trim();

  try {
    const deal = await getCommission(userId, { name });
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.get('/chart-commissions', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  try {
    const commissions = await getChartCommissions(userId);
    res.json(commissions);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar as suas comissões.' });
  }
})

router.get('/chart-company', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });


  try {
    const deal = await getCompanyRevenue(userId);
    res.json(deal);
  }  catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar as comissões da empresa.' });
  }
});

export default router;

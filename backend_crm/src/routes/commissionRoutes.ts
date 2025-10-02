import { Router } from 'express';
import { getCommission } from '../../repositories/commissionRepository'
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

// router.get('/team-deals', loginRequired, async (req, res) => {
//   const { user } = req as AuthenticatedRequest;
//   const { id: userId } = user;
//   if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

//   const name = String(req.query.name || '').trim();

//   const statusQ = typeof req.query.status === 'string' ? req.query.status : undefined;
//   const statusClientQ = typeof req.query.statusClient === 'string' ? req.query.statusClient : undefined;

//   const status = statusQ ? statusQ.split(',').map(s => s.trim()).filter(Boolean) : undefined;
//   const statusClient = statusClientQ ? statusClientQ.split(',').map(s => s.trim()).filter(Boolean) : undefined;

//   try {
//     const deal = await getTeamDeals(userId, { name, status, statusClient });
//     res.json(deal);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: 'Erro ao buscar negócio.' });
//   }
// });

export default router;

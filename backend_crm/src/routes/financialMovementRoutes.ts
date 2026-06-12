import { Router } from 'express';
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { getFinancialMovement } from '../repositories/financialMovementRepository';

const router = Router();

router.get('/financial-movement/', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId)
    return res.status(400).json({ error: 'Usuário inválido.' });

  try {
    const { startDate, endDate } = req.query;

    const financial = await getFinancialMovement(
      userId,
      startDate as string,
      endDate as string
    );
    res.json(financial);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar extrato.' });
  }
});

export default router;

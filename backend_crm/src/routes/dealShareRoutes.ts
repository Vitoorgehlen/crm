import { Router, Request, Response } from 'express';
import { closeDeal, deleteAllDealShare, updateDealShare, updateStep } from '../../repositories/dealShareRepository'
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { Prisma } from '@prisma/client';

const router = Router();

router.put('/deals-close/:id', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificado.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const { dealData: dealShareData } = req.body;

  try {
    const closed = await closeDeal( id, dealShareData, userId );
    return res.status(200).json(closed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar o deal' });
  }
});

router.put('/deals-close-change-step/:id', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificado.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const { changeStep } = req.body;

  try {
    const changed = await updateStep( id, changeStep, userId );
    return res.status(200).json(changed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar o deal' });
  }
});

router.put('/deals-share/:id', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificado.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const initialData = req.body;

  try {
    const updatedDeal = await updateDealShare(
      id,
      initialData as Partial<Prisma.DealShareUncheckedUpdateInput>,
      userId,
    );
    return res.status(200).json(updatedDeal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar o deal' });
  }
});

router.delete('/deals-share/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificado.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedDeal = await deleteAllDealShare(id, userId);
    return res.status(200).json(deletedDeal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar o comissões' });
  }
});

export default router;

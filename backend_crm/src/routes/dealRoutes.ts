import { Router, Request, Response } from 'express';
import {
  addDeal,
  getDeals,
  getTeamDeals,
  updateDeal,
  deleteDeal,
  getDealsByClient,
  getDealDeletedRequest,
} from '../../repositories/dealRepository'
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { Prisma } from '@prisma/client';

const router = Router();

router.post('/deals', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const { clientId, ...dealData } = req.body;

  if (!clientId) return res.status(400).json({ error: 'clientId é obrigatório.' });

  try {
    const newDeal = await addDeal({
      ...dealData,
      creatorId: userId,
      clientId: Number(clientId),
    }, userId );

    res.status(201).json(newDeal);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar o negociação.' });
  }
});

router.get('/deals', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const search = String(req.query.name || '').trim();

  const statusQ = typeof req.query.status === 'string' ? req.query.status : undefined;
  const statusClientQ = typeof req.query.statusClient === 'string' ? req.query.statusClient : undefined;

  const status = statusQ ? statusQ.split(',').map(s => s.trim()).filter(Boolean) : undefined;
  const statusClient = statusClientQ ? statusClientQ.split(',').map(s => s.trim()).filter(Boolean) : undefined;

  try {
    const deal = await getDeals(userId, { search, status, statusClient });
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.get('/deals-by-client/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const deal = await getDealsByClient(id, userId);
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.get('/team-deals', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const search = String(req.query.name || '').trim();

  const statusQ = typeof req.query.status === 'string' ? req.query.status : undefined;
  const statusClientQ = typeof req.query.statusClient === 'string' ? req.query.statusClient : undefined;

  const status = statusQ ? statusQ.split(',').map(s => s.trim()).filter(Boolean) : undefined;
  const statusClient = statusClientQ ? statusClientQ.split(',').map(s => s.trim()).filter(Boolean) : undefined;

  try {
    const deal = await getTeamDeals(userId, { search, status, statusClient });
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.get('/deals-deleted-request', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  try {
    const deal = await getDealDeletedRequest(userId);
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.put('/deals/:id', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificado.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const initialData = req.body;

  try {
    const updatedDeal = await updateDeal(
      id,
      initialData as Partial<Prisma.ClientUncheckedUpdateInput>,
      userId,
    );
    return res.status(200).json(updatedDeal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar o deal' });
  }
});

router.delete('/deal/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificado.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedDeal = await deleteDeal(id, userId);
    return res.status(200).json(deletedDeal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar o usuário' });
  }
});

export default router;

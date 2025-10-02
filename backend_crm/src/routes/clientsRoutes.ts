import { Router, Request, Response } from 'express';
import { addClient, deleteClient, getClientById, getClientDeletedRequest, getMyClients, getMyClientsBySearch, getTeamClients, getTeamClientsBySearch, updateClient} from '../repositories/clientRepository'
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { Prisma } from '@prisma/client';

const router = Router();

router.post('/clients', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: creatorId } = user;

  if (!creatorId) {
    return res.status(400).json({ error: 'ID do usuário não encontrado.' });
  }

  const clientData = req.body;

  try {
    const newClient = await addClient(creatorId, { ...clientData,  });
    res.status(201).json(newClient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar o Cliente.' });
  }
});

router.get('/clients/:id', loginRequired, async (req, res) => {
  const paramId = Number(req.params.id);

  if (isNaN(paramId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const { user } = req as AuthenticatedRequest;
  const { id: userId, role: userRole} = user;
  if (!userRole) return res.status(400).json({ error: 'ID inválido' });

  try {
    const deal = await getClientById(paramId, userId);
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.get('/clients-deleted-request', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  try {
    const deal = await getClientDeletedRequest(userId);
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.get('/clients', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  try {
    const deal = await getMyClients(userId);
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.get('/clients-by-search', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  const search = String(req.query.name || '').trim();
  if (!search) return res.status(400).json({ error: 'O parâmetro nome é obrigatório..' });

  try {
    const deal = await getMyClientsBySearch(userId, search);
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.get('/team-clients', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role: userRole } = user;
  if (!userRole) return res.status(400).json({ error: 'ID inválido' });

  try {
    const deal = await getTeamClients(userId);
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.get('/team-clients-by-search', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificado' });

  const search = String(req.query.name || '').trim();
  if (!search) return res.status(400).json({ error: 'O parâmetro nome é obrigatório..' });

  try {
    const deal = await getTeamClientsBySearch(userId, search);
    res.json(deal);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar negócio.' });
  }
});

router.put('/clients/:id', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const updatedData = req.body;

  try {
    const updatedUser = await updateClient(
      id,
      updatedData as Partial<Prisma.ClientUncheckedUpdateInput>,
      userId
    );
    return res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar o usuário' });
  }
});

router.delete('/clients/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedUser = await deleteClient(id, userId);
    return res.status(200).json(deletedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar o usuário' });
  }
});

export default router;

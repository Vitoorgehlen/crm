import { Router, Request, Response } from 'express';
import { addUser, deleteTeamMember, getMe, getUser, updateTeamUser, updateUser } from '../../repositories/userRepository';
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';

const router = Router();

router.post('/users', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role: userRole } = user;

  if (!userId || !userRole) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  const userData = req.body;

  try {
    const newUser = await addUser(userId, userRole, userData);
    res.status(201).json(newUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao criar o usuário' });
  }
});

router.get('/users', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId ) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const user = await getUser(userId);
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

router.get('/me', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId ) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const user = await getMe(userId);
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

router.put('/users', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário não identificado.' });

  const userData = req.body;

  try {
    const updatedUser = await updateUser(userId, userData);
    return res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar o usuário' });
  }
});

router.put('/users/:id', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: requesterId } = user;
  if (!requesterId) return res.status(400).json({ error: 'Usuário não identificado.' });

  const targetId = Number(req.params.id);
  if (!targetId || isNaN(targetId)) return res.status(400).json({ error: 'ID inválido' });


  const userData = req.body;

  try {
    const updatedUser = await updateTeamUser(requesterId, targetId, userData);
    return res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar o usuário' });
  }
});

router.delete('/users/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role: userRole } = user;
  if (!userId || !userRole) return res.status(400).json({ error: 'Função do usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedUser = await deleteTeamMember(userId, userRole, id);
    return res.status(200).json(deletedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar o usuário' });
  }
});

export default router;

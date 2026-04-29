import { Router, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/express';
import { addNotePad, addNotePadGlobal, deleteNotePadGlobal, getNotePad, getNotePadGlobal } from '../repositories/notePadRepository';
import loginRequired from '../middlewares/loginRequired';
import superUserOnly from '../middlewares/superUserOnly';

const router = Router();

router.put('/notepad-global', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  const { content, slot } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'O campo "content" é obrigatório.' });
  }

    try {
    const newNote = await addNotePadGlobal(content, slot);

    res.status(201).json(newNote);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar nota.' });
  }
});

router.put('/notepad', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'O campo "content" é obrigatório.' });
  }

    try {
    const newNote = await addNotePad(content,userId);

    res.status(201).json(newNote);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar nota.' });
  }
});

router.get('/notepad-global', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const note = await getNotePadGlobal();
    res.json(note);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar a nota.' });
  }
});

router.get('/notepad', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const note = await getNotePad(userId);
    res.json(note);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar a nota.' });
  }
});

router.delete('/notepad-global/:slot', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  const slot = Number(req.params.slot);

  if (isNaN(slot)) {
    return res.status(400).json({ error: 'Slot inválido.' });
  }

  try {
    const deletedNota = await deleteNotePadGlobal(slot);
    return res.status(200).json(deletedNota);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar a nota.' });
  }
});

export default router;

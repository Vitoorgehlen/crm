import { Router, Request, Response } from 'express';
import { addNote, deleteNote, getNote, updateNote } from '../../repositories/noteRepository'
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';

const router = Router();

router.post('/note/:id', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'O campo "content" é obrigatório.' });
  }

    try {
    const newNote = await addNote(
      { content, creatorId: userId, dealId: id },
      userId);

    res.status(201).json(newNote);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar o valor de nota.' });
  }
});

router.get('/note/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const note = await getNote(id);
    res.json(note);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar o valor de nota.' });
  }
});

router.put('/note/:id', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const rawContent = req.body.content;

  if (typeof rawContent !== 'string') {
    return res.status(400).json({ error: 'O campo "content" (string) é obrigatório.' });
  }

  const content = rawContent.trim();
  if (content === '') {
    return res.status(400).json({ error: 'O campo "content" não pode ser vazio.' });
  }

  try {
    const updatedDeal = await updateNote(
      id,
      content,
      userId
    );
    return res.status(200).json(updatedDeal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar a nota' });
  }
});

router.delete('/note/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedNota = await deleteNote(id, userId);
    return res.status(200).json(deletedNota);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar o usuário' });
  }
});

export default router;

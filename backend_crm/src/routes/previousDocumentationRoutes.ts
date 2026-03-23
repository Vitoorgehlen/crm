import { Router, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import superUserOnly from '../middlewares/superUserOnly';
import { upsertDocumentationDefaults, upsertDocumentationCustom, deleteDocumentationCustom, deleteDocumentationDefault, getDocumentationDefault, getDocumentationDefaultSU } from '../repositories/previousDocumentationRepository';

const router = Router();

router.put('/documentation-default', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  const docData = req.body;
  if (!docData) return res.status(400).json({ error: 'Erro ao criar documentação padrão.' });

  try {
    const newDoc = await upsertDocumentationDefaults(docData);
    res.status(201).json(newDoc);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao criar o documentação personalizada.' });
  }
});

router.get('/documentation-default-SU', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const docsDefault = await getDocumentationDefaultSU();
    res.status(201).json(docsDefault);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao achar documentações padrão.' });
  }
});

router.get('/documentation-default', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  try {
    const documentationDefault = await getDocumentationDefault(userId);
    res.json(documentationDefault);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar a documentação padrão.' });
  }
});

router.delete('/documentation-default/:id', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const deleteDoc = await deleteDocumentationDefault( id );
    res.status(201).json(deleteDoc);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao deletar documentação personalizada.' });
  }
});

//! ------------------------ CUSTOM ------------------------------------
router.put('/documentation-custom', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const docData = req.body;
  if (!docData) return res.status(400).json({ error: 'Erro ao editar documentação padrão.' });

  try {
    const addCustomDoc = await upsertDocumentationCustom( docData, userId );
    res.status(201).json(addCustomDoc);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao criar o documentação personalizada.' });
  }
});

router.delete('/documentation-custom/:id', loginRequired, async(req,res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const deleteDoc = await deleteDocumentationCustom( id, userId );
    res.status(201).json(deleteDoc);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao excluir documentação personalizada.' });
  }
});

export default router;

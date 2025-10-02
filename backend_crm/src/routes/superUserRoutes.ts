import { Router, Request, Response } from 'express';
import { addUserAdmin, getUsersCompany } from '../repositories/superUserRepository';
import superUserOnly from '../middlewares/superUserOnly';

const router = Router();

router.post('/super-user/users', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  const userData = req.body;
  if (!userData) return res.status(400).json({ error: 'Preencha os campos do usuário' });

  try {
    const newUser = await addUserAdmin({ ...userData });
    res.status(201).json(newUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao criar o usuário' });
  }
});

router.get('/super-user/users/:id', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const newUser = await getUsersCompany(id);
    res.status(201).json(newUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro na visualização dos usuários' });
  }
});

export default router;

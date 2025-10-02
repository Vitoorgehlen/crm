import { Router, Request, Response } from 'express';
import { addCompany, deleteCompany, getCompany, getMaxUsersCompany, updateCompany } from '../../repositories/companyRepository';
import { createDefaultRolePermissions, deleteRolePermissions } from '../../repositories/rolePermissionRepository';
import superUserOnly from '../middlewares/superUserOnly';
import loginRequired from '../middlewares/loginRequired';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

interface ISuperUser {
  id: number;
  email: string;
}

router.post('/company', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  const { name, maxUsers } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'O campo "name" é obrigatório e deve ser uma string.' });
  }

  if (maxUsers && (isNaN(maxUsers) || maxUsers <= 0)) {
    return res.status(400).json({ error: 'maxUsers deve ser um número positivo.' });
  }

  try {
    const newCompany = await addCompany( superUser.id, name, maxUsers );
    const newPermissions = await createDefaultRolePermissions(newCompany.id);
    res.status(201).json({
      message: 'Empresa criada com sucesso',
      newCompany,
      newPermissions: newPermissions.count,
    });
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar o valor de nota.' });
  }
});

router.get('/company', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const note = await getCompany();
    res.json(note);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar o valor de nota.' });
  }
});

router.get('/company-max-users', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!user) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const user = await getMaxUsersCompany(userId);
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

router.put('/company/:id', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  const companyId = Number(req.params.id);
  if (!companyId || isNaN(companyId)) return res.status(400).json({ error: 'ID inválido' });

  const { name, maxUsers,  isActive} = req.body;

  if (name && typeof name !== 'string') {
    return res.status(400).json({ error: 'O campo "name" deve ser uma string.' });
  }

  if (maxUsers && (isNaN(maxUsers) || maxUsers <= 0)) {
    return res.status(400).json({ error: 'maxUsers deve ser um número positivo.' });
  }

  if (typeof isActive !== 'undefined' && typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive" deve ser um booleano.' });
  }

  try {
    const newCompany = await updateCompany(
      superUser.id,
      companyId,
      name,
      maxUsers,
      isActive
    );

    res.status(200).json(newCompany);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar o valor de nota.' });
  }
});

router.delete('/company/:id', superUserOnly, async(
  req: Request & { superUser?: { id: number; email: string } },
  res: Response
) => {
  const superUser = req.superUser;
  if (!superUser) return res.status(403).json({ error: 'Acesso negado.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const permissions = await deleteRolePermissions(id)
    const company = await deleteCompany(id);
    res.json({
      message: 'Empresa removida com sucesso',
      company,
      rolePermissionDeleted: permissions.count,
    }).status(200);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar a empresa.' });
  }
});

export default router;

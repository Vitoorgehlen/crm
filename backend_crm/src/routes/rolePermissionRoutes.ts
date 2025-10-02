import { Router, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { getMyRolePermissions, getRolePermissionsByCompany, resetRolePermissionsDefault, updateRolePermission } from '../repositories/rolePermissionRepository';

const router = Router();

router.get('/my-role-permission', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId ) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const rolePermission = await getMyRolePermissions(userId);
    res.json({ permissions: rolePermission });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar as permissões.' });
  }
});

router.get('/role-permission', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role: userRole } = user;
  if (!userId || !userRole) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const rolePermission = await getRolePermissionsByCompany(userId, userRole);
    res.json(rolePermission);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Erro ao buscar as permissões.' });
  }
});

router.put('/role-permission', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role: userRole } = user;
  if (!userId || !userRole) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  const { role, updates } = req.body;

  try {
    const updatedPermission = await updateRolePermission(userId, userRole, role, updates);
    return res.status(200).json(updatedPermission);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar as permissões' });
  }
});

router.post('/role-permission/reset', loginRequired, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role: userRole } = user;
  if (!userId || !userRole) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }

  try {
    const resetPermission = await resetRolePermissionsDefault(userId, userRole);
    return res.status(200).json(resetPermission);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao resetar as permissões' });
  }
});

export default router;

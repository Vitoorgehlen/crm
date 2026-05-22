import { prisma } from "../prisma-client";
import { Request, Response, NextFunction  } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/express';


export default async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization) return res.status(401).json({ error: 'Requer Login' });

  const [, token] = authorization.split(' ');

  try {
    const secret = process.env.TOKEN_SECRET;
    if (!secret) throw new Error('TOKEN_SECRET não definido no .env');

    const dados = jwt.verify(token, secret) as { id: number, email: string};
    const { id, email } = dados;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { company: true }
    });

    if (!user || user.email !== email) return res.status(401).json({ error: 'Usuário inválido' });

    const isInactive = !user.company.isActive;
    const isExpired = user.company.expiresAt && new Date() > new Date(user.company.expiresAt);

    if (isInactive || isExpired)
      return res.status(401).json({ error: 'Empresa inativa ou assinatura expirada' });

    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      supervisorId: user.supervisorId,
    };

    return next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Token expirado ou inválido' });
  }
};

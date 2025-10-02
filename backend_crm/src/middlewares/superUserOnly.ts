import { prisma } from "../../prisma/client";
import { Request, Response, NextFunction  } from 'express';
import jwt from 'jsonwebtoken';


export default async function superUserOnly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { authorization } = req.headers;

  if (!authorization) return res.status(401).json({ error: 'Requer Login' });

  const [, token] = authorization.split(' ');

  try {
    const secret = process.env.TOKEN_SECRET;
    if (!secret) throw new Error('TOKEN_SECRET não definido no .env');

    const dados = jwt.verify(token, secret) as { id: number, email: string};
    const { id, email } = dados;

    const superUser = await prisma.superUser.findUnique({
      where: { id },
    });

    if (!superUser || superUser.email !== email) {
      return res.status(401).json({ error: 'Acesso negado.' });
    }

    (req as any).superUser = { id: superUser.id, email: superUser.email };

    return next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Token expirado ou inválido' });
  }
};

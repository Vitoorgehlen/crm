import { Request, Response, NextFunction  } from 'express';


export function cronOnly(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {

    return res.status(401).json({ error: 'Unauthorized: Cron access only' });
  }

  next();
};

import { Request, Response, NextFunction } from 'express';

export function cronOnly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.headers['x-vercel-cron']) return next();

  const authHeader = req.headers.authorization;

  if (authHeader ===`Bearer ${process.env.CRON_SECRET}`) return next();

  return res.status(401).json({
    error: 'Unauthorized: Cron access only',
  });
}

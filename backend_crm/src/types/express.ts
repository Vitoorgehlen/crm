import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role?: UserRole;
    supervisorId?: number | null;
  };
}

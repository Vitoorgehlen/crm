import { prisma } from "../prisma-client";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PLAN_CONFIG } from "../utils/plans";


export async function tokenIndex(email: string, password: string) {
  let user;
  let userType = 'user';
  user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
      company: {
        select: {
          plan: true
        }
      }
    }
  });

  if (!user) {
    user = await prisma.superUser.findUnique({
      where: { email },
    });
    userType = 'superuser';
  }

  if (!user) throw new Error('Usuário inválido');

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error('Senha incorreta');
  }

  const { id } = user;
  if (!process.env.TOKEN_SECRET) {
    throw new Error('TOKEN_SECRET não está definido nas variáveis de ambiente');
  }

  const expiration = (process.env.TOKEN_EXPIRATION ?? '1d') as jwt.SignOptions['expiresIn'];

  const token = jwt.sign({ id, email }, process.env.TOKEN_SECRET, {
    expiresIn: expiration,
  });

  const companyPlan = userType === 'user' && 'company' in user ? user.company?.plan : undefined;
  const plan = companyPlan ? PLAN_CONFIG[companyPlan] : null;
  const planRules = plan
    ? Object.entries(plan.features).filter(([_, enabled]) => enabled === true).map(([feature]) => feature)
    : [];

  return { token, planRules, userType};
}


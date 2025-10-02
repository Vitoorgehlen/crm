import { prisma } from "../prisma-client";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export async function tokenIndex(email: string, password: string) {
  let user;
  let userType = 'user';
  user = await prisma.user.findUnique({
    where: { email },
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
  return { token, userType};
}


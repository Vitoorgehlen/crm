import { prisma } from "../prisma-client";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';


export async function resetPassword(email: string) {
  const user= await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error('Usuário inválido');

  if (!process.env.TOKEN_SECRET) {
    throw new Error('TOKEN_SECRET não está definido nas variáveis de ambiente');
  }

  const token = jwt.sign({ id: user.id, email }, process.env.TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`

  return { token, resetLink };
}

export async function confirmReset(token: string, newPassword: string) {
  if (!process.env.TOKEN_SECRET) {
    throw new Error('TOKEN_SECRET não está definido nas variáveis de ambiente');
  }

  const decoded = jwt.verify(token, process.env.TOKEN_SECRET) as {
    id: number;
    email: string;
  };

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatePassword = prisma.user.update({
    where: { id: decoded.id },
    data: { password: hashedPassword },
  })

  return { updatePassword };
}


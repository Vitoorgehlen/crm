import { Router } from 'express';
import { confirmReset, resetPassword } from '../repositories/resetPasswordRepository';
import { sendEmail } from '../utils/sendEmail';

const router = Router();

router.post('/password-reset', async (req, res) => {
  const { email = '' } = req.body;
  if (!email) return res.status(401).json({ error: 'Email inválido' });

  try {
    const { resetLink } = await resetPassword(email);

    await sendEmail (
      email,
      "Recuperação de senha - Cloop CRM",

      `
      <p>Você solicitou a redefinição de senha.</p>
      <p>Clique no link abaixo para definir uma sova senha (válido apenar por 15 minutos):</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Se você não solicitou isso, apenas ignore este email.</p>
      `
    );

    res.json({ message: "Email de recuperação enviado com sucesso."});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

router.post('/password-reset/confirm', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    return res.status(401).json({ error: 'Token ou senha inválidos' });

  try {
      const result = await confirmReset(token, newPassword);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao atualizar a senha' });
    }
});

export default router;

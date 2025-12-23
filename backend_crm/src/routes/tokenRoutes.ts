import { Router } from 'express';
import { tokenIndex } from '../repositories/tokenRepository';

const router = Router();

router.post('/tokens', async (req, res) => {
  const { email = '', password = '' } = req.body;
  if (!email || !password) return res.status(401).json({ error: 'Credenciais inválidas' });

  try {
    const result = await tokenIndex(email, password);
    res.json(result);
  } catch (error: any) {
    console.error(error);
     const message = error.message || 'Erro ao processar token';

    if (message === 'Senha incorreta' || message === 'Usuário inválido') {
      return res.status(401).json({ error: 'Senha ou usuário inválidos' });
    }

    return res.status(500).json({ error: 'Erro ao processar token' });
  }
});

export default router;

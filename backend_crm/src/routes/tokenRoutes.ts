import { Router } from 'express';
import { tokenIndex } from '../repositories/tokenRepository';

const router = Router();

router.post('/tokens', async (req, res) => {
  const { email = '', password = '' } = req.body;
  if (!email || !password) return res.status(401).json({ error: 'Credenciais inválidas' });

  try {
    const result = await tokenIndex(email, password);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar token' });
  }
});

export default router;

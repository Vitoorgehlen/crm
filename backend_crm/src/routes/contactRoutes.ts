import { Router } from 'express';
import { sendEmail } from '../utils/sendEmail';

const router = Router();

router.post('/contact', async (req, res) => {
  const { subject, html } = req.body;

  try {
    await sendEmail(
      "vitorgehlencorretor@gmail.com",
      subject,
      html
    );

    res.json({
      message: "Mensagem enviada com sucesso.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao enviar mensagem",
    });
  }
});

export default router;

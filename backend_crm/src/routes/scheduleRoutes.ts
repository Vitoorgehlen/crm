import { Router } from 'express';
import { addSchedule, deleteOldsSchedule, deleteSchedule, editSchedule, getSchedules } from '../repositories/scheduleRepository'
import type { AuthenticatedRequest } from '../types/express';
import loginRequired from '../middlewares/loginRequired';
import { cronOnly } from '../middlewares/cronOnly';

const router = Router();

router.post('/schedule', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const data = req.body;
  if (!data.label || typeof data.label !== 'string') {
    return res.status(400).json({ error: 'O campo "label" é obrigatório.' });
  }

    try {
    const newSchedule = await addSchedule(data, userId);

    res.status(201).json(newSchedule);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar o compromisso.' });
  }
});

router.get('/schedule', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

    try {
    const getSchedule = await getSchedules(userId);
    res.status(201).json(getSchedule);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao pegar compromissos.' });
  }
});

router.put('/schedule/:id', loginRequired, async(req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;

  if (!userId) return res.status(400).json({ error: 'Usuário inválido.' });

  const data = req.body;
  if (!data.label || typeof data.label !== 'string') {
    return res.status(400).json({ error: 'O campo "label" é obrigatório.' });
  }

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const newSchedule = await editSchedule(id, data, userId);

    res.status(201).json(newSchedule);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Erro ao criar o compromisso.' });
  }
});

router.delete('/schedule/:id', loginRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId } = user;
  if (!userId) return res.status(400).json({ error: 'Usuário não identificada.' });

  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });


  try {
    const deletedNota = await deleteSchedule(id, userId);
    return res.status(200).json(deletedNota);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar o compromisso' });
  }
});

router.post("/cleanupSchedules", cronOnly, async (req, res) => {
  try {
  const today = new Date();
  const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

  const result = await deleteOldsSchedule(firstDayOfLastMonth, lastDayOfLastMonth)

  console.log(`${result.count} schedules do mês passado foram apagados.`);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: "Erro ao apagar schedules antigos" });
  };
});

export default router;

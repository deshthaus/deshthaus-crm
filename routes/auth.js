const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');
const authMiddleware = require('../middleware/auth');
const SECRET = process.env.JWT_SECRET || 'deshthaus_secret_2026';

router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Введите имя и пароль' });
  const { data: users } = await supabase.from('users').select('*').ilike('name', name).limit(1);
  const user = users?.[0];
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Неверное имя или пароль' });
  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const { data } = await supabase.from('users').select('id,name,email,role').order('id');
  res.json(data || []);
});

router.post('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const { name, password, role } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Введите имя и пароль' });
  const { data: exists } = await supabase.from('users').select('id').ilike('name', name).limit(1);
  if (exists?.length > 0) return res.status(409).json({ error: 'Такое имя уже занято' });
  const { data, error } = await supabase.from('users').insert({ name, password: bcrypt.hashSync(password, 10), role: role || 'member' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id, name: data.name, role: data.role });
});

router.put('/users/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const { name, password, role } = req.body;
  const update = { name, role };
  if (password) update.password = bcrypt.hashSync(password, 10);
  await supabase.from('users').update(update).eq('id', req.params.id);
  const { data } = await supabase.from('users').select('id,name,role').eq('id', req.params.id).single();
  res.json(data);
});

router.delete('/users/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Нельзя удалить себя' });
  await supabase.from('users').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

router.put('/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  const { data: users } = await supabase.from('users').select('*').eq('id', req.user.id).limit(1);
  const user = users?.[0];
  if (!user || !bcrypt.compareSync(current_password, user.password))
    return res.status(401).json({ error: 'Неверный текущий пароль' });
  if (!new_password || new_password.length < 4) return res.status(400).json({ error: 'Минимум 4 символа' });
  await supabase.from('users').update({ password: bcrypt.hashSync(new_password, 10) }).eq('id', req.user.id);
  res.json({ ok: true });
});

module.exports = router;

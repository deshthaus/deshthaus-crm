const router = require('express').Router();
const supabase = require('../db/supabase');

router.get('/', async (req, res) => {
  const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

router.post('/', async (req, res) => {
  const { name, type, phone, email, budget, budget_max, color, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя обязательно' });
  const { data, error } = await supabase.from('clients').insert({ name, type: type || 'Частный', phone: phone || '', email: email || '', budget: Number(budget) || 0, budget_max: Number(budget_max) || 0, color: color || '#1a1f5e', notes: notes || '' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/:id', async (req, res) => {
  const { name, type, phone, email, budget, budget_max, color, notes } = req.body;
  await supabase.from('clients').update({ name, type, phone, email, budget: Number(budget) || 0, budget_max: Number(budget_max) || 0, color, notes }).eq('id', req.params.id);
  const { data } = await supabase.from('clients').select('*').eq('id', req.params.id).single();
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await supabase.from('clients').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

module.exports = router;

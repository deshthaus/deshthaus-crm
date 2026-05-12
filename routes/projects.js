const router = require('express').Router();
const supabase = require('../db/supabase');

router.get('/', async (req, res) => {
  const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

router.post('/', async (req, res) => {
  const { name, client_id, status, budget, deadline, description, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  let client_name = null;
  if (client_id) {
    const { data: c } = await supabase.from('clients').select('name').eq('id', client_id).single();
    client_name = c?.name;
  }
  const { data, error } = await supabase.from('projects').insert({ name, client_id: client_id || null, client_name, status: status || 'Дизайн', budget: budget || '', deadline: deadline || null, description: description || '', color: color || '#1a1f5e' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/:id', async (req, res) => {
  const { name, client_id, status, budget, deadline, description, color } = req.body;
  let client_name = null;
  if (client_id) {
    const { data: c } = await supabase.from('clients').select('name').eq('id', client_id).single();
    client_name = c?.name;
  }
  await supabase.from('projects').update({ name, client_id: client_id || null, client_name, status, budget, deadline: deadline || null, description, color }).eq('id', req.params.id);
  const { data } = await supabase.from('projects').select('*').eq('id', req.params.id).single();
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await supabase.from('projects').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

module.exports = router;

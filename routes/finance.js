const router = require('express').Router();
const supabase = require('../db/supabase');

router.get('/', async (req, res) => {
  const { data: rows } = await supabase.from('finance').select('*').order('created_at', { ascending: false });
  const r = rows || [];
  const income  = r.filter(x => x.amount > 0).reduce((s, x) => s + x.amount, 0);
  const expense = r.filter(x => x.amount < 0).reduce((s, x) => s + Math.abs(x.amount), 0);
  res.json({ rows: r, income, expense, profit: income - expense });
});

router.post('/', async (req, res) => {
  const { label, amount, type, project_id, date } = req.body;
  const val = type === 'expense' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
  let project_name = null;
  if (project_id) {
    const { data: p } = await supabase.from('projects').select('name').eq('id', project_id).single();
    project_name = p?.name;
  }
  const { data, error } = await supabase.from('finance').insert({ label, amount: val, type: type || 'income', project_id: project_id || null, project_name, date: date || new Date().toISOString().slice(0,10) }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await supabase.from('finance').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

router.get('/deals', async (req, res) => {
  const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

router.post('/deals', async (req, res) => {
  const { name, client_id, amount, stage, notes } = req.body;
  let client_name = null;
  if (client_id) {
    const { data: c } = await supabase.from('clients').select('name').eq('id', client_id).single();
    client_name = c?.name;
  }
  const { data, error } = await supabase.from('deals').insert({ name, client_id: client_id || null, client_name: client_name || '', amount: amount || '', stage: stage || 'Обращение', notes: notes || '' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/deals/:id', async (req, res) => {
  const { name, client_id, amount, stage, notes } = req.body;
  let client_name = null;
  if (client_id) {
    const { data: c } = await supabase.from('clients').select('name').eq('id', client_id).single();
    client_name = c?.name;
  }
  await supabase.from('deals').update({ name, client_id: client_id || null, client_name: client_name || '', amount, stage, notes }).eq('id', req.params.id);
  const { data } = await supabase.from('deals').select('*').eq('id', req.params.id).single();
  res.json(data);
});

router.delete('/deals/:id', async (req, res) => {
  await supabase.from('deals').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

module.exports = router;

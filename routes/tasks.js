const router = require('express').Router();
const supabase = require('../db/supabase');

router.get('/', async (req, res) => {
  const { data } = await supabase.from('tasks').select('*').order('done').order('due', { nullsFirst: false });
  res.json(data || []);
});

router.post('/', async (req, res) => {
  const { text, project_id, due, priority } = req.body;
  if (!text) return res.status(400).json({ error: 'Текст обязателен' });
  let project_name = null;
  if (project_id) {
    const { data: p } = await supabase.from('projects').select('name').eq('id', project_id).single();
    project_name = p?.name;
  }
  const { data, error } = await supabase.from('tasks').insert({ text, project_id: project_id || null, project_name, done: false, due: due || null, priority: priority || 'med' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/:id', async (req, res) => {
  const { text, project_id, due, priority, done } = req.body;
  let project_name = null;
  if (project_id) {
    const { data: p } = await supabase.from('projects').select('name').eq('id', project_id).single();
    project_name = p?.name;
  }
  await supabase.from('tasks').update({ text, project_id: project_id || null, project_name, due: due || null, priority, done: !!done }).eq('id', req.params.id);
  const { data } = await supabase.from('tasks').select('*').eq('id', req.params.id).single();
  res.json(data);
});

router.patch('/:id/toggle', async (req, res) => {
  const { data: task } = await supabase.from('tasks').select('done').eq('id', req.params.id).single();
  if (!task) return res.status(404).json({ error: 'Не найдена' });
  await supabase.from('tasks').update({ done: !task.done }).eq('id', req.params.id);
  const { data } = await supabase.from('tasks').select('*').eq('id', req.params.id).single();
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  await supabase.from('tasks').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

module.exports = router;

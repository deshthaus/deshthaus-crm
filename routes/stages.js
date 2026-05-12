const router = require('express').Router();
const supabase = require('../db/supabase');

// Получить все этапы проекта с подэтапами и задачами
router.get('/project/:projectId', async (req, res) => {
  const pid = req.params.projectId;

  const { data: stages } = await supabase
    .from('stages').select('*').eq('project_id', pid).order('order_index');

  const { data: substages } = await supabase
    .from('substages').select('*').eq('project_id', pid).order('order_index');

  const { data: tasks } = await supabase
    .from('stage_tasks').select('*').eq('project_id', pid).order('created_at');

  // Считаем прогресс
  const result = (stages || []).map(stage => {
    const stageSubs = (substages || []).filter(s => s.stage_id === stage.id);
    const stageTasks = (tasks || []).filter(t => t.stage_id === stage.id && !t.substage_id);

    const subsWithTasks = stageSubs.map(sub => {
      const subTasks = (tasks || []).filter(t => t.substage_id === sub.id);
      const done = subTasks.filter(t => t.done).length;
      const total = subTasks.length;
      return { ...sub, tasks: subTasks, progress: total > 0 ? Math.round(done / total * 100) : 0 };
    });

    const allTasks = [...stageTasks, ...(tasks || []).filter(t => stageSubs.find(s => s.id === t.substage_id))];
    const doneAll = allTasks.filter(t => t.done).length;
    const totalAll = allTasks.length;

    return {
      ...stage,
      substages: subsWithTasks,
      tasks: stageTasks,
      progress: totalAll > 0 ? Math.round(doneAll / totalAll * 100) : 0
    };
  });

  res.json(result);
});

// Создать этап
router.post('/', async (req, res) => {
  const { project_id, name, order_index } = req.body;
  const { data, error } = await supabase.from('stages')
    .insert({ project_id, name, order_index: order_index || 0 }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Обновить этап
router.put('/:id', async (req, res) => {
  const { name, status } = req.body;
  await supabase.from('stages').update({ name, status }).eq('id', req.params.id);
  const { data } = await supabase.from('stages').select('*').eq('id', req.params.id).single();
  res.json(data);
});

// Удалить этап
router.delete('/:id', async (req, res) => {
  await supabase.from('stage_tasks').delete().eq('stage_id', req.params.id);
  await supabase.from('substages').delete().eq('stage_id', req.params.id);
  await supabase.from('stages').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

// Создать подэтап
router.post('/substage', async (req, res) => {
  const { stage_id, project_id, name, order_index } = req.body;
  const { data, error } = await supabase.from('substages')
    .insert({ stage_id, project_id, name, order_index: order_index || 0 }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Обновить подэтап
router.put('/substage/:id', async (req, res) => {
  const { name, status } = req.body;
  await supabase.from('substages').update({ name, status }).eq('id', req.params.id);
  const { data } = await supabase.from('substages').select('*').eq('id', req.params.id).single();
  res.json(data);
});

// Удалить подэтап
router.delete('/substage/:id', async (req, res) => {
  await supabase.from('stage_tasks').delete().eq('substage_id', req.params.id);
  await supabase.from('substages').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

// Создать задачу этапа
router.post('/task', async (req, res) => {
  const { substage_id, stage_id, project_id, text, assigned_to, assigned_name, due, priority } = req.body;
  const { data, error } = await supabase.from('stage_tasks')
    .insert({ substage_id: substage_id || null, stage_id, project_id, text, assigned_to: assigned_to || null, assigned_name: assigned_name || null, done: false, due: due || null, priority: priority || 'med' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Переключить задачу
router.patch('/task/:id/toggle', async (req, res) => {
  const { data: task } = await supabase.from('stage_tasks').select('done').eq('id', req.params.id).single();
  await supabase.from('stage_tasks').update({ done: !task.done }).eq('id', req.params.id);
  const { data } = await supabase.from('stage_tasks').select('*').eq('id', req.params.id).single();
  res.json(data);
});

// Удалить задачу
router.delete('/task/:id', async (req, res) => {
  await supabase.from('stage_tasks').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

module.exports = router;

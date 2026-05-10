const router = require('express').Router();
const db = require('../db/db');

router.get('/', (req, res) => {
  const tasks = db.get('tasks').value().map(t => ({
    ...t,
    project_name: t.project_id ? (db.get('projects').find({ id: t.project_id }).value() || {}).name : null
  }));
  res.json(tasks);
});

router.post('/', (req, res) => {
  const { text, project_id, due, priority } = req.body;
  if (!text) return res.status(400).json({ error: 'Текст задачи обязателен' });
  const proj = project_id ? db.get('projects').find({ id: Number(project_id) }).value() : null;
  const t = {
    id: Date.now(), text,
    project_id: project_id ? Number(project_id) : null,
    project_name: proj ? proj.name : null,
    done: false,
    due: due || null,
    priority: priority || 'med',
    created_at: new Date().toISOString()
  };
  db.get('tasks').push(t).write();
  res.json(t);
});

router.put('/:id', (req, res) => {
  const { text, project_id, due, priority, done } = req.body;
  const proj = project_id ? db.get('projects').find({ id: Number(project_id) }).value() : null;
  db.get('tasks').find({ id: Number(req.params.id) }).assign({
    text,
    project_id: project_id ? Number(project_id) : null,
    project_name: proj ? proj.name : null,
    due, priority,
    done: !!done
  }).write();
  res.json(db.get('tasks').find({ id: Number(req.params.id) }).value());
});

router.patch('/:id/toggle', (req, res) => {
  const task = db.get('tasks').find({ id: Number(req.params.id) }).value();
  if (!task) return res.status(404).json({ error: 'Не найдена' });
  db.get('tasks').find({ id: Number(req.params.id) }).assign({ done: !task.done }).write();
  res.json(db.get('tasks').find({ id: Number(req.params.id) }).value());
});

router.delete('/:id', (req, res) => {
  db.get('tasks').remove({ id: Number(req.params.id) }).write();
  res.json({ ok: true });
});

module.exports = router;

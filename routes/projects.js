const router = require('express').Router();
const db = require('../db/db');

router.get('/', (req, res) => {
  res.json(db.get('projects').orderBy('id', 'desc').value());
});

router.get('/:id', (req, res) => {
  const p = db.get('projects').find({ id: Number(req.params.id) }).value();
  if (!p) return res.status(404).json({ error: 'Не найден' });
  const tasks = db.get('tasks').filter({ project_id: p.id }).value();
  const files = db.get('files').filter({ project_id: p.id }).value();
  res.json({ ...p, tasks, files });
});

router.post('/', (req, res) => {
  const { name, client_id, status, budget, deadline, description, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const client = client_id ? db.get('clients').find({ id: Number(client_id) }).value() : null;
  const p = {
    id: Date.now(),
    name,
    client_id: client_id ? Number(client_id) : null,
    client_name: client ? client.name : null,
    status: status || 'Дизайн',
    budget: budget || '',
    deadline: deadline || null,
    description: description || '',
    color: color || '#1a1f5e',
    created_at: new Date().toISOString()
  };
  db.get('projects').push(p).write();
  res.json(p);
});

router.put('/:id', (req, res) => {
  const { name, client_id, status, budget, deadline, description, color } = req.body;
  const client = client_id ? db.get('clients').find({ id: Number(client_id) }).value() : null;
  db.get('projects').find({ id: Number(req.params.id) }).assign({
    name, client_id: client_id ? Number(client_id) : null,
    client_name: client ? client.name : null,
    status, budget, deadline, description, color
  }).write();
  res.json(db.get('projects').find({ id: Number(req.params.id) }).value());
});

router.delete('/:id', (req, res) => {
  db.get('projects').remove({ id: Number(req.params.id) }).write();
  res.json({ ok: true });
});

module.exports = router;

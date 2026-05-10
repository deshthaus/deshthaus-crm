const router = require('express').Router();
const db = require('../db/db');

router.get('/', (req, res) => {
  const rows = db.get('finance').orderBy('created_at', 'desc').value().map(r => ({
    ...r,
    project_name: r.project_id ? (db.get('projects').find({ id: r.project_id }).value() || {}).name : null
  }));
  const income  = rows.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
  res.json({ rows, income, expense, profit: income - expense });
});

router.post('/', (req, res) => {
  const { label, amount, type, project_id, date } = req.body;
  const val = type === 'expense' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
  const r = { id: Date.now(), label, amount: val, type: type || 'income', project_id: project_id ? Number(project_id) : null, date: date || new Date().toISOString().slice(0,10), created_at: new Date().toISOString() };
  db.get('finance').push(r).write();
  res.json(r);
});

// Deals
router.get('/deals', (req, res) => {
  const deals = db.get('deals').value().map(d => ({
    ...d,
    client_name: d.client_id ? (db.get('clients').find({ id: d.client_id }).value() || {}).name : d.client_name
  }));
  res.json(deals);
});

router.post('/deals', (req, res) => {
  const { name, client_id, amount, stage, notes } = req.body;
  const client = client_id ? db.get('clients').find({ id: Number(client_id) }).value() : null;
  const d = { id: Date.now(), name, client_id: client_id ? Number(client_id) : null, client_name: client ? client.name : '', amount: amount || '', stage: stage || 'Обращение', notes: notes || '', created_at: new Date().toISOString() };
  db.get('deals').push(d).write();
  res.json(d);
});

router.put('/deals/:id', (req, res) => {
  const { name, client_id, amount, stage, notes } = req.body;
  const client = client_id ? db.get('clients').find({ id: Number(client_id) }).value() : null;
  db.get('deals').find({ id: Number(req.params.id) }).assign({ name, client_id: client_id ? Number(client_id) : null, client_name: client ? client.name : '', amount, stage, notes }).write();
  res.json(db.get('deals').find({ id: Number(req.params.id) }).value());
});

module.exports = router;

const router = require('express').Router();
const db = require('../db/db');

router.get('/', (req, res) => {
  res.json(db.get('clients').value());
});

router.post('/', (req, res) => {
  const { name, type, phone, email, address, budget, budget_max, color, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя обязательно' });
  const c = {
    id: Date.now(), name,
    type: type || 'Частный',
    phone: phone || '', email: email || '',
    address: address || '',
    budget: Number(budget) || 0,
    budget_max: Number(budget_max) || 0,
    color: color || '#1a1f5e',
    notes: notes || '',
    created_at: new Date().toISOString()
  };
  db.get('clients').push(c).write();
  res.json(c);
});

router.put('/:id', (req, res) => {
  const { name, type, phone, email, address, budget, budget_max, color, notes } = req.body;
  db.get('clients').find({ id: Number(req.params.id) }).assign({
    name, type, phone, email, address,
    budget: Number(budget) || 0,
    budget_max: Number(budget_max) || 0,
    color, notes
  }).write();
  res.json(db.get('clients').find({ id: Number(req.params.id) }).value());
});

router.delete('/:id', (req, res) => {
  db.get('clients').remove({ id: Number(req.params.id) }).write();
  res.json({ ok: true });
});

module.exports = router;

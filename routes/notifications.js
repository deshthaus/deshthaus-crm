const router = require('express').Router();
const db = require('../db/db');

router.get('/', (req, res) => {
  res.json(db.get('notifications').filter(n => !n.user_id || n.user_id === req.user.id).orderBy('created_at', 'desc').take(30).value());
});

router.patch('/:id/read', (req, res) => {
  db.get('notifications').find({ id: Number(req.params.id) }).assign({ unread: false }).write();
  res.json({ ok: true });
});

router.post('/', (req, res) => {
  const { text, sub, type } = req.body;
  const n = { id: Date.now(), user_id: req.user.id, text, sub: sub || '', type: type || 'info', unread: true, created_at: new Date().toISOString() };
  db.get('notifications').push(n).write();
  res.json(n);
});

module.exports = router;

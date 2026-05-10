const router = require('express').Router();
const db = require('../db/db');

router.get('/', (req, res) => {
  const items = db.get('notifications')
    .filter(n => n.user_id === req.user.id)
    .orderBy('created_at', 'desc')
    .take(30)
    .value();
  res.json(items);
});

router.patch('/:id/read', (req, res) => {
  db.get('notifications').find({ id: Number(req.params.id) }).assign({ unread: false }).write();
  res.json({ ok: true });
});

router.post('/', (req, res) => {
  const { text, sub, type, user_id } = req.body;
  const n = { id: Date.now(), user_id: user_id || req.user.id, text, sub: sub || '', type: type || 'info', unread: true, created_at: new Date().toISOString() };
  db.get('notifications').push(n).write();
  res.json(n);
});

module.exports = router;

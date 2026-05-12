const router = require('express').Router();
const supabase = require('../db/supabase');

router.get('/', async (req, res) => {
  const { data } = await supabase.from('notifications').select('*').or(`user_id.eq.${req.user.id},user_id.is.null`).order('created_at', { ascending: false }).limit(30);
  res.json(data || []);
});

router.patch('/:id/read', async (req, res) => {
  await supabase.from('notifications').update({ unread: false }).eq('id', req.params.id);
  res.json({ ok: true });
});

router.post('/', async (req, res) => {
  const { text, sub, type } = req.body;
  const { data } = await supabase.from('notifications').insert({ user_id: req.user.id, text, sub: sub || '', type: type || 'info', unread: true }).select().single();
  res.json(data);
});

module.exports = router;

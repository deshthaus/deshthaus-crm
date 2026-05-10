const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const authMiddleware = require('../middleware/auth');
const SECRET = process.env.JWT_SECRET || 'deshthaus_secret_2026';

// Вход по email + пароль
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });
  const user = db.get('users').find({ email }).value();
  if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });
  if (user.password && !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Неверный email или пароль' });
  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Получить всех пользователей (только admin)
router.get('/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const users = db.get('users').value().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
  res.json(users);
});

// Добавить пользователя (только admin)
router.post('/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });
  if (db.get('users').find({ email }).value()) return res.status(409).json({ error: 'Email уже занят' });
  const id = Date.now();
  db.get('users').push({ id, name, email, password: bcrypt.hashSync(password, 10), role: role || 'member' }).write();
  res.json({ id, name, email, role: role || 'member' });
});

// Редактировать пользователя (только admin)
router.put('/users/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const { name, email, password, role } = req.body;
  const update = { name, email, role };
  if (password) update.password = bcrypt.hashSync(password, 10);
  db.get('users').find({ id: Number(req.params.id) }).assign(update).write();
  const u = db.get('users').find({ id: Number(req.params.id) }).value();
  res.json({ id: u.id, name: u.name, email: u.email, role: u.role });
});

// Удалить пользователя (только admin)
router.delete('/users/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Нельзя удалить себя' });
  db.get('users').remove({ id: Number(req.params.id) }).write();
  res.json({ ok: true });
});

// Сменить свой пароль
router.put('/change-password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.get('users').find({ id: req.user.id }).value();
  if (!user || !bcrypt.compareSync(current_password, user.password))
    return res.status(401).json({ error: 'Неверный текущий пароль' });
  if (!new_password || new_password.length < 6)
    return res.status(400).json({ error: 'Минимум 6 символов' });
  db.get('users').find({ id: req.user.id }).assign({ password: bcrypt.hashSync(new_password, 10) }).write();
  res.json({ ok: true });
});

module.exports = router;

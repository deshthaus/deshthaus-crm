const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const authMiddleware = require('../middleware/auth');
const SECRET = process.env.JWT_SECRET || 'deshthaus_secret_2026';

// Вход по имени + пароль
router.post('/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Введите имя и пароль' });
  const user = db.get('users').find(u => u.name.toLowerCase() === name.toLowerCase()).value();
  if (!user) return res.status(401).json({ error: 'Имя не найдено' });
  if (!bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Неверный пароль' });
  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Получить всех пользователей
router.get('/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  res.json(db.get('users').value().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
});

// Добавить пользователя
router.post('/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const { name, password, role } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Введите имя и пароль' });
  if (db.get('users').find(u => u.name.toLowerCase() === name.toLowerCase()).value())
    return res.status(409).json({ error: 'Такое имя уже занято' });
  const id = Date.now();
  db.get('users').push({ id, name, email: '', password: bcrypt.hashSync(password, 10), role: role || 'member' }).write();
  res.json({ id, name, role: role || 'member' });
});

// Редактировать пользователя
router.put('/users/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const { name, password, role } = req.body;
  const update = { name, role };
  if (password) update.password = bcrypt.hashSync(password, 10);
  db.get('users').find({ id: Number(req.params.id) }).assign(update).write();
  const u = db.get('users').find({ id: Number(req.params.id) }).value();
  res.json({ id: u.id, name: u.name, role: u.role });
});

// Удалить пользователя
router.delete('/users/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Нельзя удалить себя' });
  db.get('users').remove({ id: Number(req.params.id) }).write();
  res.json({ ok: true });
});

// Сменить пароль
router.put('/change-password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.get('users').find({ id: req.user.id }).value();
  if (!user || !bcrypt.compareSync(current_password, user.password))
    return res.status(401).json({ error: 'Неверный текущий пароль' });
  if (!new_password || new_password.length < 4)
    return res.status(400).json({ error: 'Минимум 4 символа' });
  db.get('users').find({ id: req.user.id }).assign({ password: bcrypt.hashSync(new_password, 10) }).write();
  res.json({ ok: true });
});

module.exports = router;

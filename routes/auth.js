const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const SECRET = process.env.JWT_SECRET || 'deshthaus_secret_2026';

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.get('users').find({ email }).value();
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Неверный email или пароль' });
  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });
  if (db.get('users').find({ email }).value()) return res.status(409).json({ error: 'Email уже занят' });
  const id = Date.now();
  const hash = bcrypt.hashSync(password, 10);
  db.get('users').push({ id, name, email, password: hash, role: 'member' }).write();
  const token = jwt.sign({ id, name, role: 'member' }, SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id, name, email, role: 'member' } });
});

module.exports = router;

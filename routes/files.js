const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const files = db.get('files').value().map(f => ({
    ...f,
    project_name: f.project_id ? (db.get('projects').find({ id: f.project_id }).value() || {}).name : null
  }));
  res.json(files);
});

router.post('/upload', upload.array('files', 20), (req, res) => {
  const project_id = req.body.project_id ? Number(req.body.project_id) : null;
  const saved = req.files.map(file => {
    const sz = file.size > 1048576
      ? (file.size / 1048576).toFixed(1) + ' МБ'
      : (file.size / 1024).toFixed(0) + ' КБ';
    const f = {
      id: Date.now() + Math.random(),
      name: file.filename,
      original_name: file.originalname,
      size: sz,
      mime_type: file.mimetype,
      project_id,
      path: file.path,
      created_at: new Date().toISOString()
    };
    db.get('files').push(f).write();
    return f;
  });
  res.json(saved);
});

router.delete('/:id', (req, res) => {
  const f = db.get('files').find({ id: Number(req.params.id) }).value();
  if (f && fs.existsSync(f.path)) { try { fs.unlinkSync(f.path); } catch {} }
  db.get('files').remove({ id: Number(req.params.id) }).write();
  res.json({ ok: true });
});

module.exports = router;

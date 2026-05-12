const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../db/supabase');

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

router.get('/', async (req, res) => {
  const { data } = await supabase.from('files').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

router.post('/upload', upload.array('files', 20), async (req, res) => {
  const project_id = req.body.project_id || null;
  const saved = [];
  for (const file of req.files) {
    const sz = file.size > 1048576 ? (file.size/1048576).toFixed(1)+' МБ' : (file.size/1024).toFixed(0)+' КБ';
    const { data } = await supabase.from('files').insert({ name: file.filename, original_name: file.originalname, size: sz, mime_type: file.mimetype, project_id: project_id || null, path: file.path }).select().single();
    saved.push(data);
  }
  res.json(saved);
});

router.delete('/:id', async (req, res) => {
  const { data: f } = await supabase.from('files').select('path').eq('id', req.params.id).single();
  if (f?.path && fs.existsSync(f.path)) { try { fs.unlinkSync(f.path); } catch {} }
  await supabase.from('files').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const auth = require('./middleware/auth');

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/projects',      auth, require('./routes/projects'));
app.use('/api/clients',       auth, require('./routes/clients'));
app.use('/api/tasks',         auth, require('./routes/tasks'));
app.use('/api/files',         auth, require('./routes/files'));
app.use('/api/notifications', auth, require('./routes/notifications'));
app.use('/api/finance',       auth, require('./routes/finance'));
app.use('/api/stages',        auth, require('./routes/stages'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`\n✅ Deshthaus CRM запущен: http://localhost:${PORT}`);
});

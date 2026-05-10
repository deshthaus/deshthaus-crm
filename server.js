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

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/projects',      require('./middleware/auth'), require('./routes/projects'));
app.use('/api/clients',       require('./middleware/auth'), require('./routes/clients'));
app.use('/api/tasks',         require('./middleware/auth'), require('./routes/tasks'));
app.use('/api/files',         require('./middleware/auth'), require('./routes/files'));
app.use('/api/notifications', require('./middleware/auth'), require('./routes/notifications'));
app.use('/api/finance',       require('./middleware/auth'), require('./routes/finance'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`\n✅ Deshthaus CRM запущен: http://localhost:${PORT}`);
  console.log('   Остановить: Ctrl+C\n');
});

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function init() {
  console.log('🔧 Создаём таблицы...');

  // Users
  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      password TEXT,
      role TEXT DEFAULT 'member',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ` }).catch(() => {});

  // Clients
  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS clients (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'Частный',
      phone TEXT,
      email TEXT,
      budget FLOAT DEFAULT 0,
      budget_max FLOAT DEFAULT 0,
      color TEXT DEFAULT '#1a1f5e',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ` }).catch(() => {});

  // Projects
  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS projects (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      client_id BIGINT,
      client_name TEXT,
      status TEXT DEFAULT 'Дизайн',
      budget TEXT,
      deadline DATE,
      description TEXT,
      color TEXT DEFAULT '#1a1f5e',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ` }).catch(() => {});

  // Tasks
  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS tasks (
      id BIGSERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      project_id BIGINT,
      project_name TEXT,
      done BOOLEAN DEFAULT FALSE,
      due DATE,
      priority TEXT DEFAULT 'med',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ` }).catch(() => {});

  // Finance
  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS finance (
      id BIGSERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      amount FLOAT NOT NULL,
      type TEXT DEFAULT 'income',
      project_id BIGINT,
      project_name TEXT,
      date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ` }).catch(() => {});

  // Deals
  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS deals (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      client_id BIGINT,
      client_name TEXT,
      amount TEXT,
      stage TEXT DEFAULT 'Обращение',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ` }).catch(() => {});

  // Notifications
  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT,
      text TEXT,
      sub TEXT,
      type TEXT DEFAULT 'info',
      unread BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ` }).catch(() => {});

  // Files
  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS files (
      id BIGSERIAL PRIMARY KEY,
      name TEXT,
      original_name TEXT,
      size TEXT,
      mime_type TEXT,
      project_id BIGINT,
      path TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ` }).catch(() => {});

  // Check if admin exists
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    await supabase.from('users').insert({ name: 'Ануар Дешт', email: 'admin@deshthaus.kz', password: hash, role: 'admin' });
    console.log('✅ Создан admin: Ануар Дешт / admin123');
  } else {
    console.log('✅ Пользователи уже есть, данные не тронуты');
  }

  console.log('✅ База данных готова!');
}

init().catch(console.error);

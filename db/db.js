const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, '..', 'db.json'));
const db = low(adapter);

// Default structure
db.defaults({
  users: [],
  clients: [],
  projects: [],
  tasks: [],
  files: [],
  notifications: [],
  finance: [],
  deals: []
}).write();

module.exports = db;

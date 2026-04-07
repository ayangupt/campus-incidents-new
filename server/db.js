const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'incidents.db');

let db;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  try {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } catch {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('IT', 'Facility', 'Security', 'Other')),
    priority TEXT NOT NULL CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved')),
    admin_priority TEXT CHECK(admin_priority IN ('Low', 'Medium', 'High', 'Critical', NULL)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  saveDb();
  return db;
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

async function seedDb() {
  const db = await getDb();
  const result = db.exec('SELECT COUNT(*) as count FROM incidents');
  const count = result[0].values[0][0];

  if (count > 0) return;

  db.run(
    `INSERT INTO incidents (name, email, date, location, category, priority, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Alice Johnson',
      'alice@uchicago.edu',
      '2025-01-15',
      'Regenstein Library',
      'IT',
      'High',
      'WiFi connectivity drops frequently on the 3rd floor during peak hours.',
      'Open',
    ]
  );

  db.run(
    `INSERT INTO incidents (name, email, date, location, category, priority, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Bob Smith',
      'bob@uchicago.edu',
      '2025-01-20',
      'Harper Memorial Library',
      'Facility',
      'Medium',
      'Broken window latch in room 204 causing cold drafts.',
      'In Progress',
    ]
  );

  db.run(
    `INSERT INTO incidents (name, email, date, location, category, priority, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Carol Davis',
      'carol@uchicago.edu',
      '2025-02-01',
      'Ratner Athletics Center',
      'Security',
      'Critical',
      'Emergency exit door propped open and alarm disabled on south entrance.',
      'Open',
    ]
  );

  saveDb();
  console.log('Database seeded with 3 sample incidents.');
}

module.exports = { getDb, saveDb, seedDb };

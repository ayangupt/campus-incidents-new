const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const dbModulePath = require.resolve('../db');
const incidentsRoutePath = require.resolve('../routes/incidents');
const adminRoutePath = require.resolve('../routes/admin');

function createFakeDb(initialIncidents = []) {
  let incidents = initialIncidents.map((incident) => ({ ...incident }));
  let lastInsertId = incidents.reduce((max, item) => Math.max(max, item.id), 0);

  const db = {
    run(sql, params = []) {
      if (sql.includes('INSERT INTO incidents')) {
        lastInsertId += 1;
        incidents.push({
          id: lastInsertId,
          name: params[0],
          email: params[1],
          date: params[2],
          location: params[3],
          category: params[4],
          priority: params[5],
          description: params[6],
          status: 'Open',
          admin_priority: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        });
        return;
      }

      if (sql.startsWith('UPDATE incidents SET')) {
        const id = Number(params[params.length - 1]);
        const incident = incidents.find((item) => item.id === id);
        if (!incident) return;

        let index = 0;
        if (sql.includes('status = ?')) {
          incident.status = params[index];
          index += 1;
        }
        if (sql.includes('admin_priority = ?')) {
          incident.admin_priority = params[index];
        }
        incident.updated_at = '2026-01-01T00:00:01Z';
      }
    },

    exec(sql) {
      if (sql.includes('last_insert_rowid')) {
        return [{ values: [[lastInsertId]] }];
      }
      return [];
    },

    prepare(sql) {
      let rows = [];
      let currentIndex = -1;

      return {
        bind(params = []) {
          if (sql.startsWith('SELECT * FROM incidents WHERE id = ?')) {
            const found = incidents.find((item) => item.id === Number(params[0]));
            rows = found ? [found] : [];
            return;
          }

          if (sql.startsWith('SELECT id FROM incidents WHERE id = ?')) {
            const found = incidents.find((item) => item.id === Number(params[0]));
            rows = found ? [{ id: found.id }] : [];
            return;
          }

          if (sql.startsWith('SELECT * FROM incidents WHERE 1=1')) {
            let filtered = [...incidents];
            let paramIndex = 0;

            if (sql.includes('AND status = ?')) {
              const status = params[paramIndex];
              paramIndex += 1;
              filtered = filtered.filter((item) => item.status === status);
            }

            if (sql.includes('AND category = ?')) {
              const category = params[paramIndex];
              filtered = filtered.filter((item) => item.category === category);
            }

            const orderMatch = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)/i);
            if (orderMatch) {
              const column = orderMatch[1];
              const direction = orderMatch[2].toUpperCase();
              filtered.sort((a, b) => {
                if (a[column] === b[column]) return 0;
                if (direction === 'ASC') return a[column] > b[column] ? 1 : -1;
                return a[column] < b[column] ? 1 : -1;
              });
            }

            rows = filtered;
          }
        },

        step() {
          currentIndex += 1;
          return currentIndex < rows.length;
        },

        getAsObject() {
          return rows[currentIndex];
        },

        free() {},
      };
    },
  };

  return {
    db,
    getIncidents: () => incidents,
  };
}

function loadRoutesWithDb(fakeDb) {
  delete require.cache[incidentsRoutePath];
  delete require.cache[adminRoutePath];

  require.cache[dbModulePath] = {
    exports: {
      getDb: async () => fakeDb.db,
      saveDb: () => {},
    },
  };

  const incidentsRouter = require('../routes/incidents');
  const adminRouter = require('../routes/admin');

  const app = express();
  app.use(express.json());
  app.use('/api/incidents', incidentsRouter);
  app.use('/api/admin', adminRouter);

  return app;
}

function clearRouteCaches() {
  delete require.cache[incidentsRoutePath];
  delete require.cache[adminRoutePath];
  delete require.cache[dbModulePath];
}

test('POST /api/incidents returns 400 for missing fields', async () => {
  const fakeDb = createFakeDb();
  const app = loadRoutesWithDb(fakeDb);

  const response = await request(app).post('/api/incidents').send({
    name: 'Jane Doe',
    email: 'jane@uchicago.edu',
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /Missing required fields/);
  clearRouteCaches();
});

test('POST /api/incidents creates an incident with valid payload', async () => {
  const fakeDb = createFakeDb();
  const app = loadRoutesWithDb(fakeDb);

  const payload = {
    name: 'Jane Doe',
    email: 'jane@uchicago.edu',
    date: '2026-04-09',
    location: 'Regenstein Library',
    category: 'IT',
    priority: 'High',
    description: 'Projector stopped working',
  };

  const response = await request(app).post('/api/incidents').send(payload);

  assert.equal(response.status, 201);
  assert.equal(response.body.name, payload.name);
  assert.equal(response.body.priority, payload.priority);
  assert.equal(fakeDb.getIncidents().length, 1);
  clearRouteCaches();
});

test('GET /api/incidents supports status and category filtering', async () => {
  const fakeDb = createFakeDb([
    {
      id: 1,
      name: 'A',
      email: 'a@uchicago.edu',
      date: '2026-04-01',
      location: 'Location 1',
      category: 'IT',
      priority: 'Low',
      description: 'Desc 1',
      status: 'Open',
      admin_priority: null,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'B',
      email: 'b@uchicago.edu',
      date: '2026-04-02',
      location: 'Location 2',
      category: 'Facility',
      priority: 'Medium',
      description: 'Desc 2',
      status: 'Resolved',
      admin_priority: null,
      created_at: '2026-04-02T00:00:00Z',
      updated_at: '2026-04-02T00:00:00Z',
    },
  ]);
  const app = loadRoutesWithDb(fakeDb);

  const response = await request(app).get('/api/incidents?status=Open&category=IT');

  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].id, 1);
  clearRouteCaches();
});

test('POST /api/admin/login and PATCH /api/admin/incidents/:id requires auth and updates incident', async () => {
  process.env.ADMIN_PASSWORD = 'test-password';
  const fakeDb = createFakeDb([
    {
      id: 11,
      name: 'Student',
      email: 'student@uchicago.edu',
      date: '2026-04-03',
      location: 'Location 3',
      category: 'Security',
      priority: 'Critical',
      description: 'Desc 3',
      status: 'Open',
      admin_priority: null,
      created_at: '2026-04-03T00:00:00Z',
      updated_at: '2026-04-03T00:00:00Z',
    },
  ]);
  const app = loadRoutesWithDb(fakeDb);

  const unauthenticated = await request(app)
    .patch('/api/admin/incidents/11')
    .send({ status: 'Resolved' });
  assert.equal(unauthenticated.status, 401);

  const login = await request(app).post('/api/admin/login').send({ password: 'test-password' });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);

  const updated = await request(app)
    .patch('/api/admin/incidents/11')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({ status: 'Resolved', admin_priority: 'High' });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.status, 'Resolved');
  assert.equal(updated.body.admin_priority, 'High');
  clearRouteCaches();
});

test('PATCH /api/admin/incidents/:id validates status values', async () => {
  process.env.ADMIN_PASSWORD = 'test-password';
  const fakeDb = createFakeDb([
    {
      id: 20,
      name: 'Student',
      email: 'student@uchicago.edu',
      date: '2026-04-03',
      location: 'Location 4',
      category: 'Other',
      priority: 'Low',
      description: 'Desc 4',
      status: 'Open',
      admin_priority: null,
      created_at: '2026-04-03T00:00:00Z',
      updated_at: '2026-04-03T00:00:00Z',
    },
  ]);
  const app = loadRoutesWithDb(fakeDb);

  const login = await request(app).post('/api/admin/login').send({ password: 'test-password' });
  const response = await request(app)
    .patch('/api/admin/incidents/20')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({ status: 'NotAStatus' });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /Invalid status/);
  clearRouteCaches();
});

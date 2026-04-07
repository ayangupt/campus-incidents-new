'use strict';

jest.mock('../db');

const request = require('supertest');
const express = require('express');
const { getDb, saveDb } = require('../db');

// Build a minimal Express app that mounts the admin router.
// The app is created once and reused so the module-level validTokens set persists.
let app;
beforeAll(() => {
  process.env.ADMIN_PASSWORD = 'testpassword';
  app = express();
  app.use(express.json());
  const adminRoutes = require('./admin');
  app.use('/api/admin', adminRoutes);
});

// Helper: make a mock db with a controllable incident lookup
function makeMockDb({ incidentExists = true, incident = null } = {}) {
  const defaultIncident = {
    id: 1,
    name: 'Test User',
    email: 'test@uchicago.edu',
    date: '2025-01-01',
    location: 'Main Library',
    category: 'IT',
    priority: 'Medium',
    description: 'Test description',
    status: 'Open',
    admin_priority: null,
    created_at: '2025-01-01T00:00:00',
    updated_at: '2025-01-01T00:00:00',
  };

  return {
    run: jest.fn(),
    prepare: jest.fn().mockImplementation(() => {
      let stepCallCount = 0;
      return {
        bind: jest.fn(),
        // First call (existence check) returns incidentExists; second call (SELECT *) returns true
        step: jest.fn().mockImplementation(() => {
          stepCallCount += 1;
          return stepCallCount === 1 ? incidentExists : true;
        }),
        getAsObject: jest.fn().mockReturnValue(incident || defaultIncident),
        free: jest.fn(),
      };
    }),
  };
}

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    saveDb.mockImplementation(() => {});
  });

  test('returns 200 and a token with correct password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ password: 'testpassword' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  test('returns 401 with incorrect password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid password/);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/admin/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Password is required/);
  });

  test('token starts with "admin-token-"', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ password: 'testpassword' });
    expect(res.body.token).toMatch(/^admin-token-/);
  });
});

describe('PATCH /api/admin/incidents/:id', () => {
  let validToken;

  beforeEach(async () => {
    getDb.mockResolvedValue(makeMockDb());
    saveDb.mockImplementation(() => {});

    // Obtain a valid token for each test
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ password: 'testpassword' });
    validToken = loginRes.body.token;
  });

  test('returns 200 and updated incident when status is valid', async () => {
    const res = await request(app)
      .patch('/api/admin/incidents/1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'In Progress' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  test('returns 200 and updated incident when admin_priority is valid', async () => {
    const res = await request(app)
      .patch('/api/admin/incidents/1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ admin_priority: 'High' });
    expect(res.status).toBe(200);
  });

  test('returns 200 when both status and admin_priority are provided', async () => {
    const res = await request(app)
      .patch('/api/admin/incidents/1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'Resolved', admin_priority: 'Critical' });
    expect(res.status).toBe(200);
  });

  test('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .patch('/api/admin/incidents/1')
      .send({ status: 'Open' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Authorization token required/);
  });

  test('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .patch('/api/admin/incidents/1')
      .set('Authorization', 'Bearer invalid-token')
      .send({ status: 'Open' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid or expired token/);
  });

  test('returns 400 when neither status nor admin_priority is provided', async () => {
    const res = await request(app)
      .patch('/api/admin/incidents/1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/At least one of/);
  });

  test('returns 400 for invalid status value', async () => {
    const res = await request(app)
      .patch('/api/admin/incidents/1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'NotAStatus' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid status/);
  });

  test('returns 400 for invalid admin_priority value', async () => {
    const res = await request(app)
      .patch('/api/admin/incidents/1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ admin_priority: 'Extreme' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid admin_priority/);
  });

  test('returns 404 when incident does not exist', async () => {
    getDb.mockResolvedValue(makeMockDb({ incidentExists: false }));
    const res = await request(app)
      .patch('/api/admin/incidents/999')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'Open' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Incident not found/);
  });

  test('accepts all valid status values', async () => {
    for (const status of ['Open', 'In Progress', 'Resolved']) {
      getDb.mockResolvedValue(makeMockDb());
      const res = await request(app)
        .patch('/api/admin/incidents/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ status });
      expect(res.status).toBe(200);
    }
  });

  test('accepts all valid admin_priority values', async () => {
    for (const admin_priority of ['Low', 'Medium', 'High', 'Critical']) {
      getDb.mockResolvedValue(makeMockDb());
      const res = await request(app)
        .patch('/api/admin/incidents/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ admin_priority });
      expect(res.status).toBe(200);
    }
  });
});

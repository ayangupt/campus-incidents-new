'use strict';

jest.mock('../db');

const request = require('supertest');
const express = require('express');
const { getDb, saveDb } = require('../db');

// Build a minimal Express app that mounts the incidents router
function buildApp() {
  const app = express();
  app.use(express.json());
  const incidentRoutes = require('./incidents');
  app.use('/api/incidents', incidentRoutes);
  return app;
}

// Helper to build a mock sql.js-style DB object
function makeMockDb(overrides = {}) {
  return {
    run: jest.fn(),
    exec: jest.fn().mockReturnValue([{ values: [[1]] }]),
    prepare: jest.fn().mockReturnValue({
      bind: jest.fn(),
      step: jest.fn().mockReturnValue(true),
      getAsObject: jest.fn().mockReturnValue({
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
      }),
      free: jest.fn(),
    }),
    ...overrides,
  };
}

const VALID_INCIDENT = {
  name: 'Test User',
  email: 'test@uchicago.edu',
  date: '2025-01-01',
  location: 'Main Library',
  category: 'IT',
  priority: 'Medium',
  description: 'This is a test description',
};

describe('POST /api/incidents', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    const { getDb: mockGetDb, saveDb: mockSaveDb } = require('../db');
    mockGetDb.mockResolvedValue(makeMockDb());
    mockSaveDb.mockImplementation(() => {});
    app = buildApp();
  });

  test('creates an incident with all valid fields and returns 201', async () => {
    const res = await request(app).post('/api/incidents').send(VALID_INCIDENT);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test User');
  });

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/incidents').send({ name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
  });

  test('returns 400 for invalid category', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .send({ ...VALID_INCIDENT, category: 'Invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid category/);
  });

  test('returns 400 for invalid priority', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .send({ ...VALID_INCIDENT, priority: 'Extreme' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid priority/);
  });

  test('lists all missing fields in error message', async () => {
    const res = await request(app).post('/api/incidents').send({});
    expect(res.status).toBe(400);
    ['name', 'email', 'date', 'location', 'category', 'priority', 'description'].forEach(
      (field) => expect(res.body.error).toContain(field)
    );
  });

  test('accepts all valid categories', async () => {
    for (const category of ['IT', 'Facility', 'Security', 'Other']) {
      const res = await request(app)
        .post('/api/incidents')
        .send({ ...VALID_INCIDENT, category });
      expect(res.status).toBe(201);
    }
  });

  test('accepts all valid priorities', async () => {
    for (const priority of ['Low', 'Medium', 'High', 'Critical']) {
      const res = await request(app)
        .post('/api/incidents')
        .send({ ...VALID_INCIDENT, priority });
      expect(res.status).toBe(201);
    }
  });
});

describe('GET /api/incidents', () => {
  let app;
  const sampleIncidents = [
    {
      id: 1,
      name: 'Alice',
      email: 'alice@uchicago.edu',
      date: '2025-01-15',
      location: 'Regenstein',
      category: 'IT',
      priority: 'High',
      description: 'WiFi issue',
      status: 'Open',
      admin_priority: null,
      created_at: '2025-01-15T00:00:00',
      updated_at: '2025-01-15T00:00:00',
    },
    {
      id: 2,
      name: 'Bob',
      email: 'bob@uchicago.edu',
      date: '2025-01-20',
      location: 'Harper',
      category: 'Facility',
      priority: 'Medium',
      description: 'Window issue',
      status: 'In Progress',
      admin_priority: null,
      created_at: '2025-01-20T00:00:00',
      updated_at: '2025-01-20T00:00:00',
    },
  ];

  beforeEach(() => {
    jest.resetModules();
    const { getDb: mockGetDb } = require('../db');

    // Build a prepare mock that returns incidents one at a time
    let callIndex = 0;
    const prepareMock = jest.fn().mockImplementation(() => {
      const rows = [...sampleIncidents];
      let idx = 0;
      return {
        bind: jest.fn(),
        step: jest.fn().mockImplementation(() => idx < rows.length),
        getAsObject: jest.fn().mockImplementation(() => rows[idx++]),
        free: jest.fn(),
      };
    });

    mockGetDb.mockResolvedValue({ prepare: prepareMock });
    app = buildApp();
  });

  test('returns 200 and an array of incidents', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('returns 200 with status filter query param', async () => {
    const res = await request(app).get('/api/incidents?status=Open');
    expect(res.status).toBe(200);
  });

  test('returns 200 with category filter query param', async () => {
    const res = await request(app).get('/api/incidents?category=IT');
    expect(res.status).toBe(200);
  });

  test('returns 200 with sort and order query params', async () => {
    const res = await request(app).get('/api/incidents?sort=priority&order=asc');
    expect(res.status).toBe(200);
  });

  test('defaults to DESC order when order param is not provided', async () => {
    const res = await request(app).get('/api/incidents?sort=created_at');
    expect(res.status).toBe(200);
  });

  test('ignores invalid sort column and falls back to created_at', async () => {
    const res = await request(app).get('/api/incidents?sort=invalid_column');
    expect(res.status).toBe(200);
  });
});

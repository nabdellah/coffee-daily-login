// Must be set before any import that touches db.js
process.env.DATABASE_PATH = ':memory:';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/server.js';
import db from '../src/db.js';

const validEntry = {
  date: '2026-06-09',
  shop_name: 'Brew & Co',
  sales: 420.50,
  customers: 37
};

test('POST /api/log - happy path creates entry and returns id', async () => {
  const res = await request(app)
    .post('/api/log')
    .send(validEntry)
    .set('Content-Type', 'application/json');

  assert.equal(res.status, 201);
  assert.ok(typeof res.body.id === 'number' && res.body.id > 0, 'id should be a positive number');
});

test('POST /api/log - rejects invalid input with 400', async () => {
  const res = await request(app)
    .post('/api/log')
    .send({ date: '2026-06-09', shop_name: 'The Grind', sales: 'not-a-number' })
    .set('Content-Type', 'application/json');

  assert.equal(res.status, 400);
  assert.ok(typeof res.body.error === 'string' && res.body.error.length > 0, 'error message should be present');
});

test('GET /api/summary - returns correct aggregated totals', async () => {
  // Insert two rows directly via db for a clean, isolated setup
  const insert = db.prepare(
    'INSERT INTO daily_log (date, shop_name, sales, customers) VALUES (?, ?, ?, ?)'
  );
  insert.run('2026-06-01', 'The Grind', 200.00, 20);
  insert.run('2026-06-02', 'The Grind', 150.50, 15);

  const res = await request(app).get('/api/summary');

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body), 'response should be an array');

  const shop = res.body.find(r => r.shop_name === 'The Grind');
  assert.ok(shop, 'The Grind shop should be present');
  assert.equal(shop.entry_count, 2);
  assert.ok(
    Math.abs(shop.total_sales - 350.50) < 0.001,
    `total_sales should be 350.50, got ${shop.total_sales}`
  );
});

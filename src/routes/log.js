import { Router } from 'express';
import db from '../db.js';

const router = Router();

const insertStmt = db.prepare(
  'INSERT INTO daily_log (date, shop_name, sales, customers) VALUES (?, ?, ?, ?)'
);
const updateStmt = db.prepare(
  'UPDATE daily_log SET date=?, shop_name=?, sales=?, customers=? WHERE id=?'
);
const deleteStmt = db.prepare('DELETE FROM daily_log WHERE id=?');

const entriesStmt = db.prepare(
  'SELECT id, date, shop_name, sales, customers FROM daily_log ORDER BY date DESC, id DESC'
);
const summaryStmt = db.prepare(`
  SELECT
    shop_name,
    SUM(sales)     AS total_sales,
    SUM(customers) AS total_customers,
    COUNT(*)       AS entry_count
  FROM daily_log
  GROUP BY shop_name
  ORDER BY shop_name ASC
`);

function validateFields(body) {
  const { date, shop_name, sales, customers } = body ?? {};
  const dateValid = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const shopValid = typeof shop_name === 'string' && shop_name.trim().length > 0;
  const salesValid = typeof sales === 'number' && Number.isFinite(sales) && sales >= 0;
  const customersValid = Number.isInteger(customers) && customers >= 0;
  return { valid: dateValid && shopValid && salesValid && customersValid, date, shop_name, sales, customers };
}

router.post('/log', (req, res) => {
  const { valid, date, shop_name, sales, customers } = validateFields(req.body);
  if (!valid) return res.status(400).json({
    error: 'Missing or invalid fields: date (YYYY-MM-DD), shop_name (string), sales (number ≥ 0), customers (integer ≥ 0) are all required'
  });
  const result = insertStmt.run(date, shop_name.trim(), sales, customers);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/log/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const { valid, date, shop_name, sales, customers } = validateFields(req.body);
  if (!valid) return res.status(400).json({
    error: 'Missing or invalid fields: date (YYYY-MM-DD), shop_name (string), sales (number ≥ 0), customers (integer ≥ 0) are all required'
  });
  const result = updateStmt.run(date, shop_name.trim(), sales, customers, id);
  if (result.changes === 0) return res.status(404).json({ error: 'Entry not found' });
  res.json({ ok: true });
});

router.delete('/log/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const result = deleteStmt.run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Entry not found' });
  res.status(204).end();
});

router.get('/entries', (_req, res) => {
  res.json(entriesStmt.all());
});

router.get('/summary', (_req, res) => {
  res.json(summaryStmt.all());
});

export default router;

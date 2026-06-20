import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { runDailyIngest } from './ingest.js';
import { federalBillStore, louisianaBillStore, findBillById } from './store.js';

export const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/clear-cache', (_req, res) => {
  federalBillStore.length = 0;
  louisianaBillStore.length = 0;

  const dataDir = path.resolve(process.cwd(), 'data');
  const federalFile = path.join(dataDir, 'federal.json');
  const louisianaFile = path.join(dataDir, 'louisiana.json');

  try {
    if (fs.existsSync(federalFile)) fs.unlinkSync(federalFile);
    if (fs.existsSync(louisianaFile)) fs.unlinkSync(louisianaFile);
  } catch (error) {
    console.error('Failed to delete cache files:', error);
  }

  res.json({ success: true, message: 'Cache and persistent files cleared' });
});

router.post('/ingest/daily', async (req, res) => {
  const token = req.headers['x-ingest-token'];
  if (token !== process.env.INGEST_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const ingestSummary = await runDailyIngest();
    return res.json({ success: true, ingest: ingestSummary });
  } catch (error) {
    console.error('Daily ingest error', error);
    return res.status(500).json({ error: 'Ingest failed', details: error instanceof Error ? error.message : String(error) });
  }
});

router.get('/federal', (_req, res) => {
  res.json({ bills: federalBillStore, count: federalBillStore.length });
});

router.get('/louisiana', (_req, res) => {
  res.json({ bills: louisianaBillStore, count: louisianaBillStore.length });
});

router.get('/bills', (_req, res) => {
  const allBills = [...federalBillStore, ...louisianaBillStore];
  res.json({
    bills: allBills.map(bill => ({
      ...bill,
      scope: bill.source  // map 'source' to 'scope' for dashboard compatibility
    })),
    count: allBills.length,
    federal: federalBillStore.length,
    louisiana: louisianaBillStore.length
  });
});

router.get('/bills/:id', (req, res) => {
  const bill = findBillById(req.params.id);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }
  res.json({ bill });
});

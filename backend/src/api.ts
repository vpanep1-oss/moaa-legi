import express from 'express';
import { runDailyIngest } from './ingest.js';
import { federalBillStore, louisianaBillStore, findBillById } from './store.js';

export const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.post('/ingest/daily', async (req, res) => {
  const token = req.headers['x-ingest-token'];
  if (token !== process.env.INGEST_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await runDailyIngest();
    return res.json({ success: true });
  } catch (error) {
    console.error('Daily ingest error', error);
    return res.status(500).json({ error: 'Ingest failed' });
  }
});

router.get('/federal', (_req, res) => {
  res.json({ bills: federalBillStore, count: federalBillStore.length });
});

router.get('/louisiana', (_req, res) => {
  res.json({ bills: louisianaBillStore, count: louisianaBillStore.length });
});

router.get('/bills/:id', (req, res) => {
  const bill = findBillById(req.params.id);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }
  res.json({ bill });
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as apiRouter } from './api.js';
import { runDailyIngest } from './ingest.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: ['https://vpanep1-oss.github.io', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use('/api', apiRouter);

app.get('/', (_req, res) => {
  res.send('LCOC MOAA Legislative Dashboard API is running');
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

if (process.env.RUN_INGEST_ON_START === 'true') {
  runDailyIngest().catch((error: unknown) => {
    console.error('Daily ingest failed on startup', error);
  });
}

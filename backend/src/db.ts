import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL ?? 'postgres://localhost:5432/lcodashboard';
export const pool = new Pool({ connectionString });

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

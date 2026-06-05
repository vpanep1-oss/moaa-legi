import fs from 'node:fs';
import path from 'node:path';
import type { Bill } from './models/bill.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const FEDERAL_FILE = path.join(DATA_DIR, 'federal.json');
const LOUISIANA_FILE = path.join(DATA_DIR, 'louisiana.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadFederalBills(): Bill[] {
  try {
    ensureDataDir();
    if (fs.existsSync(FEDERAL_FILE)) {
      const data = fs.readFileSync(FEDERAL_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load federal bills from file:', error);
  }
  return [];
}

export function loadLouisianaBills(): Bill[] {
  try {
    ensureDataDir();
    if (fs.existsSync(LOUISIANA_FILE)) {
      const data = fs.readFileSync(LOUISIANA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load Louisiana bills from file:', error);
  }
  return [];
}

export function saveFederalBills(bills: Bill[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(FEDERAL_FILE, JSON.stringify(bills, null, 2));
    console.log(`Saved ${bills.length} federal bills to file`);
  } catch (error) {
    console.error('Failed to save federal bills to file:', error);
  }
}

export function saveLouisianaBills(bills: Bill[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(LOUISIANA_FILE, JSON.stringify(bills, null, 2));
    console.log(`Saved ${bills.length} Louisiana bills to file`);
  } catch (error) {
    console.error('Failed to save Louisiana bills to file:', error);
  }
}

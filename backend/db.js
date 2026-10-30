import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const databasePath = path.join(dataDir, 'smartfarm.db');
export const db = new Database(databasePath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const schema = `
CREATE TABLE IF NOT EXISTS crops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_name TEXT NOT NULL UNIQUE
    CHECK (crop_name IN ('Tomato','Lettuce','Wheat','Maize')),
  location TEXT NOT NULL,
  target_min REAL NOT NULL CHECK (target_min >= 0 AND target_min <= 100),
  target_max REAL NOT NULL CHECK (target_max >= 0 AND target_max <= 100),
  normal_water REAL NOT NULL CHECK (normal_water > 0 AND normal_water <= 10000),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (target_min < target_max)
);
`;

db.exec(schema);

const count = db.prepare('SELECT COUNT(*) AS count FROM crops').get().count;

if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO crops (crop_name, location, target_min, target_max, normal_water, notes)
    VALUES (@crop_name, @location, @target_min, @target_max, @normal_water, @notes)
  `);

  const seed = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  seed([
    {
      crop_name: 'Tomato',
      location: 'Greenhouse A',
      target_min: 55,
      target_max: 75,
      normal_water: 500,
      notes: ''
    },
    {
      crop_name: 'Lettuce',
      location: 'Greenhouse B',
      target_min: 60,
      target_max: 80,
      normal_water: 400,
      notes: ''
    },
    {
      crop_name: 'Wheat',
      location: 'North Field',
      target_min: 35,
      target_max: 55,
      normal_water: 300,
      notes: ''
    }
  ]);
}

export function getAllCrops() {
  return db.prepare('SELECT * FROM crops ORDER BY id ASC').all();
}

export function getCropById(id) {
  return db.prepare('SELECT * FROM crops WHERE id = ?').get(id) ?? null;
}

export function createCrop(crop) {
  const result = db.prepare(`
    INSERT INTO crops (crop_name, location, target_min, target_max, normal_water, notes)
    VALUES (@crop_name, @location, @target_min, @target_max, @normal_water, @notes)
  `).run(crop);
  return getCropById(result.lastInsertRowid);
}

export function updateCrop(id, crop) {
  db.prepare(`
    UPDATE crops
    SET location = @location,
        target_min = @target_min,
        target_max = @target_max,
        normal_water = @normal_water,
        notes = @notes
    WHERE id = @id
  `).run({ id, ...crop });
  return getCropById(id);
}

export function deleteCrop(id) {
  const result = db.prepare('DELETE FROM crops WHERE id = ?').run(id);
  return result.changes > 0;
}

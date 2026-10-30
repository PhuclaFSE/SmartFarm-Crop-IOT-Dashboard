import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sensorPath = path.join(__dirname, 'data', 'sensor-readings.json');

export const ALLOWED_CROPS = ['Tomato', 'Lettuce', 'Wheat', 'Maize'];
const ALLOWED_STATUSES = ['Online', 'Offline', 'Faulty'];
const REQUIRED_FIELDS = [
  'crop_name',
  'timestamp',
  'soil_moisture',
  'temperature',
  'rainfall',
  'sensor_status',
  'notes'
].sort();

export class SensorDataError extends Error {
  constructor(message = 'Sensor data file is invalid') {
    super(message);
    this.name = 'SensorDataError';
  }
}

function hasExactFields(reading) {
  const keys = Object.keys(reading).sort();
  return keys.length === REQUIRED_FIELDS.length && keys.every((key, index) => key === REQUIRED_FIELDS[index]);
}

function isStrictTimestamp(value) {
  if (typeof value !== 'string') return false;
  const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  if (!pattern.test(value)) return false;

  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);

  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  );
}

export function validateSensorReadings(readings) {
  if (!Array.isArray(readings) || readings.length !== 20) {
    throw new SensorDataError();
  }

  const cropCounts = Object.fromEntries(ALLOWED_CROPS.map((crop) => [crop, 0]));
  const seenTimestamps = Object.fromEntries(ALLOWED_CROPS.map((crop) => [crop, new Set()]));

  for (const reading of readings) {
    if (!reading || typeof reading !== 'object' || Array.isArray(reading) || !hasExactFields(reading)) {
      throw new SensorDataError();
    }

    if (typeof reading.crop_name !== 'string' || !ALLOWED_CROPS.includes(reading.crop_name)) {
      throw new SensorDataError();
    }

    if (!isStrictTimestamp(reading.timestamp)) {
      throw new SensorDataError();
    }

    if (
      typeof reading.soil_moisture !== 'number' || !Number.isFinite(reading.soil_moisture) ||
      typeof reading.temperature !== 'number' || !Number.isFinite(reading.temperature) ||
      typeof reading.rainfall !== 'number' || !Number.isFinite(reading.rainfall)
    ) {
      throw new SensorDataError();
    }

    if (typeof reading.sensor_status !== 'string' || !ALLOWED_STATUSES.includes(reading.sensor_status)) {
      throw new SensorDataError();
    }

    if (typeof reading.notes !== 'string') {
      throw new SensorDataError();
    }

    cropCounts[reading.crop_name] += 1;

    if (seenTimestamps[reading.crop_name].has(reading.timestamp)) {
      throw new SensorDataError();
    }
    seenTimestamps[reading.crop_name].add(reading.timestamp);
  }

  if (ALLOWED_CROPS.some((crop) => cropCounts[crop] !== 5)) {
    throw new SensorDataError();
  }

  return readings;
}

export function loadAndValidateSensorReadings() {
  try {
    const raw = fs.readFileSync(sensorPath, 'utf8');
    const readings = JSON.parse(raw);
    return validateSensorReadings(readings);
  } catch (error) {
    if (error instanceof SensorDataError) throw error;
    throw new SensorDataError();
  }
}

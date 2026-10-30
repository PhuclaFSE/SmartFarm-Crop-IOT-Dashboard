import express from 'express';
import cors from 'cors';
import {
  createCrop,
  deleteCrop,
  getAllCrops,
  getCropById,
  updateCrop
} from './db.js';
import {
  loadAndValidateSensorReadings,
  SensorDataError
} from './sensorService.js';
import {
  validateCreateBody,
  validateUpdateBody,
  ValidationError
} from './validation.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

app.get('/api/crops', (req, res, next) => {
  try {
    res.status(200).json(getAllCrops());
  } catch (error) {
    next(error);
  }
});

app.get('/api/crops/:id', (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'id must be a positive integer' });

    const crop = getCropById(id);
    if (!crop) return res.status(404).json({ error: 'Crop card not found' });

    res.status(200).json(crop);
  } catch (error) {
    next(error);
  }
});

app.post('/api/crops', (req, res, next) => {
  try {
    const payload = validateCreateBody(req.body);

    const readings = loadAndValidateSensorReadings();
    const validCropName = readings.some((reading) => reading.crop_name === payload.crop_name);
    if (!validCropName) {
      return res.status(400).json({ error: 'crop_name does not exist in sensor data' });
    }

    const crop = createCrop(payload);
    res.status(201).json(crop);
  } catch (error) {
    next(error);
  }
});

app.put('/api/crops/:id', (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'id must be a positive integer' });

    const existing = getCropById(id);
    if (!existing) return res.status(404).json({ error: 'Crop card not found' });

    const payload = validateUpdateBody(req.body, existing.crop_name);
    const updated = updateCrop(id, payload);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/crops/:id', (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'id must be a positive integer' });

    const existing = getCropById(id);
    if (!existing) return res.status(404).json({ error: 'Crop card not found' });

    deleteCrop(id);
    res.status(200).json({ deleted: true, id });
  } catch (error) {
    next(error);
  }
});

app.get('/api/readings', (req, res, next) => {
  try {
    const readings = loadAndValidateSensorReadings();
    res.status(200).json(readings);
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }

  if (error instanceof SensorDataError) {
    return res.status(500).json({ error: 'Sensor data file is invalid' });
  }

  if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE' || String(error?.message).includes('UNIQUE constraint failed: crops.crop_name')) {
    return res.status(409).json({ error: 'crop_name already exists' });
  }

  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`SmartFarm backend running at http://localhost:${PORT}`);
});

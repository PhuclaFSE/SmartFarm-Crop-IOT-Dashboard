import { loadAndValidateSensorReadings } from '../sensorService.js';

const readings = loadAndValidateSensorReadings();
const counts = readings.reduce((acc, reading) => {
  acc[reading.crop_name] = (acc[reading.crop_name] ?? 0) + 1;
  return acc;
}, {});

console.log('Sensor file is structurally valid.');
console.log(`Total readings: ${readings.length}`);
console.table(counts);

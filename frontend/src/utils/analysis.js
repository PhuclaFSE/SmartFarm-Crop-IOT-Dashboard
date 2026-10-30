export function getAvailableCropNames(readings, crops) {
  const used = new Set(crops.map((crop) => crop.crop_name));
  return [...new Set(readings.map((reading) => reading.crop_name))]
    .filter((name) => !used.has(name))
    .sort((a, b) => a.localeCompare(b));
}

export function getLatestReading(cropName, readings) {
  const matches = readings.filter((reading) => reading.crop_name === cropName);
  return [...matches].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] ?? null;
}

export function analyseCrop(cropCard, reading) {
  if (!reading) {
    return {
      condition: 'N/A',
      recommended_water: 'N/A',
      alerts: [],
      action: 'N/A',
      invalid_fields: []
    };
  }

  if (reading.sensor_status === 'Offline' || reading.sensor_status === 'Faulty') {
    return {
      condition: 'Sensor Problem',
      recommended_water: 'N/A',
      alerts: ['Check sensor'],
      action: 'Check sensor',
      invalid_fields: []
    };
  }

  const invalidFields = [];
  if (reading.soil_moisture < 0 || reading.soil_moisture > 100) invalidFields.push('soil_moisture');
  if (reading.temperature < 0 || reading.temperature > 50) invalidFields.push('temperature');
  if (reading.rainfall < 0 || reading.rainfall > 50) invalidFields.push('rainfall');

  if (invalidFields.length > 0) {
    return {
      condition: 'Invalid Data',
      recommended_water: 'N/A',
      alerts: [`Invalid field: ${invalidFields.join(', ')}`],
      action: 'Check reading',
      invalid_fields: invalidFields
    };
  }

  let condition;
  let recommended_water;
  let action;

  if (reading.soil_moisture < cropCard.target_min) {
    condition = 'Dry';
    recommended_water = cropCard.normal_water;
    action = 'Water crop';
  } else if (reading.soil_moisture <= cropCard.target_max) {
    condition = 'Healthy';
    recommended_water = 0;
    action = 'Monitor';
  } else {
    condition = 'Too Wet';
    recommended_water = 0;
    action = 'Stop watering';
  }

  const alerts = [];
  if (reading.temperature > 35) alerts.push('High temperature');
  if (reading.rainfall >= 5) alerts.push('Rain detected');

  return {
    condition,
    recommended_water,
    alerts,
    action,
    invalid_fields: []
  };
}

export function buildDashboardResults(crops, readings, sensorAvailable) {
  return crops.map((crop) => {
    const latest_reading = sensorAvailable ? getLatestReading(crop.crop_name, readings) : null;
    const analysis = analyseCrop(crop, latest_reading);
    return {
      crop,
      latest_reading,
      ...analysis
    };
  });
}

export function calculateFarmStatus(results, sensorAvailable) {
  if (results.length === 0) return 'No Crops';
  if (!sensorAvailable) return 'Sensor Feed Unavailable';

  if (results.some((result) => ['Sensor Problem', 'Invalid Data'].includes(result.condition))) {
    return 'Critical';
  }

  const needsWatch = results.some(
    (result) =>
      ['Dry', 'Too Wet'].includes(result.condition) ||
      result.alerts.includes('High temperature')
  );

  return needsWatch ? 'Watch' : 'Normal';
}

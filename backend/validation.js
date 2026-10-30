export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(body, field, { max, optional = false } = {}) {
  const value = body[field];

  if (value === undefined && optional) return '';
  if (typeof value !== 'string') throw new ValidationError(`${field} is required`);

  const trimmed = value.trim();
  if (!optional && trimmed.length === 0) throw new ValidationError(`${field} is required`);
  if (max && trimmed.length > max) throw new ValidationError(`${field} must be at most ${max} characters`);
  return trimmed;
}

function requireNumber(body, field) {
  const value = body[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${field} must be a number`);
  }
  return value;
}

export function validateCreateBody(body) {
  if (!isPlainObject(body)) throw new ValidationError('Request body must be a JSON object');

  const crop_name = requireString(body, 'crop_name', { max: 100 });
  const location = requireString(body, 'location', { max: 100 });
  const target_min = requireNumber(body, 'target_min');
  const target_max = requireNumber(body, 'target_max');
  const normal_water = requireNumber(body, 'normal_water');
  const notes = body.notes === undefined ? '' : requireString(body, 'notes', { max: 500, optional: true });

  if (target_min < 0 || target_min > 100) throw new ValidationError('target_min must be between 0 and 100');
  if (target_max < 0 || target_max > 100) throw new ValidationError('target_max must be between 0 and 100');
  if (target_min >= target_max) throw new ValidationError('target_min must be less than target_max');
  if (normal_water <= 0 || normal_water > 10000) throw new ValidationError('normal_water must be greater than 0 and at most 10000');

  return { crop_name, location, target_min, target_max, normal_water, notes };
}

export function validateUpdateBody(body, existingCropName) {
  if (!isPlainObject(body)) throw new ValidationError('Request body must be a JSON object');

  if (body.crop_name !== undefined) {
    if (typeof body.crop_name !== 'string') throw new ValidationError('crop_name cannot be changed');
    if (body.crop_name !== existingCropName) throw new ValidationError('crop_name cannot be changed');
  }

  const location = requireString(body, 'location', { max: 100 });
  const target_min = requireNumber(body, 'target_min');
  const target_max = requireNumber(body, 'target_max');
  const normal_water = requireNumber(body, 'normal_water');
  const notes = body.notes === undefined ? '' : requireString(body, 'notes', { max: 500, optional: true });

  if (target_min < 0 || target_min > 100) throw new ValidationError('target_min must be between 0 and 100');
  if (target_max < 0 || target_max > 100) throw new ValidationError('target_max must be between 0 and 100');
  if (target_min >= target_max) throw new ValidationError('target_min must be less than target_max');
  if (normal_water <= 0 || normal_water > 10000) throw new ValidationError('normal_water must be greater than 0 and at most 10000');

  return { location, target_min, target_max, normal_water, notes };
}

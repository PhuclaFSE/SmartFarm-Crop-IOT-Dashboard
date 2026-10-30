const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error('Unable to connect to the backend');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || 'Request failed');
  }

  return payload;
}

export const api = {
  getCrops: () => request('/crops'),
  getCrop: (id) => request(`/crops/${id}`),
  createCrop: (body) => request('/crops', { method: 'POST', body: JSON.stringify(body) }),
  updateCrop: (id, body) => request(`/crops/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCrop: (id) => request(`/crops/${id}`, { method: 'DELETE' }),
  getReadings: () => request('/readings')
};

import { useEffect, useState } from 'react';

const initialState = {
  crop_name: '',
  location: '',
  target_min: '',
  target_max: '',
  normal_water: '',
  notes: ''
};

function validate(values, isEdit) {
  if (!isEdit && !values.crop_name) return 'Select a crop name.';
  if (!values.location.trim() || values.location.trim().length > 100) return 'Location must be 1 to 100 characters.';
  if (values.target_min === '' || values.target_max === '') return 'Target moisture values are required.';

  const min = Number(values.target_min);
  const max = Number(values.target_max);
  const water = Number(values.normal_water);

  if (!Number.isFinite(min) || min < 0 || min > 100) return 'Target minimum must be between 0 and 100.';
  if (!Number.isFinite(max) || max < 0 || max > 100) return 'Target maximum must be between 0 and 100.';
  if (min >= max) return 'Target minimum must be less than target maximum.';
  if (values.normal_water === '' || !Number.isFinite(water) || water <= 0 || water > 10000) {
    return 'Normal water must be greater than 0 and at most 10000 litres.';
  }
  if (values.notes.length > 500) return 'Notes must be at most 500 characters.';
  return null;
}

export default function CropForm({ mode, crop, availableNames, onSubmit, onClose, busy }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState(initialState);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && crop) {
      setValues({
        crop_name: crop.crop_name,
        location: crop.location,
        target_min: String(crop.target_min),
        target_max: String(crop.target_max),
        normal_water: String(crop.normal_water),
        notes: crop.notes || ''
      });
    } else {
      setValues({ ...initialState, crop_name: availableNames[0] || '' });
    }
    setError('');
  }, [isEdit, crop, availableNames]);

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate(values, isEdit);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      crop_name: values.crop_name,
      location: values.location.trim(),
      target_min: Number(values.target_min),
      target_max: Number(values.target_max),
      normal_water: Number(values.normal_water),
      notes: values.notes.trim()
    };

    try {
      setError('');
      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose();
    }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="crop-form-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Crop Card</p>
            <h2 id="crop-form-title">{isEdit ? `Edit ${crop.crop_name}` : 'Add Crop Card'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        </div>

        {error && <div className="feedback feedback-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="crop-form">
          <label>
            Crop name
            {isEdit ? (
              <input value={values.crop_name} readOnly className="read-only" />
            ) : (
              <select value={values.crop_name} onChange={(e) => setField('crop_name', e.target.value)} required>
                {availableNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            )}
          </label>

          <label>
            Location
            <input value={values.location} maxLength={100} onChange={(e) => setField('location', e.target.value)} required />
          </label>

          <div className="form-row">
            <label>
              Target minimum (%)
              <input type="number" min="0" max="100" step="0.1" value={values.target_min} onChange={(e) => setField('target_min', e.target.value)} required />
            </label>
            <label>
              Target maximum (%)
              <input type="number" min="0" max="100" step="0.1" value={values.target_max} onChange={(e) => setField('target_max', e.target.value)} required />
            </label>
          </div>

          <label>
            Normal water (L)
            <input type="number" min="0.1" max="10000" step="0.1" value={values.normal_water} onChange={(e) => setField('normal_water', e.target.value)} required />
          </label>

          <label>
            Notes <span className="optional">optional</span>
            <textarea value={values.notes} maxLength={500} rows="4" onChange={(e) => setField('notes', e.target.value)} />
            <small>{values.notes.length}/500</small>
          </label>

          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="button primary" disabled={busy}>
              {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Crop Card'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

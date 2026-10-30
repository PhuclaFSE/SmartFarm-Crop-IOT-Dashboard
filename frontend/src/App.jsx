import { useEffect, useMemo, useState } from 'react';
import { api } from './services/api.js';
import {
  buildDashboardResults,
  calculateFarmStatus,
  getAvailableCropNames
} from './utils/analysis.js';
import SummaryBar from './components/SummaryBar.jsx';
import CropCard from './components/CropCard.jsx';
import CropForm from './components/CropForm.jsx';
import SensorHistory from './components/SensorHistory.jsx';
import FeedbackBanner from './components/FeedbackBanner.jsx';

export default function App() {
  const [crops, setCrops] = useState([]);
  const [readings, setReadings] = useState([]);
  const [cropsLoading, setCropsLoading] = useState(true);
  const [cropsError, setCropsError] = useState('');
  const [sensorLoading, setSensorLoading] = useState(true);
  const [sensorHasSucceeded, setSensorHasSucceeded] = useState(false);
  const [sensorError, setSensorError] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [formState, setFormState] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [historyCrop, setHistoryCrop] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  async function loadCrops() {
    setCropsLoading(true);
    setCropsError('');
    try {
      const data = await api.getCrops();
      setCrops(data);
    } catch (error) {
      setCropsError(error.message);
    } finally {
      setCropsLoading(false);
    }
  }

  async function loadInitialReadings() {
    setSensorLoading(true);
    setSensorError('');
    try {
      const data = await api.getReadings();
      setReadings(data);
      setSensorHasSucceeded(true);
      setLastRefresh(new Date());
    } catch (error) {
      setSensorError(error.message);
      setSensorHasSucceeded(false);
      setLastRefresh(null);
    } finally {
      setSensorLoading(false);
    }
  }

  useEffect(() => {
    loadCrops();
    loadInitialReadings();
  }, []);

  const results = useMemo(
    () => buildDashboardResults(crops, readings, sensorHasSucceeded),
    [crops, readings, sensorHasSucceeded]
  );

  const farmStatus = useMemo(
    () => calculateFarmStatus(results, sensorHasSucceeded),
    [results, sensorHasSucceeded]
  );

  const availableNames = useMemo(
    () => (sensorHasSucceeded ? getAvailableCropNames(readings, crops) : []),
    [readings, crops, sensorHasSucceeded]
  );

  async function handleRefresh() {
    setSensorLoading(true);
    setRefreshError('');
    try {
      const data = await api.getReadings();
      setReadings(data);
      setSensorHasSucceeded(true);
      setSensorError('');
      setLastRefresh(new Date());
      setSuccessMessage('Sensor data refreshed successfully.');
    } catch (error) {
      if (sensorHasSucceeded) {
        setRefreshError(`Refresh failed: ${error.message}. Previous successful sensor results were kept.`);
      } else {
        setSensorError(error.message);
      }
    } finally {
      setSensorLoading(false);
    }
  }

  async function handleFormSubmit(payload) {
    setFormBusy(true);
    try {
      if (formState.mode === 'create') {
        const created = await api.createCrop(payload);
        setCrops((current) => [...current, created].sort((a, b) => a.id - b.id));
        setSuccessMessage(`${created.crop_name} Crop Card created successfully.`);
      } else {
        const updated = await api.updateCrop(formState.crop.id, payload);
        setCrops((current) => current.map((crop) => crop.id === updated.id ? updated : crop));
        setSuccessMessage(`${updated.crop_name} Crop Card updated successfully.`);
      }
      setFormState(null);
    } finally {
      setFormBusy(false);
    }
  }

  async function handleDelete(crop) {
    const confirmed = window.confirm(`Delete the ${crop.crop_name} Crop Card? Sensor JSON will not be changed.`);
    if (!confirmed) return;

    try {
      await api.deleteCrop(crop.id);
      setCrops((current) => current.filter((item) => item.id !== crop.id));
      setSuccessMessage(`${crop.crop_name} Crop Card deleted. Sensor readings remain unchanged.`);
      if (historyCrop?.id === crop.id) setHistoryCrop(null);
    } catch (error) {
      setRefreshError(`Delete failed: ${error.message}`);
    }
  }

  if (cropsLoading) {
    return (
      <main className="page-shell">
        <div className="loading-panel">
          <div className="spinner" aria-hidden="true" />
          <h1>Loading SmartFarm Crop Cards…</h1>
          <p>Connecting to SQLite and the Express backend.</p>
        </div>
      </main>
    );
  }

  if (cropsError) {
    return (
      <main className="page-shell">
        <div className="fatal-panel">
          <p className="eyebrow">Application error</p>
          <h1>Crop Cards could not be loaded</h1>
          <p>{cropsError}</p>
          <button className="button primary" onClick={loadCrops}>Retry Crop Cards</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <SummaryBar
        status={farmStatus}
        cropCount={crops.length}
        lastRefresh={lastRefresh}
        onAdd={() => setFormState({ mode: 'create' })}
        onRefresh={handleRefresh}
        addDisabled={!sensorHasSucceeded || availableNames.length === 0}
        refreshLoading={sensorLoading}
        sensorInitialLoading={sensorLoading && !sensorHasSucceeded}
      />

      <div className="feedback-stack">
        {!sensorHasSucceeded && !sensorLoading && (
          <FeedbackBanner
            type="warning"
            message={`Sensor feed unavailable: ${sensorError || 'No successful sensor request yet'}. Crop Cards remain visible, sensor values are N/A, and Create is disabled.`}
            actionLabel="Retry Sensor Data"
            onAction={handleRefresh}
          />
        )}
        {refreshError && <FeedbackBanner type="error" message={refreshError} />}
        {successMessage && (
          <FeedbackBanner type="success" message={successMessage} actionLabel="Dismiss" onAction={() => setSuccessMessage('')} />
        )}
      </div>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Current crops</p>
            <h2>Crop Cards</h2>
          </div>
          <p>{sensorHasSucceeded ? 'Each card uses its greatest matching sensor timestamp.' : 'Sensor results are unavailable until a reading request succeeds.'}</p>
        </div>

        {crops.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <h3>No Crop Cards</h3>
            <p>Overall Farm Status is No Crops. Add a card when valid sensor data is available.</p>
            <button className="button primary" onClick={() => setFormState({ mode: 'create' })} disabled={!sensorHasSucceeded || availableNames.length === 0}>
              Add Crop Card
            </button>
          </div>
        ) : (
          <div className="crop-grid">
            {results.map((result) => (
              <CropCard
                key={result.crop.id}
                result={result}
                onEdit={(crop) => setFormState({ mode: 'edit', crop })}
                onDelete={handleDelete}
                onHistory={setHistoryCrop}
                historyDisabled={!sensorHasSucceeded}
              />
            ))}
          </div>
        )}
      </section>

      {formState && (
        <CropForm
          mode={formState.mode}
          crop={formState.crop}
          availableNames={availableNames}
          onSubmit={handleFormSubmit}
          onClose={() => !formBusy && setFormState(null)}
          busy={formBusy}
        />
      )}

      {historyCrop && (
        <SensorHistory crop={historyCrop} readings={readings} onClose={() => setHistoryCrop(null)} />
      )}
    </main>
  );
}

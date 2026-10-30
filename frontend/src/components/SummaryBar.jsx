export default function SummaryBar({
  status,
  cropCount,
  lastRefresh,
  onAdd,
  onRefresh,
  addDisabled,
  refreshLoading,
  sensorInitialLoading
}) {
  const displayRefresh = lastRefresh ? lastRefresh.toLocaleString() : 'Never';

  return (
    <section className="summary-panel" aria-label="Farm summary">
      <div className="summary-heading">
        <div>
          <p className="eyebrow">GreenFields Farm</p>
          <h1>SmartFarm Crop Dashboard</h1>
          <p className="subtitle">Crop configuration and read-only IoT sensor monitoring</p>
        </div>
        <div className={`status-pill status-${status.toLowerCase().replaceAll(' ', '-')}`}>
          <span>Overall Farm Status</span>
          <strong>{sensorInitialLoading && status === 'Sensor Feed Unavailable' ? 'Loading…' : status}</strong>
        </div>
      </div>

      <div className="summary-stats">
        <div className="stat">
          <span>Crop Cards</span>
          <strong>{cropCount}</strong>
        </div>
        <div className="stat wide">
          <span>Last sensor refresh</span>
          <strong>{displayRefresh}</strong>
        </div>
      </div>

      <div className="summary-actions">
        <button className="button primary" onClick={onAdd} disabled={addDisabled}>
          Add Crop Card
        </button>
        <button className="button secondary" onClick={onRefresh} disabled={refreshLoading}>
          {refreshLoading ? 'Refreshing…' : 'Refresh Sensor Data'}
        </button>
      </div>
    </section>
  );
}

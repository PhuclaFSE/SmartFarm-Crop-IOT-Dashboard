import { analyseCrop } from '../utils/analysis.js';

function waterLabel(value) {
  return value === 'N/A' ? 'N/A' : `${value} L`;
}

export default function SensorHistory({ crop, readings, onClose }) {
  const cropReadings = readings
    .filter((reading) => reading.crop_name === crop.crop_name)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Read-only sensor data</p>
            <h2 id="history-title">{crop.crop_name} Sensor History</h2>
            <p className="subtitle">All five readings, newest first</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="history-list">
          {cropReadings.map((reading) => {
            const analysis = analyseCrop(crop, reading);
            return (
              <article className="history-item" key={reading.timestamp}>
                <div className="history-heading">
                  <strong>{reading.timestamp}</strong>
                  <span className={`condition condition-${analysis.condition.toLowerCase().replaceAll(' ', '-')}`}>
                    {analysis.condition}
                  </span>
                </div>
                <div className="history-values">
                  <span>Moisture <strong>{reading.soil_moisture}%</strong></span>
                  <span>Temperature <strong>{reading.temperature} °C</strong></span>
                  <span>Rainfall <strong>{reading.rainfall} mm</strong></span>
                  <span>Sensor <strong>{reading.sensor_status}</strong></span>
                </div>
                <p className="history-note">{reading.notes || 'No sensor note'}</p>
                <div className="history-analysis">
                  <span>Recommended: <strong>{waterLabel(analysis.recommended_water)}</strong></span>
                  <span>Action: <strong>{analysis.action}</strong></span>
                  <span>Alerts: <strong>{analysis.alerts.length ? analysis.alerts.join(', ') : 'None'}</strong></span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

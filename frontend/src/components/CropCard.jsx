function waterLabel(value) {
  return value === 'N/A' ? 'N/A' : `${value} L`;
}

function sensorValue(value, suffix = '') {
  return value === undefined || value === null ? 'N/A' : `${value}${suffix}`;
}

export default function CropCard({ result, onEdit, onDelete, onHistory, historyDisabled }) {
  const { crop, latest_reading: reading, condition, recommended_water, alerts, action } = result;

  return (
    <article className="crop-card">
      <div className="crop-card-header">
        <div>
          <p className="crop-name">{crop.crop_name}</p>
          <h2>{crop.location}</h2>
        </div>
        <span className={`condition condition-${condition.toLowerCase().replaceAll(' ', '-')}`}>{condition}</span>
      </div>

      <div className="config-row">
        <span>Target moisture</span>
        <strong>{crop.target_min}%–{crop.target_max}%</strong>
      </div>
      <div className="config-row">
        <span>Normal water</span>
        <strong>{crop.normal_water} L</strong>
      </div>
      {crop.notes && (
        <div className="notes-box">
          <span>Card notes</span>
          <p>{crop.notes}</p>
        </div>
      )}

      <div className="sensor-section">
        <div className="sensor-title-row">
          <h3>Latest sensor reading</h3>
          <span>{reading?.timestamp || 'N/A'}</span>
        </div>
        <div className="sensor-grid">
          <div><span>Moisture</span><strong>{sensorValue(reading?.soil_moisture, '%')}</strong></div>
          <div><span>Temperature</span><strong>{sensorValue(reading?.temperature, ' °C')}</strong></div>
          <div><span>Rainfall</span><strong>{sensorValue(reading?.rainfall, ' mm')}</strong></div>
          <div><span>Sensor</span><strong>{reading?.sensor_status || 'N/A'}</strong></div>
        </div>
        {reading?.notes && <p className="sensor-note">{reading.notes}</p>}
      </div>

      <div className="decision-grid">
        <div>
          <span>Recommended water</span>
          <strong>{waterLabel(recommended_water)}</strong>
        </div>
        <div>
          <span>Action</span>
          <strong>{action}</strong>
        </div>
      </div>

      <div className="alerts-block">
        <span>Alerts</span>
        {alerts.length > 0 ? (
          <ul>{alerts.map((alert) => <li key={alert}>{alert}</li>)}</ul>
        ) : (
          <p>None</p>
        )}
      </div>

      <div className="card-actions">
        <button className="button small secondary" onClick={() => onEdit(crop)}>Edit</button>
        <button className="button small danger" onClick={() => onDelete(crop)}>Delete</button>
        <button className="button small ghost" onClick={() => onHistory(crop)} disabled={historyDisabled}>
          View Sensor History
        </button>
      </div>
    </article>
  );
}

# SmartFarm — Crop Monitoring Dashboard

A full-stack web application for monitoring crop conditions, managing farm crop configurations, and reviewing simulated IoT sensor data. SmartFarm combines a React dashboard with an Express REST API and SQLite storage to turn sensor readings into actionable crop-health insights.

> **Project scope:** SmartFarm uses a local JSON file to simulate an external sensor feed. It is a functional monitoring prototype, not a live IoT hardware integration.

## Features

- **Crop management:** Create, view, update, and delete crop configurations, including location, moisture thresholds, normal watering amount, and notes.
- **Crop health monitoring:** Classify crop conditions as **Healthy**, **Dry**, **Too Wet**, **Sensor Problem**, or **Invalid Data**.
- **Watering recommendations:** Calculate recommended watering amounts based on each crop's moisture thresholds.
- **Smart alerts:** Flag high temperatures, rainfall, and sensor issues.
- **Farm-wide status:** Display an overall **Normal**, **Watch**, or **Critical** status, with dedicated states for an empty crop list or unavailable sensor feed.
- **Sensor history:** Review historical readings for each crop, with consistent condition analysis across current and past data.
- **Refresh and resilience:** Reload sensor readings on demand while preserving the most recent valid data if a subsequent refresh fails.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Database | SQLite (`better-sqlite3`) |
| Sensor data | Local JSON-based simulated IoT feed |
| API | REST |

## Architecture

```text
                  React + Vite Dashboard
                           |
             +-------------+-------------+
             |                           |
       Crop management               Sensor refresh
             |                           |
             v                           v
        Express REST API (Node.js)
             |                           |
       /api/crops                   /api/readings
             |                           |
             v                           v
       SQLite database          Read-only JSON feed
             |                           |
             +-------------+-------------+
                           |
                           v
                React analysis utilities
           (latest reading, crop condition,
             alerts, watering, farm status)
```

Crop configurations are persisted in SQLite, while sensor readings come from a separate read-only source. The frontend joins these datasets using the exact, case-sensitive `crop_name` field and selects the newest reading by timestamp. Analysis is performed in reusable React utility functions rather than stored as derived database fields.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Run the backend

Open a terminal in the project root:

```bash
cd backend
npm install
npm run start
```

The API runs at **http://localhost:3001**.

On startup, the backend automatically creates the SQLite database and `crops` table if they do not exist. An empty crop table is seeded with Tomato, Lettuce, and Wheat.

### 3. Run the frontend

Open a second terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Production build check

```bash
cd frontend
npm run build
```

## API Reference

Base URL: `http://localhost:3001`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/crops` | List crop configurations |
| `GET` | `/api/crops/:id` | Get a crop configuration by ID |
| `POST` | `/api/crops` | Create a crop configuration |
| `PUT` | `/api/crops/:id` | Update editable crop fields |
| `DELETE` | `/api/crops/:id` | Delete a crop configuration |
| `GET` | `/api/readings` | Read and validate the simulated sensor feed |

The API uses standard HTTP status codes, including `400` for invalid input, `404` for missing crop records, `409` for duplicate crop names, and `500` for server or sensor-feed errors. Error responses use an `error` field.

## How Monitoring Works

1. **Load data:** Fetch crop configurations and sensor readings separately.
2. **Match readings:** Associate readings with crops using exact `crop_name` matching.
3. **Identify the latest reading:** Sort each crop's readings by timestamp, not array position.
4. **Evaluate crop health:** Prioritise sensor issues and invalid data before moisture-based classification.
5. **Generate recommendations:** Derive watering requirements and additional temperature or rainfall alerts.
6. **Aggregate farm status:** Use the individual crop results to determine overall farm health.

For online sensors with valid measurements, moisture below the crop's minimum threshold is classified as **Dry**, moisture within the inclusive target range as **Healthy**, and moisture above the maximum as **Too Wet**. Sensor status and invalid readings take precedence over moisture classification.

### Example seeded crops

| Crop | Location | Target moisture range | Normal water amount |
| --- | --- | --- | --- |
| Tomato | Greenhouse A | 55–75 | 500 L |
| Lettuce | Greenhouse B | 60–80 | 400 L |
| Wheat | North Field | 35–55 | 300 L |

The simulated feed also includes Maize, which can be added through the crop management interface.

## Data Handling and Reliability

- **Read-only sensor source:** Crop CRUD operations never modify sensor readings.
- **Validated feed:** The backend checks the expected sensor JSON structure, field types, crop names, statuses, and timestamps.
- **Consistent analysis:** The same crop-analysis function powers dashboard cards and historical readings.
- **Graceful failures:** If a later sensor refresh fails, the dashboard retains the latest successfully loaded readings and shows an error instead of discarding them.
- **Clear separation of concerns:** Express owns persistence and input validation; React owns monitoring calculations and presentation.

## Current Limitations and Future Improvements

SmartFarm currently uses a manually refreshed local JSON sensor feed, not real sensors or streaming telemetry. It does not include authentication or a cloud deployment.

Potential next steps include live sensor ingestion via MQTT, time-series storage, user authentication, automated alert notifications, and cloud deployment.

## License

No license has been specified for this repository.

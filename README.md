# SmartFarm Crop IoT Dashboard

CSE3CWA / CSE5006 — Assignment 2, Semester 2 2026

A full-stack React + Node/Express + SQLite dashboard for GreenFields Farm. Crop Cards are stored in SQLite and managed by the user, while a separate read-only JSON file simulates an external IoT sensor feed. The React frontend joins the two data sources using the exact, case-sensitive `crop_name` key, selects the greatest timestamp for each crop, and calculates the current crop condition in the browser.

## 1. Technology and URLs

- Frontend: React + Vite — `http://localhost:5173`
- Backend: Node.js + Express — `http://localhost:3001`
- Database: SQLite via `better-sqlite3`
- Sensor feed: `backend/data/sensor-readings.json`
- Styling: plain CSS

No chart library, Redux, MQTT, Arduino, cloud service, machine-learning model, authentication, or external AI API is used.

## 2. Installation and Run Steps

Requirements:

- Node.js 18+
- npm

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run start
```

Backend URL:

```text
http://localhost:3001
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Optional frontend build check:

```bash
cd frontend
npm run build
```

## 3. Database Creation and Seeding

`backend/db.js` runs when the backend starts.

It:

1. creates `backend/data/smartfarm.db` if it does not already exist;
2. creates the `crops` table if needed;
3. checks the number of existing Crop Cards;
4. seeds Tomato, Lettuce and Wheat only when the table is empty;
5. does not seed Maize so it is available for the required Create workflow.

Restarting the backend does not duplicate the seed records.

Seed values:

| Crop | Location | Target min | Target max | Normal water |
|---|---|---:|---:|---:|
| Tomato | Greenhouse A | 55 | 75 | 500 L |
| Lettuce | Greenhouse B | 60 | 80 | 400 L |
| Wheat | North Field | 35 | 55 | 300 L |

To reset the database during development, stop the backend, delete `backend/data/smartfarm.db`, and restart the backend.

## 4. Data Ownership

The application uses two separate data sources.

### Crop Cards

Crop Cards are stored in the SQLite `crops` table.

They contain the user-managed configuration for each crop, including:

- `crop_name`
- `location`
- `target_min`
- `target_max`
- `normal_water`
- `notes`

The user can Create, Read, Update and Delete Crop Cards through the Express API.

### Sensor Readings

`backend/data/sensor-readings.json` represents an external IoT sensor feed.

The application only reads this file. There are no POST, PUT or DELETE routes for sensor readings.

Sensor readings contain:

- `crop_name`
- `timestamp`
- `soil_moisture`
- `temperature`
- `rainfall`
- `sensor_status`
- `notes`

### Dashboard Results

Dashboard results are calculated in React only.

The application does not store the following values in SQLite:

- condition;
- recommended water;
- alerts;
- action;
- latest sensor reading;
- Overall Farm Status.

Deleting a Crop Card removes the SQLite record and the card from the dashboard, but it does not remove any sensor readings. If the same crop is created again, it can match the same existing sensor data.

## 5. Express API

Every failed API response uses the JSON key `error`.

Example:

```json
{
  "error": "Clear message describing the problem"
}
```

| Method | Route | Purpose | Success |
|---|---|---|---|
| GET | `/api/crops` | Return all Crop Cards | `200` + JSON array |
| GET | `/api/crops/:id` | Return one Crop Card | `200` + object |
| POST | `/api/crops` | Create one Crop Card | `201` + created object |
| PUT | `/api/crops/:id` | Update editable Crop Card fields | `200` + updated object |
| DELETE | `/api/crops/:id` | Delete one Crop Card | `200` + `{ "deleted": true, "id": number }` |
| GET | `/api/readings` | Read, validate and return sensor JSON | `200` + JSON array |

Important error behaviour:

- invalid or missing Crop Card field → `400`
- `crop_name` not present in the valid sensor feed → `400`
- attempt to change `crop_name` → `400`
- duplicate `crop_name` → `409`
- Crop Card ID not found → `404`
- structurally invalid sensor file → `500`
- unexpected server/database failure → `500`

The backend validates numeric Crop Card values as JSON numbers rather than numeric strings.

The backend also validates `crop_name` on POST against the valid sensor feed.

## 6. Sensor JSON and Structural Validation

`backend/data/sensor-readings.json` contains exactly 20 readings:

- five Tomato readings;
- five Lettuce readings;
- five Wheat readings;
- five Maize readings.

`GET /api/readings` reads the JSON file from disk on every request. This allows the Refresh Sensor Data button to retrieve an updated file without restarting the backend.

The backend checks that:

- the top-level value is an array;
- there are exactly 20 readings;
- each crop has exactly five readings;
- each object contains exactly the seven required fields;
- every required field has the correct type;
- timestamps use the required `YYYY-MM-DDTHH:mm:ss` format;
- timestamps do not repeat within the same crop;
- `crop_name` is exactly Tomato, Lettuce, Wheat or Maize;
- `sensor_status` is exactly Online, Offline or Faulty.

A numeric value outside the normal business range is not automatically treated as a structural file error.

The final sensor file contains one older Wheat reading with `soil_moisture: 120`. The object remains structurally valid and is returned to the frontend, where the analysis logic labels it as Invalid Data.

## 7. Exact `crop_name` Matching

`crop_name` is the exact join key between a Crop Card and its sensor readings.

Matching is case-sensitive.

```js
readings.filter((reading) => reading.crop_name === cropName)
```

Therefore:

- `Tomato` matches `Tomato`;
- `Tomato` does not match `tomato`.

The Create dropdown is generated from unique crop names in the sensor feed after removing crop names already used by existing Crop Cards.

With the initial seeded database, only Maize is available.

After Maize is deleted, Maize becomes available again.

## 8. Greatest Timestamp Selection

The sensor JSON array is intentionally stored in mixed order.

The frontend does not assume that the final JSON object is the newest reading.

`getLatestReading(cropName, readings)`:

1. filters readings using the exact `crop_name`;
2. sorts matching readings by `timestamp` from newest to oldest;
3. returns the reading with the greatest timestamp.

Because every timestamp uses the same fixed `YYYY-MM-DDTHH:mm:ss` structure, string ordering can be used safely for these timestamps.

The required latest cases in the final sensor file are:

- Tomato — Online, Dry, temperature above 35 °C;
- Lettuce — Online and Healthy;
- Wheat — Online, Too Wet, rainfall at least 5 mm;
- Maize — Faulty, therefore Sensor Problem.

## 9. Dashboard Decision Priority

The same `analyseCrop(cropCard, reading)` function is reused by the main Crop Cards and Sensor History.

The main decision order is:

1. **Sensor Problem**  
   Used when `sensor_status` is Offline or Faulty.  
   Recommended water is N/A and the action is Check sensor.

2. **Invalid Data**  
   Used for an Online reading when moisture, temperature or rainfall is outside its allowed business range.  
   Recommended water is N/A and the action is Check reading.

3. **Dry**  
   Used when soil moisture is below `target_min`.  
   Recommended water is the Crop Card's `normal_water`.

4. **Healthy**  
   Used when soil moisture is between `target_min` and `target_max`, including both boundaries.  
   Recommended water is 0 L.

5. **Too Wet**  
   Used when soil moisture is above `target_max`.  
   Recommended water is 0 L.

Additional alerts are checked only for a valid Online reading:

- temperature greater than 35 °C → High temperature;
- rainfall greater than or equal to 5 mm → Rain detected.

Boundary behaviour:

- moisture equal to `target_min` is Healthy;
- moisture equal to `target_max` is Healthy;
- exactly 35 °C is not High temperature;
- exactly 5 mm rainfall adds Rain detected.

## 10. Overall Farm Status

`calculateFarmStatus` applies the following order:

1. no Crop Cards → **No Crops**
2. Crop Cards exist but there has been no successful sensor request → **Sensor Feed Unavailable**
3. any Crop Card is Sensor Problem or Invalid Data → **Critical**
4. otherwise, any Crop Card is Dry, Too Wet or has High temperature → **Watch**
5. otherwise → **Normal**

Rain detected by itself does not change the Overall Farm Status.

## 11. Loading, Refresh and Recalculation Behaviour

### Initial Load

The application requests both:

- `GET /api/crops`
- `GET /api/readings`

Loading feedback is displayed while requests are pending.

### Crop Card Request Failure

If Crop Cards fail to load, the app shows an application error and Retry action. Editable Crop Cards and forms are not displayed until the request succeeds.

### First Sensor Request Failure

If the first sensor request fails:

- loaded Crop Cards remain visible;
- sensor values display N/A;
- Overall Farm Status becomes Sensor Feed Unavailable;
- Last sensor refresh remains Never;
- Create Crop Card is disabled.

### Successful Sensor Request

After a successful sensor request:

- readings are stored in React state;
- Crop Cards are recalculated;
- Last sensor refresh is updated;
- Create Crop Card is enabled.

### Later Refresh Failure

If a later refresh fails, the application preserves:

- the most recent successful sensor readings;
- current dashboard results;
- Overall Farm Status;
- Last sensor refresh time.

An error banner is displayed instead of clearing the previous successful data.

### Create, Edit and Delete

After successful Crop Card CRUD operations, the Crop Card state is updated and the dashboard is recalculated using the current successful sensor-reading state.

If all Crop Cards are deleted, the dashboard displays an empty state and Overall Farm Status becomes No Crops.

## 12. Sensor History

View Sensor History displays all five read-only readings for the selected crop, sorted newest first.

Each historical reading uses the same `analyseCrop` function as the main dashboard.

This means the older Wheat reading with `soil_moisture: 120` displays Invalid Data in Sensor History, while the latest valid Wheat reading can still be used for the main dashboard card.

## 13. AI-Assisted Development Reflection

### AI tool used

OpenAI ChatGPT was used as an AI-assisted development tool during this assignment.

I used AI mainly as a starting point and support tool for areas such as project structure, some React and Express implementation ideas, SQLite queries, CSS, sensor JSON generation, validation logic and debugging suggestions.

I then reviewed the application flow, checked the main frontend and backend behaviour, reviewed the data-matching and analysis rules, and tested the required business cases before submission. I also made changes while reviewing the generated code so that the final implementation matched the assignment requirements and remained understandable to me.

### Final prompt used to generate the sensor readings

> Generate a valid JSON array containing exactly 20 simulated SmartFarm sensor readings. Use these crop_name values exactly and create exactly 5 readings for each: Tomato, Lettuce, Wheat, Maize. Every object must contain exactly these fields: crop_name, timestamp, soil_moisture, temperature, rainfall, sensor_status, notes. Use timestamps in YYYY-MM-DDTHH:mm:ss format. Timestamps must be distinct within each crop. The same timestamp may be used by different crops. Mix the array order so the latest reading is not always the last object. Use sensor_status only as Online, Offline or Faulty. Most numeric values must be realistic: soil_moisture 0-100, temperature 0-50, rainfall 0-50. Include exactly one structurally valid older reading with one deliberately out-of-range numeric value. That invalid reading must not be the latest reading for its crop. Make the latest readings produce these cases with the default Crop Card settings: latest Tomato: Online, Dry, temperature above 35 C; latest Lettuce: Online and Healthy; latest Wheat: Online, Too Wet, rainfall at least 5 mm; latest Maize: sensor_status Faulty. Return only the JSON array. Do not use Markdown or explanation.

### AI-generated weakness reviewed and corrected

During review, I checked that the sensor readings did not rely on array position to determine the latest result.

The JSON file uses mixed ordering, and I verified that the application selects the latest reading using the greatest timestamp instead of assuming that the final matching object is the newest.

I also checked the deliberately invalid Wheat reading with `soil_moisture: 120`. I confirmed that it is older than the latest Wheat reading, remains structurally valid, and is classified as Invalid Data by the frontend analysis instead of being rejected as a structural JSON error.

### Verification performed

Before submission, I reviewed and tested the following:

- exactly 20 sensor readings;
- exactly five readings per crop;
- all seven required sensor fields;
- correct sensor field types;
- exact case-sensitive crop names;
- valid status values;
- valid timestamps with no duplicate timestamp within a crop;
- one intentional out-of-range numeric reading;
- initial Create dropdown containing Maize only;
- latest Tomato producing Dry and High temperature;
- latest Lettuce producing Healthy;
- latest Wheat producing Too Wet and Rain detected;
- latest Maize producing Sensor Problem;
- historical Wheat invalid reading producing Invalid Data;
- min/max moisture boundaries;
- 35 °C temperature boundary;
- 5 mm rainfall boundary;
- Sensor Problem priority over Invalid Data;
- No Crops, Sensor Feed Unavailable, Watch and Critical status behaviour;
- Delete and re-create behaviour;
- Refresh Sensor Data behaviour.

### One implementation decision I can explain

I kept the dashboard analysis logic in reusable frontend utility functions instead of asking Express to return already-analysed dashboard results.

This keeps the responsibilities separate:

- Express handles Crop Card validation, SQLite CRUD and structural sensor-file validation;
- React handles exact matching, latest timestamp selection, condition calculation, recommended water, alerts, action and Overall Farm Status.

The same `analyseCrop` function is reused by both the main Crop Cards and Sensor History so the decision rules are not duplicated.

## 14. Project Limitation

The sensor feed is a static local JSON file and updates are requested manually through the Refresh Sensor Data button.

The project does not connect to real IoT hardware or receive live push updates.

In a production farm system, sensor information would normally come from a live telemetry service and would require additional features such as authentication, stronger persistence, monitoring and real-time communication.

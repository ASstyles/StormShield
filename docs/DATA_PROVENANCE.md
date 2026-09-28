# StormShield X — Data Trust & Provenance Registry

**System Component:** Data Trust, Verification & Provenance Subsystem  
**Registry Version:** 1.0.0  
**Compliance Standard:** Multi-Agency Disaster Decision Support Transparency Framework  

---

## 1. Transparency Principle

In critical disaster response and emergency planning scenarios, decision-makers must never confuse live observational telemetry with synthetic or simulated projections.

StormShield X enforces strict cryptographic and metadata provenance tags across all geospatial layers, meteorological telemetry, and AI synthesis responses.

---

## 2. Dataset Classification & Provenance Taxonomy

Every data object within StormShield X carries one of five immutable provenance designations:

| Tag | Classification | Authoritative Origin | Description & Role |
| :--- | :--- | :--- | :--- |
| `[OBSERVED]` | Empirical Ground Truth | IMD / JTWC / INCOIS Coastal Gauges | Measured physical observations: historic track coordinates, central pressure, and radar eye telemetry prior to T-0 (Landfall). |
| `[MODEL]` | Numerical Simulation | StormShield Hydrodynamic Surge Model | Calibrated hydrodynamic inundation calculations based on ALOS DEM elevation and SLOSH surge equations. |
| `[SIMULATED]` | What-If Projection | Digital Twin Scenario Engine | User-altered scenario forecasts (e.g. +30% rainfall multiplier, accelerated translation speed, shifted landfall track). |
| `[SYNTHETIC]` | Demonstration Baseline | Calibrated Kakinada Geographic Corpus | Realistic synthetic infrastructure asset database (Kakinada GGH, MPCS Shelters, 400kV Substation) used for prototype testing. |
| `[AI GENERATED]`| LLM Synthesized Output | Google Gemini (`gemini-3.8-flash`) | Natural-language tactical summaries, explainability narratives, and prioritized evacuation instructions. Never used for raw numbers. |

---

## 3. Catalog of Core Datasets

### 1. Cyclone Jal-26 Track & Cone of Uncertainty
- **Identifier:** `CYCLONE-2026-AP01`
- **Geographic Center:** Kakinada Bay of Bengal (`16.45°N, 83.10°E`)
- **Observed Points:** -18h, -12h, -6h, NOW (`status: OBSERVED`)
- **Forecast Points:** +6h, +12h, +18h, +24h (`status: FORECAST`)
- **Uncertainty Cone:** 70% confidence polygon derived from ensemble translation dispersion models.
- **Classification:** `[OBSERVED / MODEL]`

### 2. High-Resolution Digital Elevation Model (DEM)
- **Source:** JAXA 30m ALOS World 3D (AW3D30) & SRTM 1-Arcsecond
- **Coverage:** Kakinada, Coringa Mangrove Belt, Samalkot, Peddapuram
- **Resolution:** 30m horizontal grid, 0.1m vertical datum accuracy
- **Application:** Evaluates micro-elevation flood thresholds (<3.0m critical inundation zone).
- **Classification:** `[REAL / SATELLITE]`

### 3. Critical Infrastructure & Lifeline Inventory
- **Coverage:** 18 monitored assets across Kakinada and Krishna coastal districts:
  - Hospitals: Kakinada Government General Hospital (1,100 beds), Apollo Speciality Hospital (350 beds)
  - Cyclone Shelters: MPCS Uppada, Samalkot Transit Camp, Gilakaladindi Fishing Harbor
  - Power Grid: Kakinada 400kV Grid Substation, Coringa 220kV Switching Yard
  - Transportation: NH-216 Coastal Highway, SH-73 Inland Bypass
- **Attributes:** Elevation, distance to coast, population served, backup generator hours, ICU capacity.
- **Classification:** `[SYNTHETIC / DEMO BASELINE]`

### 4. Evacuation Routing Graph
- **Algorithm:** Dijkstra / A* weighted directed graph with dynamic flood penalties.
- **Network Source:** OpenStreetMap road network calibrated with hydrodynamic flood overtopping boundaries.
- **Normal Route:** Passes low-lying NH-216 (1.8km sector overtopped by 2.8m surge; tagged `BLOCKED`).
- **Risk-Aware Route:** Reroutes via SH-73 inland corridor (minimum elevation 8.4m; tagged `SAFE`).
- **Classification:** `[MODEL / DETERMINISTIC]`

---

## 4. Multi-Hazard Attribution Explainability Model

The composite impact score (0–100) is calculated via a calibrated multi-attribute utility function:

$$\text{Overall Risk} = 0.35 \times \text{Flood} + 0.25 \times \text{Surge} + 0.20 \times \text{Wind} + 0.20 \times \text{Infrastructure}$$

Where Flood Susceptibility is computed from local physical parameters:

$$\text{Flood Risk} = 0.35 \times \text{Rainfall} + 0.30 \times (10 - \text{Elevation}) + 0.20 \times (15 - \text{Coast Dist}) + 0.15 \times \text{Historical Susceptibility}$$

Every risk score rendered in the UI can be inspected via the **"Why CRITICAL?"** factor attribution panel in `ZoneDetailPanel.tsx`.

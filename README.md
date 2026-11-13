# ThreatLens — Cyber Threat Intelligence Platform

ThreatLens is a local-first cyber threat intelligence dashboard for exploring threat reports from MongoDB, running classification workflows, and analyzing dataset health with a simple React + FastAPI stack.

This project keeps the original Chapter 7 MongoDB labs intact while adding the ThreatLens application for classroom demonstration and local use.

## Features

- Executive SOC dashboard with summary metrics from MongoDB
- Threat listing, search, pagination, and detail views
- Rule-based classification for malware, ransomware, phishing, and breach activity
- Analysis pages for database statistics and source coverage
- Local MongoDB connectivity for real report storage and analytics
- Synthetic demo data explicitly labeled for demos and teaching
- One-command startup for the complete React + FastAPI stack

## Technology stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic, PyMongo
- Database: MongoDB Community Server running locally
- Runtime: PowerShell startup script for local orchestration

## Project structure

```text
chapter-07/
├── README.md
├── lab_01_production_schema.py
├── lab_02_working_set_analysis.py
└── ThreatLens/
    ├── README.md
    ├── .env.example
    ├── start.ps1
    ├── backend/
    │   ├── app/
    │   ├── scripts/
    │   ├── tests/
    │   ├── .env.example
    │   ├── requirements.txt
    │   └── .venv/
    ├── frontend/
    │   ├── src/
    │   ├── public/
    │   ├── .env.example
    │   ├── package.json
    │   └── package-lock.json
    ├── data/
    ├── labs/
    └── docs/
```

## MongoDB configuration

Use the local database configuration below for development:

- URI: mongodb://localhost:27017
- Database: threatlens

Required environment values:

```text
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=threatlens
BACKEND_PORT=8000
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

The backend expects the local MongoDB service to be running before startup.

## Installation

### 1) Backend

```powershell
cd "C:\Users\HP\Desktop\NoSQL-Databases-using-MongoDB\chapter-07\ThreatLens\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2) Frontend

```powershell
cd "C:\Users\HP\Desktop\NoSQL-Databases-using-MongoDB\chapter-07\ThreatLens\frontend"
npm install
```

### 3) Start the complete app

From the project root:

```powershell
cd "C:\Users\HP\Desktop\NoSQL-Databases-using-MongoDB\chapter-07\ThreatLens"
.\start.ps1
```

This starts the FastAPI backend and the React frontend together in one command.

## One-command startup

The project includes a PowerShell startup script that launches both services and opens the app in the default browser.

```powershell
.\start.ps1
```

It checks for:

- MongoDB running on localhost:27017
- backend virtual environment and dependencies
- frontend dependencies
- backend health and frontend readiness

It then starts:

- FastAPI on http://localhost:8000
- React frontend on http://localhost:5173
- Swagger docs on http://localhost:8000/docs

## Local URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs

## Lab 7.1 instructions

```powershell
cd "C:\Users\HP\Desktop\NoSQL-Databases-using-MongoDB\chapter-07"
python .\lab_01_production_schema.py
```

This script analyzes production schema patterns and compares collection design trade-offs for MongoDB.

## Lab 7.2 instructions

```powershell
cd "C:\Users\HP\Desktop\NoSQL-Databases-using-MongoDB\chapter-07"
python .\lab_02_working_set_analysis.py
```

This lab demonstrates working-set behavior, cache usage, and range-read performance characteristics.

## Synthetic demo data

The app can seed synthetic reports when the database is empty. These records are intentionally demo-only and should be treated as classroom or presentation data, not production intelligence.

## Notes

- No deployment workflow is required for local use.
- MongoDB remains the source of truth for analytics and threat reporting.
- The startup script does not reset or delete the local database.
- The local Python virtual environment and package lock files are kept intentionally.

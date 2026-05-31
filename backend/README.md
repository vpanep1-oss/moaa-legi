# Backend Service

This backend contains the ingestion and API service for federal and Louisiana legislative data.

## Commands

- `npm install`
- `npm run dev` — start development server with auto-reload
- `npm run build` — compile TypeScript to `dist`
- `npm start` — run compiled service

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `INGEST_SECRET`
- `LEGISCAN_API_KEY`

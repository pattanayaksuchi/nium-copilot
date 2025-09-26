# Frontend – Nium Developer Copilot

Next.js App Router UI for chatting with the backend RAG service and validating payloads.

## Setup

```bash
npm install
cp .env.local.example .env.local
```

## Development

```bash
npm run dev
```

The app will be available at http://localhost:3000/dev-copilot.

## Production Build

```bash
npm run build
npm run start
```

## Notes

* Configure `NEXT_PUBLIC_BACKEND_URL` to point at the FastAPI backend (defaults to `http://localhost:8000`).
* The chat panel renders citations with working links and copies any JSON/cURL code fences with a single click.
* Validation panel formats requests and results for quick troubleshooting and accepts optional `method`/`channel` overrides when corridors support multiple payout options.

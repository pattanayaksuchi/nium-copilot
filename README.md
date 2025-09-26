# Nium Developer Copilot Monorepo

Mono-repo hosting the FastAPI backend and Next.js frontend for the Nium Developer Copilot prototype.

## Layout

```
backend/    # FastAPI, RAG services, ingestion scripts
frontend/   # Next.js App Router interface
```

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add OPENAI_API_KEY if available
python scripts/ingest_validation_sheet.py
python scripts/rebuild_all.py
python main.py
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Visit `http://localhost:3000/dev-copilot` to use the interface.

## Project Highlights

* FastAPI backend with `/health`, `/search`, `/chat`, and `/validate` endpoints.
* Retrieval stack combining FAISS dense vectors with BM25 sparse scores.
* Excel ingestion script that emits corridor-specific JSON Schemas for payload validation.
  * Schemas are now organized by payout method (bank, wallet, proxy, card, cash) and bank sub-channels (local vs wire).
* Next.js UI with chat, validation, example prompts, and clipboard helpers for code snippets.

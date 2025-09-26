# Backend – Nium Developer Copilot

FastAPI backend offering retrieval augmented responses, validation, and ingestion utilities for Nium documentation.

## Prerequisites

* Python 3.11+
* [Poetry optional] – the project ships with `requirements.txt` for `pip`.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # set OPENAI_API_KEY if desired
```

## Initial Data Build

```bash
python scripts/ingest_validation_sheet.py
python scripts/rebuild_all.py
```

*Place the workbook at `backend/data/Nium_Validation_Fields.xlsx` before running the ingest script.*

## Run the API

```bash
python main.py
```

The server listens on `http://0.0.0.0:8000`.

## Smoke Tests

```bash
curl -s http://localhost:8000/health
curl -s -X POST http://localhost:8000/search \
  -H 'content-type: application/json' \
  -d '{"q":"Create payout API"}'
curl -s -X POST http://localhost:8000/chat \
  -H 'content-type: application/json' \
  -d '{"message":"Mandatory fields for GBP payouts"}'
curl -s -X POST http://localhost:8000/validate \
  -H 'content-type: application/json' \
  -d '{"currency":"USD","country":"US","method":"bank","channel":"local","payload":{"beneficiary":{"accountNumber":"123"}}}'
```

## Scripts Overview

* `scripts/ingest_validation_sheet.py` – converts the Excel workbook into JSON Schema files.
* `scripts/crawl_docs.py` – crawls the approved documentation roots and stores cleaned markdown files.
* `scripts/chunk_and_embed.py` – chunks markdown files, builds FAISS and BM25 indices.
* `scripts/rebuild_all.py` – convenience entrypoint to run crawl + embed sequentially.

Generated artefacts are stored under `build/` and excluded from version control via `.gitignore`.

### Validation Tips

* If a corridor supports multiple payout methods (bank, card, wallet, proxy, cash), pass `method` in the `/validate` payload to target the correct schema.
* Bank validations default to the `local` channel unless `channel` is explicitly set to `wire`.

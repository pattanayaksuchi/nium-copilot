# Nium Developer Copilot

Nium Developer Copilot is an internal assistant that helps integration teams ship payouts faster across corridors. The repo bundles the FastAPI backend and the Next.js frontend that power the experience.

## What it does

- **Instant payout playbooks** – Ask corridor or use case questions and get on-point, citation-backed answers that reference official docs, payout statuses, and required schemas.
- **Validation guardrails** – Paste a payout payload (bank, wallet, proxy, card, or cash). We check it against corridor-specific JSON schema and highlight mismatches before you hit production.
- **Dynamic examples** – Generate ready-to-run cURL or JSON templates for remittance creation, status retrieval, and webhook handling with corridor-specific defaults.
- **Docs aware chat** – RAG stack blends FAISS dense search with BM25 so the assistant keeps context and provides 1–3 linked citations every time.
- **Portal support** – Surface “how do I…?” operational answers (API key management, prefund, onboarding, etc.) from the playbook and product guide content.

## Architecture at a glance

- **Backend (`backend/`)** – FastAPI service exposing `chat`, `search`, and `validate` APIs. Retrieval pipeline builds nightly from crawled docs, blending FAISS + BM25 and handing snippets to GPT for synthesis. Payload validation uses corridor schemas derived from Nium’s validation workbook.
- **Frontend (`frontend/`)** – Next.js App Router experience with a chat-oriented UI, validation workspace, corridor shortcuts, and copy-to-clipboard helpers. Auth is handled via API key; no customer data leaves the session.
- **Ingestion scripts (`backend/scripts/`)** – Crawl official Nium documentation, chunk to markdown, embed with sentence-transformers, and publish FAISS/BM25 indexes ready for the RAG runtime.

## High-level modules

| Layer | Purpose |
| --- | --- |
| `backend/app/rag.py` | Hybrid retrieval (FAISS + BM25) and GPT answer synthesis with structured citations. |
| `backend/app/validator.py` | Corridor-aware JSON Schema validation for payouts, with tooltips linked to docs. |
| `backend/scripts/*` | Automated ingestion of Nium docs, validation Excel, and index rebuild orchestration. |
| `frontend/app/dev-copilot` | Chat + validation UI that surfaces assistant responses with inline citations and quick actions. |

## Product capabilities in action

1. **Ask** “What is Nium’s payout flow for Peru local bank?” → assistant returns 5-step lifecycle, status enums, webhook note, cURL snippet.
2. **Validate** a remittance payload → get field-by-field errors (“routingCode is mandatory for PEN local bank”) with doc references.
3. **Retrieve** payout status → copy a ready-to-run `GET /remittance/{systemReferenceNumber}/audit` example tailored to corridor.
4. **Support** ops teams → quick answers to “How do I rotate API keys?” or “What statuses map to settlement?” pulled from the product guide.

---

For environment setup and development workflow, see the per-directory READMEs (`backend/README.md`, `frontend/README.md`).

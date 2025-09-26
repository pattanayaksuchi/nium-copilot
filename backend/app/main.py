"""FastAPI application exposing retrieval, chat, and validation endpoints."""

from __future__ import annotations

from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import rag, schema_lookup, schemas, settings, validator

app = FastAPI(title="Nium Developer Copilot", version="0.1.0")

allow_origins = [settings.FRONTEND_ORIGIN]
allow_all = settings.FRONTEND_ORIGIN == "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    settings.ensure_directories()


@app.get("/health")
def health() -> Dict[str, bool]:
    return {"ok": True}


@app.post("/search")
def search(payload: schemas.SearchReq) -> Dict[str, Any]:
    results = rag.hybrid_search(payload.q, k=payload.k)
    simplified = [
        {
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "snippet": item.get("snippet", item.get("text", "")),
        }
        for item in results
    ]
    return {"results": simplified[: payload.k]}


@app.post("/chat", response_model=schemas.ChatResp)
def chat(payload: schemas.ChatReq) -> schemas.ChatResp:
    schema_answer = (
        schema_lookup.answer_create_payout_query(payload.message)
        or schema_lookup.answer_validation_query(payload.message)
        or schema_lookup.answer_mandatory_difference_query(payload.message)
        or schema_lookup.answer_required_fields_query(payload.message)
        or schema_lookup.answer_remittance_template_query(payload.message)
        or schema_lookup.answer_payout_methods_query(payload.message)
        or schema_lookup.answer_regex_query(payload.message)
        or schema_lookup.answer_proxy_query(payload.message)
    )
    if schema_answer:
        citations = [
            schemas.Citation(
                title=cit.get("title", ""),
                url=cit.get("url", ""),
                snippet=cit.get("snippet", "")
            )
            for cit in schema_answer.get("citations", [])
        ]
        return schemas.ChatResp(
            answer=schema_answer["answer"],
            citations=citations,
        )

    chunks = rag.hybrid_search(payload.message, k=30)
    answer = rag.synthesize_answer(payload.message, chunks)
    if not answer:
        raise HTTPException(status_code=500, detail="Unable to generate answer.")
    citations = []
    citations_data = answer.get("citations", [])
    if isinstance(citations_data, list):
        citations = [
            schemas.Citation(
                title=cit.get("title", "") if isinstance(cit, dict) else "",
                url=cit.get("url", "") if isinstance(cit, dict) else "",
                snippet=cit.get("snippet", "") if isinstance(cit, dict) else ""
            )
            for cit in citations_data
        ]
    return schemas.ChatResp(answer=str(answer.get("answer", "")), citations=citations)


@app.post("/validate")
def validate(payload: schemas.ValidateReq) -> Dict[str, Any]:
    return validator.validate_payload(
        payload.payload,
        payload.currency,
        payload.country,
        method=payload.method,
        channel=payload.channel,
    )


__all__ = ["app"]

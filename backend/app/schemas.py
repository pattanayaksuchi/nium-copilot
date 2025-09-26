"""Pydantic request/response models used by the API."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatReq(BaseModel):
    message: str = Field(..., description="End-user query text.")
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional context payload passed straight through to the retriever.",
    )


class SearchReq(BaseModel):
    q: str = Field(..., description="Search query for the RAG index.")
    k: int = Field(default=5, ge=1, le=50, description="Maximum number of results to return.")


class ValidateReq(BaseModel):
    currency: str = Field(..., min_length=1, description="ISO currency code (e.g. USD).")
    country: str = Field(..., min_length=1, description="ISO country code (e.g. US).")
    method: Optional[str] = Field(
        default=None,
        description="Optional payout method (bank, wallet, proxy, card, cash).",
    )
    channel: Optional[str] = Field(
        default=None,
        description="Optional channel for the selected method (e.g. local, wire).",
    )
    payload: Dict[str, Any] = Field(..., description="Request payload to validate.")


class Citation(BaseModel):
    title: str
    url: str
    snippet: str


class ChatResp(BaseModel):
    answer: str
    citations: List[Citation]


__all__ = [
    "ChatReq",
    "SearchReq",
    "ValidateReq",
    "Citation",
    "ChatResp",
]

"""FastAPI application exposing health check endpoint - minimal version."""

from __future__ import annotations

from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Nium Developer Copilot", version="0.1.0")

# Allow all origins for Replit environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, bool]:
    return {"ok": True}


@app.post("/search")
def search_placeholder() -> Dict[str, Any]:
    """Placeholder search endpoint while dependencies are being resolved."""
    return {
        "results": [
            {
                "title": "System Initializing",
                "url": "placeholder",
                "snippet": "The search system is being configured. Please check back shortly."
            }
        ]
    }


@app.post("/chat")
def chat_placeholder() -> Dict[str, Any]:
    """Placeholder chat endpoint while dependencies are being resolved."""
    return {
        "answer": "The chat system is being configured. Please check back shortly.",
        "citations": []
    }


@app.post("/validate")
def validate_placeholder() -> Dict[str, Any]:
    """Placeholder validation endpoint while dependencies are being resolved."""
    return {
        "status": "pending",
        "message": "The validation system is being configured. Please check back shortly."
    }


__all__ = ["app"]
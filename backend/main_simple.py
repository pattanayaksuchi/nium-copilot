"""Entry-point to run the full FastAPI app with Uvicorn."""

from __future__ import annotations

import os
import uvicorn


if __name__ == "__main__":
    # For development: use port 8000, for production: use PORT env var (5000)
    port = int(os.environ.get("PORT", 8000))
    # Set CORS origins for iframe widget support
    os.environ.setdefault("CORS_ORIGINS", "*")
    # Using 0.0.0.0 for Replit environment
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
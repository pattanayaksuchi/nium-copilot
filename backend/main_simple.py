"""Entry-point to run the full FastAPI app with Uvicorn."""

from __future__ import annotations

import os
import uvicorn


if __name__ == "__main__":
    # Use PORT environment variable if available (for deployment), otherwise default to 5000
    port = int(os.environ.get("PORT", 5000))
    # Set CORS origins for iframe widget support in production
    os.environ.setdefault("CORS_ORIGINS", "*")
    # Using 0.0.0.0 for Replit environment
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
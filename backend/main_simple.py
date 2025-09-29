"""Entry-point to run the full FastAPI app with Uvicorn."""

from __future__ import annotations

import os
import uvicorn


if __name__ == "__main__":
    # Always use port 8000 for backend - frontend expects this
    port = 8000
    # Set CORS origins for iframe widget support
    os.environ.setdefault("CORS_ORIGINS", "*")
    # Use 0.0.0.0 to be accessible from Next.js API routes in both dev and prod
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
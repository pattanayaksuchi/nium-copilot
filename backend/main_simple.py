"""Entry-point to run the full FastAPI app with Uvicorn."""

from __future__ import annotations

import os
import uvicorn


if __name__ == "__main__":
    # Always use port 8000 for backend - frontend expects this
    port = 8000
    # Set CORS origins for iframe widget support
    os.environ.setdefault("CORS_ORIGINS", "*")
    # In production, bind to 127.0.0.1 for security; in dev use 0.0.0.0
    is_production = os.environ.get("REPLIT_DEPLOYMENT") == "1"
    host = "127.0.0.1" if is_production else "0.0.0.0"
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
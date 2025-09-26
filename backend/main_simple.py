"""Entry-point to run the full FastAPI app with Uvicorn."""

from __future__ import annotations

import uvicorn


if __name__ == "__main__":
    # Using 0.0.0.0 for Replit environment
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
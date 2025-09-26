"""Entry-point to run the simplified FastAPI app with Uvicorn."""

from __future__ import annotations

import uvicorn


if __name__ == "__main__":
    # Using localhost as required for backend
    uvicorn.run("app.main_simple:app", host="0.0.0.0", port=8000, reload=True)
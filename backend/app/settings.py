"""Application configuration and helper utilities."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable, List

from dotenv import load_dotenv

# Load .env if it exists so local development has access to secrets.
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
INDEX_DIR = BASE_DIR / "build" / "index"
CORPUS_DIR = BASE_DIR / "build" / "corpus"
SCHEMA_DIR = BASE_DIR / "build" / "validation"
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")


def ensure_directories(paths: Iterable[Path] | None = None) -> List[Path]:
    """Ensure all required build directories exist and return them."""

    targets = list(paths) if paths is not None else [INDEX_DIR, CORPUS_DIR, SCHEMA_DIR]
    for path in targets:
        path.mkdir(parents=True, exist_ok=True)
    return targets


__all__ = [
    "BASE_DIR",
    "INDEX_DIR",
    "CORPUS_DIR",
    "SCHEMA_DIR",
    "EMBED_MODEL",
    "OPENAI_API_KEY",
    "FRONTEND_ORIGIN",
    "ensure_directories",
]

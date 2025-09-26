"""Hybrid retrieval and answer synthesis utilities."""

from __future__ import annotations

import json
import math
import pickle
from functools import lru_cache
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import numpy as np
import httpx

from . import settings
from .settings import ensure_directories

ensure_directories()

try:  # Optional heavy dependencies are declared in requirements.txt.
    import faiss  # type: ignore
except ImportError as exc:  # pragma: no cover - surfaces configuration issues.
    faiss = None  # type: ignore

try:
    from rank_bm25 import BM25Okapi
except ImportError:  # pragma: no cover
    BM25Okapi = None  # type: ignore

try:
    from sentence_transformers import SentenceTransformer
except ImportError:  # pragma: no cover
    SentenceTransformer = None  # type: ignore

SYSTEM_PROMPT = (
    "You are Nium’s Developer Copilot. Answer precisely in 2–4 sentences, then provide "
    "bullet specifics only if needed. \n"
    "Always include 1–3 citations with titles and working links. \n"
    "Prefer corridor-specific details. If the question is about payload fields, list the required "
    "keys tersely.\n"
    "If unsure or documentation conflicts, say what to confirm and where.\n"
    "Return JSON { \"answer\": \"...\", \"citations\": [ { \"title\":\"...\", \"url\":\"...\", \"snippet\":\"...\" } ] }."
)

INTENT_KEYWORDS = {"required", "mandatory", "fields", "payload", "validation"}


def _tokenize(text: str) -> List[str]:
    return [token for token in text.lower().split() if token]


@lru_cache(maxsize=1)
def _load_meta() -> Tuple[List[str], Dict[str, Dict[str, str]]]:
    meta_path = settings.INDEX_DIR / "meta.json"
    if not meta_path.exists():
        return [], {}
    with meta_path.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)
    if isinstance(raw, dict) and "chunks" in raw and "chunk_ids" in raw:
        chunk_ids = list(raw.get("chunk_ids", []))
        chunk_map = {cid: raw["chunks"].get(cid, {}) for cid in chunk_ids}
        return chunk_ids, chunk_map
    # Backwards compatibility: raw is already mapping.
    chunk_ids = list(raw.keys())
    chunk_map = {cid: raw[cid] for cid in chunk_ids}
    return chunk_ids, chunk_map


@lru_cache(maxsize=1)
def _load_bm25() -> Tuple[BM25Okapi | None, List[str]]:
    if BM25Okapi is None:
        return None, []
    bm25_path = settings.INDEX_DIR / "bm25.pkl"
    if not bm25_path.exists():
        return None, []
    with bm25_path.open("rb") as handle:
        payload = pickle.load(handle)
    if isinstance(payload, dict):
        maybe_model = payload.get("bm25")
        chunk_ids = payload.get("chunk_ids") or []
        tokenized_docs = payload.get("tokenized_docs")
        if maybe_model is None and tokenized_docs is not None:
            maybe_model = BM25Okapi(tokenized_docs)
        if maybe_model is not None:
            return maybe_model, list(chunk_ids)
    if isinstance(payload, BM25Okapi):  # legacy direct pickle
        ordered_ids, _ = _load_meta()
        return payload, ordered_ids
    return None, []


@lru_cache(maxsize=1)
def _load_faiss() -> Tuple[faiss.Index | None, List[str]]:
    if faiss is None:
        return None, []
    index_path = settings.INDEX_DIR / "faiss.index"
    ids_path = settings.INDEX_DIR / "faiss_ids.json"
    if not index_path.exists() or not ids_path.exists():
        return None, []
    index = faiss.read_index(str(index_path))
    with ids_path.open("r", encoding="utf-8") as handle:
        chunk_ids = json.load(handle)
    return index, list(chunk_ids)


@lru_cache(maxsize=1)
def _load_encoder() -> SentenceTransformer | None:
    if SentenceTransformer is None:
        return None
    return SentenceTransformer(settings.EMBED_MODEL)


def _normalize(scores: Dict[str, float]) -> Dict[str, float]:
    if not scores:
        return {}
    values = np.array(list(scores.values()), dtype="float32")
    max_v = float(values.max())
    min_v = float(values.min())
    if math.isclose(max_v, min_v):
        return {key: 1.0 for key in scores}
    scale = max_v - min_v
    return {key: (value - min_v) / scale for key, value in scores.items()}


def _score_union(
    bm25_scores: Dict[str, float],
    dense_scores: Dict[str, float],
    *,
    bm25_weight: float,
    dense_weight: float,
) -> Dict[str, float]:
    combined: Dict[str, float] = {}
    norm_bm25 = _normalize(bm25_scores)
    norm_dense = _normalize(dense_scores)
    keys = set(norm_bm25) | set(norm_dense)
    for key in keys:
        combined[key] = norm_bm25.get(key, 0.0) * bm25_weight + norm_dense.get(key, 0.0) * dense_weight
    return combined


def hybrid_search(query: str, k: int = 30) -> List[Dict[str, str]]:
    """Run a hybrid BM25 + dense vector search."""

    query = query.strip()
    if not query:
        return []

    chunk_ids, chunks_map = _load_meta()
    if not chunk_ids:
        return []

    bm25_model, bm25_ids = _load_bm25()
    faiss_index, faiss_ids = _load_faiss()
    encoder = _load_encoder()

    bm25_scores: Dict[str, float] = {}
    if bm25_model is not None and bm25_ids:
        scores = bm25_model.get_scores(_tokenize(query))
        for chunk_id, score in zip(bm25_ids, scores):
            bm25_scores[chunk_id] = float(score)

    dense_scores: Dict[str, float] = {}
    if faiss_index is not None and encoder is not None and faiss_ids:
        query_vec = encoder.encode([query], normalize_embeddings=True)
        top_k = min(k, len(faiss_ids))
        distances, indices = faiss_index.search(query_vec.astype("float32"), top_k)
        for idx, score in zip(indices[0], distances[0]):
            if idx == -1:
                continue
            chunk_id = faiss_ids[idx]
            dense_scores[chunk_id] = float(score)

    keywords_present = any(token in query.lower() for token in INTENT_KEYWORDS)
    bm25_weight = 0.7 if keywords_present else 0.5
    dense_weight = 0.3 if keywords_present else 0.5

    combined_scores = _score_union(bm25_scores, dense_scores, bm25_weight=bm25_weight, dense_weight=dense_weight)
    ranked = sorted(combined_scores.items(), key=lambda item: item[1], reverse=True)

    results: List[Dict[str, str]] = []
    for chunk_id, _ in ranked[:k]:
        chunk = chunks_map.get(chunk_id)
        if not chunk:
            continue
        results.append(
            {
                "id": chunk_id,
                "title": chunk.get("title", ""),
                "url": chunk.get("url", ""),
                "text": chunk.get("text", ""),
                "snippet": chunk.get("text", "")[:400],
            }
        )
    return results


def _format_citations(chunks: Iterable[Dict[str, str]]) -> List[Dict[str, str]]:
    citations: List[Dict[str, str]] = []
    for chunk in chunks:
        if len(citations) >= 3:
            break
        citations.append(
            {
                "title": chunk.get("title", ""),
                "url": chunk.get("url", ""),
                "snippet": chunk.get("text", "")[:280],
            }
        )
    return citations


def _call_openai(query: str, chunks: List[Dict[str, str]]) -> Dict[str, str]:
    context_blocks = []
    for idx, chunk in enumerate(chunks[:6], start=1):
        context_blocks.append(
            f"Source {idx}: {chunk.get('title', '')}\nURL: {chunk.get('url', '')}\n{chunk.get('text', '')[:1600]}"
        )
    content = "\n\n".join(context_blocks)
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Question: {query}\n\nContext:\n{content}"},
                ],
            },
        ],
        "temperature": 0.2,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "citation_response",
                "schema": {
                    "type": "object",
                    "properties": {
                        "answer": {"type": "string"},
                        "citations": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "url": {"type": "string"},
                                    "snippet": {"type": "string"},
                                },
                                "required": ["title", "url", "snippet"],
                            },
                            "minItems": 1,
                            "maxItems": 3,
                        },
                    },
                    "required": ["answer", "citations"],
                },
            },
        },
    }
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=httpx.Timeout(20.0)) as client:
        response = client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
    try:
        raw_content = data["choices"][0]["message"]["content"]
        parsed = json.loads(raw_content)
        return {
            "answer": parsed.get("answer", ""),
            "citations": parsed.get("citations", []),
        }
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        raise RuntimeError("Failed to parse OpenAI response") from exc


def _extractive_fallback(query: str, chunks: List[Dict[str, str]]) -> Dict[str, List[Dict[str, str]] | str]:
    top_chunks = chunks[:3]
    if not top_chunks:
        return {
            "answer": "I could not find relevant documentation for that question.",
            "citations": [],
        }
    snippets = []
    for chunk in top_chunks:
        text = chunk.get("text", "").strip().replace("\n", " ")
        snippets.append(text[:400])
    answer = (
        f"Based on the documentation, {snippets[0]}"
        if snippets
        else "Relevant documentation snippets were not available."
    )
    answer = answer.strip()
    if answer and not answer.endswith("."):
        answer += "."
    citations = _format_citations(top_chunks)
    return {
        "answer": answer,
        "citations": citations,
    }


def synthesize_answer(query: str, chunks: List[Dict[str, str]]) -> Dict[str, List[Dict[str, str]] | str]:
    """Generate a concise answer grounded in retrieval chunks."""

    if settings.OPENAI_API_KEY:
        try:
            return _call_openai(query, chunks)
        except httpx.HTTPError:
            pass
        except RuntimeError:
            pass
    return _extractive_fallback(query, chunks)


__all__ = [
    "hybrid_search",
    "synthesize_answer",
]

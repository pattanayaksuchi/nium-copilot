"""Chunk crawled markdown files, embed them, and build hybrid indices."""

from __future__ import annotations

import argparse
import json
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
import faiss  # type: ignore

from app import settings

CHUNK_SIZE = 1000
OVERLAP = 100


@dataclass
class Chunk:
    id: str
    title: str
    url: str
    text: str


def chunk_text(text: str, *, chunk_size: int = CHUNK_SIZE, overlap: int = OVERLAP) -> List[str]:
    if not text:
        return []
    step = max(chunk_size - overlap, 1)
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk.strip())
        start += step
    return [chunk for chunk in chunks if chunk]


def load_corpus(corpus_dir: Path) -> List[Chunk]:
    metadata_path = corpus_dir / "metadata.json"
    if not metadata_path.exists():
        raise FileNotFoundError("Corpus metadata not found. Run crawl_docs.py first.")
    with metadata_path.open("r", encoding="utf-8") as handle:
        metadata = json.load(handle)
    chunks: List[Chunk] = []
    counter = 0
    for entry in metadata:
        slug = entry["slug"]
        title = entry["title"]
        url = entry["url"]
        md_path = corpus_dir / f"{slug}.md"
        if not md_path.exists():
            continue
        with md_path.open("r", encoding="utf-8") as handle:
            text = handle.read()
        for chunk_text_value in chunk_text(text):
            counter += 1
            chunk_id = f"chunk_{counter:06d}"
            chunks.append(Chunk(id=chunk_id, title=title, url=url, text=chunk_text_value))
    if not chunks:
        raise ValueError("No chunks generated from corpus.")
    return chunks


def build_dense_index(sentences: List[str], output_path: Path) -> List[str]:
    model = SentenceTransformer(settings.EMBED_MODEL)
    embeddings = model.encode(sentences, normalize_embeddings=True, show_progress_bar=True)
    embeddings = np.asarray(embeddings, dtype="float32")
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    faiss.write_index(index, str(output_path / "faiss.index"))
    return embeddings


def build_sparse_index(sentences: List[str]) -> BM25Okapi:
    tokenized = [text.lower().split() for text in sentences]
    return BM25Okapi(tokenized)


def persist_metadata(chunks: List[Chunk], output_path: Path) -> None:
    chunk_ids = [chunk.id for chunk in chunks]
    meta_map = {
        "chunk_ids": chunk_ids,
        "chunks": {
            chunk.id: {
                "title": chunk.title,
                "url": chunk.url,
                "text": chunk.text,
            }
            for chunk in chunks
        },
    }
    with (output_path / "meta.json").open("w", encoding="utf-8") as handle:
        json.dump(meta_map, handle, indent=2, ensure_ascii=True)
    with (output_path / "faiss_ids.json").open("w", encoding="utf-8") as handle:
        json.dump(chunk_ids, handle, indent=2, ensure_ascii=True)


def persist_sparse(bm25: BM25Okapi, chunk_ids: List[str], output_path: Path) -> None:
    payload = {
        "bm25": bm25,
        "chunk_ids": chunk_ids,
    }
    with (output_path / "bm25.pkl").open("wb") as handle:
        pickle.dump(payload, handle)


def rebuild_indices(corpus_dir: Path, output_dir: Path) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)
    chunks = load_corpus(corpus_dir)
    sentences = [chunk.text for chunk in chunks]
    embeddings = build_dense_index(sentences, output_dir)
    bm25 = build_sparse_index(sentences)
    persist_metadata(chunks, output_dir)
    persist_sparse(bm25, [chunk.id for chunk in chunks], output_dir)
    print(f"Processed {len(chunks)} chunks. Dense dim={embeddings.shape[1]}.")
    return len(chunks)


def main(args: Iterable[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Chunk corpus and build FAISS/BM25 indexes.")
    parser.add_argument("--corpus", type=Path, default=settings.CORPUS_DIR, help="Path to markdown corpus directory.")
    parser.add_argument("--out", type=Path, default=settings.INDEX_DIR, help="Output directory for indexes.")
    parsed = parser.parse_args(args=args)
    rebuild_indices(parsed.corpus, parsed.out)


if __name__ == "__main__":
    main()

"""Rebuild the entire retrieval pipeline (crawl -> chunk -> embed)."""

from __future__ import annotations

from typing import Iterable

from app import settings
from scripts import crawl_docs, chunk_and_embed
import json


def main(args: Iterable[str] | None = None) -> None:
    settings.ensure_directories()
    metadata = crawl_docs.crawl(crawl_docs.ALLOWED_ROOTS, settings.CORPUS_DIR)
    metadata_path = settings.CORPUS_DIR / "metadata.json"
    with metadata_path.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2, ensure_ascii=True)
    print(f"Crawled {len(metadata)} pages into {settings.CORPUS_DIR}.")
    if not metadata:
        print("No pages crawled; skipping index rebuild. Check network access or source availability.")
        return
    chunk_count = chunk_and_embed.rebuild_indices(settings.CORPUS_DIR, settings.INDEX_DIR)
    print(f"Built indexes for {chunk_count} chunks in {settings.INDEX_DIR}.")


if __name__ == "__main__":
    main()

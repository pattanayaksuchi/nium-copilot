"""Crawl approved Nium documentation pages and persist cleaned markdown."""

from __future__ import annotations

import argparse
import json
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Set, Tuple, Sequence, cast
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from bs4.element import Tag
from markdownify import markdownify
from readability import Document
from tenacity import RetryError, retry, stop_after_attempt, wait_fixed

from app import settings

ALLOWED_ROOTS = [
    "https://docs.nium.com/docs/getting-started",
    "https://docs.nium.com/api#description/introduction",
    "https://docs.nium.com/",
    "https://playbook.nium.com"
]
MAX_DEPTH = 2
USER_AGENT = "Nium-Developer-Copilot/0.1"


@dataclass
class Page:
    url: str
    depth: int


def slugify(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.strip("/") or "index"
    safe = "-".join(part for part in path.split("/") if part)
    safe = safe.replace(" ", "-").replace("_", "-")
    safe = "".join(char for char in safe if char.isalnum() or char == "-")
    if not safe:
        safe = "index"
    if parsed.fragment:
        frag = "".join(char for char in parsed.fragment if char.isalnum())
        if frag:
            safe = f"{safe}-{frag}"
    return safe.lower()


def same_host(url: str, root: str) -> bool:
    return urlparse(url).netloc == urlparse(root).netloc


def extract_links(html: str, base_url: str) -> Iterable[str]:
    soup = BeautifulSoup(html, "lxml")
    anchors: List[Tag] = cast(List[Tag], soup.select("a[href]"))
    for a in anchors:
        href = a.get("href")
        if not isinstance(href, str):
            continue
        if href.startswith(("mailto:", "#", "javascript:")):
            continue
        yield urljoin(base_url, href)


@retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
def fetch(url: str) -> httpx.Response:
    with httpx.Client(timeout=httpx.Timeout(10.0), headers={"User-Agent": USER_AGENT}) as client:
        response = client.get(url, follow_redirects=True)
        response.raise_for_status()
        return response


def to_markdown(html: str) -> Tuple[str, str]:
    document = Document(html)
    title = document.short_title()
    summary_html = document.summary(html_partial=True)
    markdown = markdownify(summary_html, heading_style="ATX")
    return title, markdown


def crawl(roots: Iterable[str], out_dir: Path) -> List[Dict[str, str]]:
    out_dir.mkdir(parents=True, exist_ok=True)
    metadata: List[Dict[str, str]] = []
    visited: Set[str] = set()
    
    # Pre-compute allowed hosts for domain-level filtering
    allowed_hosts = {urlparse(root).netloc for root in roots}
    
    queue: deque[Page] = deque(Page(url=root, depth=0) for root in roots)
    while queue:
        page = queue.popleft()
        if page.url in visited:
            continue
        visited.add(page.url)

        try:
            response = fetch(page.url)
        except (httpx.HTTPError, RetryError):
            continue
        html = response.text
        title, markdown = to_markdown(html)
        slug = slugify(page.url)
        path = out_dir / f"{slug}.md"
        with path.open("w", encoding="utf-8") as handle:
            handle.write(f"# {title}\n\n" if title else "")
            handle.write(markdown)
        metadata.append({"title": title or slug, "url": page.url, "slug": slug})

        if page.depth >= MAX_DEPTH:
            continue

        for link in extract_links(html, page.url):
            # Use domain-level filtering instead of restrictive path matching
            if urlparse(link).netloc not in allowed_hosts:
                continue
            if link in visited:
                continue
            queue.append(Page(url=link, depth=page.depth + 1))
    return metadata


def main(args: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Crawl Nium docs and build markdown corpus.")
    parser.add_argument("--out", type=Path, default=settings.CORPUS_DIR, help="Output directory for markdown files.")
    parsed = parser.parse_args(args=args)
    metadata = crawl(ALLOWED_ROOTS, parsed.out)
    meta_path = parsed.out / "metadata.json"
    with meta_path.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2, ensure_ascii=True)
    print(f"Fetched {len(metadata)} pages. Metadata written to {meta_path}.")


if __name__ == "__main__":
    main()

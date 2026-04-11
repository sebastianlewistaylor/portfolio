#!/usr/bin/env python3
"""
Scrape missing images from sebtaylor.myportfolio.com
Outputs one markdown file per project with image URLs and captions.
"""

import re
import requests
from bs4 import BeautifulSoup
from pathlib import Path

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

CDN_BASE = "cdn.myportfolio.com"

# Pages to scrape — (adobe slug, local filename, already-have image UUIDs to skip)
TARGETS = [
    {
        "adobe_url": "https://sebtaylor.myportfolio.com/internet-journal",
        "slug": "internet-journal",
        "known_uuids": [
            "a3da0af9-97e7-4623-81b8-8cdfc92f060c",
            "0a9db4a4-6b8f-4c6b-ac19-22f949c41a84",
            "10a15a54-c7ff-4a5e-83e2-c045ae3dcef2",
            "1a5ad821-00da-4c37-a9b9-3260553441e8",
        ],
    },
    {
        "adobe_url": "https://sebtaylor.myportfolio.com/humboldt-international-film-festival",
        "slug": "humboldt-film-festival",
        "known_uuids": [
            "52db805c-84ae-42bd-a98c-83ffb7ecbda5",
            "bc65f110-f1ed-433e-a448-13d897660dff",
            "c4203f82-f6d6-419e-abca-d750c227bd22",
        ],
    },
    {
        "adobe_url": "https://sebtaylor.myportfolio.com/cal-poly-humboldt-digital-laboratory",
        "slug": "digital-lab-cal-poly",
        "known_uuids": [
            "38e3c55d-eced-41c8-b008-e27c22460ae7",
            "0bc5987e-798c-44db-aee0-e6f422b36d21",
            "21fde9cb-6084-41f9-845d-3459cce72588",
            "259c1a58-8793-4db3-9092-cd1c91f465df",
            "6ff900dc-8327-45ec-9f42-e114cd7cdf5a",
        ],
    },
    {
        "adobe_url": "https://sebtaylor.myportfolio.com/cal-poly-humboldt-center-for-teaching-and-learning",
        "slug": "ctl-cal-poly",
        "known_uuids": [
            "3fb3f516-914f-4325-ab99-1f58006eaa0c",
            "c4624dba-8794-4f13-adb7-47946a04e8e3",
        ],
    },
    {
        "adobe_url": "https://sebtaylor.myportfolio.com/ijal-morgan-tired-of-resting",
        "slug": "ijal-morgan",
        "known_uuids": [
            "50e18902-6f0d-46dc-9ef4-38d484fcd246",
        ],
    },
]

OUT_DIR = Path(__file__).parent.parent / "scraped"
OUT_DIR.mkdir(exist_ok=True)


def extract_uuid(url):
    """Pull the image UUID from a CDN URL (second UUID — first is the account ID)."""
    matches = re.findall(r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", url)
    return matches[1] if len(matches) >= 2 else None


def scrape_page(target):
    slug = target["slug"]
    url = target["adobe_url"]
    known = set(target["known_uuids"])

    print(f"\n[{slug}] Fetching {url}")
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
    except Exception as e:
        print(f"  ERROR: {e}")
        return

    # Extract all CDN image URLs from page source (includes script-embedded HTML)
    all_cdn_urls = re.findall(
        r'https://cdn\.myportfolio\.com/[^\s"\']+?_rw_1920\.[a-zA-Z]+\?h=[a-f0-9]+',
        r.text
    )

    seen_uuids = set()
    images = []

    for src in all_cdn_urls:
        uuid = extract_uuid(src)
        if not uuid or uuid == "8bfe06f3-7238-48ee-935c-b9d18e79a858":
            continue  # skip account-level UUID
        # Prefer _rw_1920 URLs; skip lower-res duplicates of same UUID
        if uuid in seen_uuids:
            continue
        seen_uuids.add(uuid)
        is_new = uuid not in known
        images.append({
            "uuid": uuid,
            "url": src,
            "new": is_new,
        })

    new_images = [i for i in images if i["new"]]
    all_images = images

    print(f"  Found {len(all_images)} total images, {len(new_images)} new")

    # Write markdown
    md_path = OUT_DIR / f"{slug}.md"
    lines = [f"# {slug}\n"]
    lines.append(f"Adobe URL: {target['adobe_url']}\n")
    lines.append(f"Total images found: {len(all_images)} | New (not in local): {len(new_images)}\n")
    lines.append("\n## All images (NEW flagged)\n")

    for i, img in enumerate(all_images, 1):
        flag = " ← NEW" if img["new"] else ""
        lines.append(f"{i}. `{img['uuid']}`{flag}")
        lines.append(f"   `{img['url']}`\n")

    md_path.write_text("\n".join(lines))
    print(f"  Written: {md_path}")
    return new_images


if __name__ == "__main__":
    print("=== Portfolio Image Scraper ===")
    results = {}
    for target in TARGETS:
        new = scrape_page(target)
        if new is not None:
            results[target["slug"]] = new

    print("\n\n=== SUMMARY ===")
    for slug, imgs in results.items():
        print(f"{slug}: {len(imgs)} new images")
    print(f"\nMarkdown files written to: {OUT_DIR}/")

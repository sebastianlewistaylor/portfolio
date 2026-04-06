"""
Fetches recent Instagram posts from the Graph API, filters for
philosophical captions, and updates quotes.json.
"""

import json
import os
import re
import urllib.request
import urllib.parse

ACCESS_TOKEN = os.environ["IG_ACCESS_TOKEN"]
QUOTES_FILE  = os.path.join(os.path.dirname(__file__), "..", "quotes.json")

# ── Fetch posts ──────────────────────────────────────────────────────────────

def fetch_posts():
    """Fetch up to 100 recent media items via the Instagram Graph API."""
    params = urllib.parse.urlencode({
        "fields": "caption",
        "limit":  100,
        "access_token": ACCESS_TOKEN,
    })
    url = f"https://graph.instagram.com/me/media?{params}"
    with urllib.request.urlopen(url) as resp:
        data = json.loads(resp.read())
    posts = data.get("data", [])

    # Follow pagination to get all posts
    while "paging" in data and "next" in data["paging"]:
        with urllib.request.urlopen(data["paging"]["next"]) as resp:
            data = json.loads(resp.read())
        posts.extend(data.get("data", []))

    return posts

# ── Filter logic ─────────────────────────────────────────────────────────────

SKIP_WORDS = [
    "by ", "via ", "c/o", "photograph", "artwork", "sculpture",
    "image", "design", "article", "journal", "published",
    "link in bio", "magazine", "advertisement", "exhibition",
    "gore-tex", "mercedes", "nissan", "bmw", "ford", "subaru",
    "fiat", "ferrari", "lada", "toyota", "porsche", "salomon",
    "lounge chair", "sofa", "hi-fi", "nuclear", "engineering ref",
    "g wagon", "range rover", "land rover", "enchanted memes",
    "sacred geometric", "volume i", "volume ii", "volume iii",
    "volume iv", "volume v", "volume vi", "volume vii", "volume viii",
    "#faux", "www.", "bape", "nigo",
]

def is_philosophical(caption: str) -> bool:
    """Return True if the caption looks like a standalone philosophical quote."""
    # Must be a single line
    lines = [l.strip() for l in caption.strip().splitlines() if l.strip()]
    if len(lines) != 1:
        return False

    line = lines[0]

    # No @mentions
    if "@" in line:
        return False

    # Must contain the ® watermark (confirms it's an original Seb post)
    if "®" not in line and "\u00ae" not in line:
        return False

    # Strip the watermark suffix to get the clean quote
    clean = re.sub(r"[\s®✨™\u00ae\u2728]+$", "", line).strip()

    # Length: at least 3 words, no more than ~120 chars
    words = clean.split()
    if len(words) < 3 or len(clean) > 120:
        return False

    # Skip known non-philosophical patterns
    lower = clean.lower()
    if any(s in lower for s in SKIP_WORDS):
        return False

    # Skip year-in-parens (artwork/product titles)
    if re.search(r"\(\d{4}", clean):
        return False

    return True

def clean_caption(caption: str) -> str:
    line = caption.strip().splitlines()[0].strip()
    return re.sub(r"[\s®✨™\u00ae\u2728]+$", "", line).strip()

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    # Load existing quotes
    with open(QUOTES_FILE) as f:
        existing = json.load(f)
    existing_set = {q.lower() for q in existing}

    # Fetch and filter
    posts    = fetch_posts()
    captions = [p.get("caption", "") for p in posts if p.get("caption")]
    new_quotes = []

    for caption in captions:
        if is_philosophical(caption):
            quote = clean_caption(caption)
            if quote.lower() not in existing_set:
                new_quotes.append(quote)
                existing_set.add(quote.lower())

    if not new_quotes:
        print("No new quotes found.")
        return

    print(f"Adding {len(new_quotes)} new quote(s):")
    for q in new_quotes:
        print(f"  + {q}")

    updated = existing + new_quotes
    with open(QUOTES_FILE, "w") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)
    print("quotes.json updated.")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


API_URL = "https://api.supermemory.ai/v4/profile"
API_KEY_FILE = Path("/data/.openclaw/workspace/.supermemory_api_key")
TRIVIAL_QUERIES = {
    "hi",
    "hey",
    "hello",
    "yo",
    "sup",
    "ok",
    "okay",
    "thanks",
    "thank you",
    "you ok",
    "you okay",
}


def clean(value: str) -> str:
    return " ".join(str(value or "").strip().split())


def is_trivial(query: str) -> bool:
    normalized = clean(query).lower().rstrip("!?.,")
    return normalized in TRIVIAL_QUERIES or len(normalized) < 3


def read_api_key() -> str:
    api_key = clean(os.environ.get("SUPERMEMORY_API_KEY", ""))
    if api_key:
        return api_key
    if API_KEY_FILE.exists():
        return clean(API_KEY_FILE.read_text())
    return ""


def container_tag(chat_id: str, user_id: str) -> str:
    raw = chat_id or user_id or "default"
    safe = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in raw)
    return f"telegram_{safe}"


def excerpt(text: str, limit: int = 220) -> str:
    compact = clean(text)
    if len(compact) <= limit:
        return compact
    return compact[: limit - 3].rstrip() + "..."


def join_profile_items(value) -> str:
    if isinstance(value, list):
        return clean("; ".join(str(item) for item in value if clean(item)))
    return clean(value)


def post_json(url: str, payload: dict, api_key: str) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--chat-id", default="")
    parser.add_argument("--user-id", default="")
    parser.add_argument("--query", default="")
    parser.add_argument("--threshold", type=float, default=0.55)
    parser.add_argument("--limit", type=int, default=5)
    args = parser.parse_args()

    query = clean(args.query)
    if not query or is_trivial(query):
        print(json.dumps({"ok": True, "configured": bool(read_api_key()), "skipped": True}))
        return 0

    api_key = read_api_key()
    if not api_key:
        print(json.dumps({"ok": True, "configured": False, "skipped": True}))
        return 0

    payload = {
        "containerTag": container_tag(args.chat_id, args.user_id),
        "q": query,
        "threshold": args.threshold,
    }

    try:
        data = post_json(API_URL, payload, api_key)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        print(json.dumps({"ok": False, "configured": True, "error": f"http_{exc.code}", "detail": detail}))
        return 1
    except Exception as exc:
        print(json.dumps({"ok": False, "configured": True, "error": str(exc)}))
        return 1

    profile = data.get("profile") or {}
    static_memory = join_profile_items(profile.get("static") or data.get("static") or "")
    dynamic_memory = join_profile_items(profile.get("dynamic") or data.get("dynamic") or "")
    search_results = data.get("searchResults") if isinstance(data.get("searchResults"), dict) else {}
    results = (
        search_results.get("results")
        or data.get("results")
        or data.get("memories")
        or []
    )

    normalized_results = []
    for item in results[: args.limit]:
        score = item.get("score")
        metadata = item.get("metadata") if isinstance(item.get("metadata"), dict) else {}
        text = item.get("content") or item.get("memory") or item.get("text") or item.get("document") or ""
        normalized_results.append(
            {
                "score": score,
                "content": excerpt(text),
                "metadata": metadata,
            }
        )

    summary_parts = []
    if static_memory:
        summary_parts.append(f"Stable user context: {static_memory}")
    if dynamic_memory:
        summary_parts.append(f"Current context: {dynamic_memory}")
    if normalized_results:
        snippets = "; ".join(
            f"[{i + 1}] {item['content']}" for i, item in enumerate(normalized_results) if item.get("content")
        )
        if snippets:
            summary_parts.append(f"Relevant memory: {snippets}")

    print(
        json.dumps(
            {
                "ok": True,
                "configured": True,
                "containerTag": payload["containerTag"],
                "profile": {
                    "static": static_memory,
                    "dynamic": dynamic_memory,
                },
                "results": normalized_results,
                "summary": " ".join(summary_parts).strip(),
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


API_URL = "https://api.supermemory.ai/v3/documents"
API_KEY_FILE = Path("/data/.openclaw/workspace/.supermemory_api_key")
def clean(value: str) -> str:
    return " ".join(str(value or "").strip().split())


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


def is_metadata_noise(user_message: str) -> bool:
    normalized = clean(user_message).lower().rstrip("!?.,")
    if not normalized:
        return True
    if normalized.startswith("/"):
        return True
    noise_markers = (
        "conversation info (untrusted metadata):",
        "system reboot successful",
        "pre-compaction memory flush",
        "heartbeat_ok",
        "no_reply",
        "protocols restored",
        "memory synced",
        "startup files",
    )
    return any(marker in normalized for marker in noise_markers)


def build_custom_id(chat_id: str, message_id: str, user_message: str) -> str:
    if chat_id and message_id:
        base = f"telegram-{chat_id}-msg-{message_id}"
    else:
        digest = hashlib.sha1(clean(user_message).encode("utf-8")).hexdigest()[:16]
        base = f"telegram-turn-{digest}"
    safe = "".join(ch if ch.isalnum() or ch in ("-", "_", ".") else "_" for ch in base)
    return safe[:100]


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
    parser.add_argument("--message-id", default="")
    parser.add_argument("--user-message", default="")
    parser.add_argument("--assistant-message", default="")
    parser.add_argument("--source", default="openclaw")
    args = parser.parse_args()

    user_message = clean(args.user_message)
    assistant_message = clean(args.assistant_message)
    if is_metadata_noise(user_message) or not assistant_message:
        print(json.dumps({"ok": True, "configured": bool(read_api_key()), "skipped": True}))
        return 0

    api_key = read_api_key()
    if not api_key:
        print(json.dumps({"ok": True, "configured": False, "skipped": True}))
        return 0

    content = "\n".join(
        [
            "Telegram conversation turn",
            f"User: {user_message}",
            f"Assistant: {assistant_message}",
        ]
    )
    payload = {
        "content": content,
        "customId": build_custom_id(args.chat_id, args.message_id, user_message),
        "containerTag": container_tag(args.chat_id, args.user_id),
        "metadata": {
            "source": clean(args.source),
            "channel": "telegram",
            "chatId": clean(args.chat_id),
            "userId": clean(args.user_id),
            "messageId": clean(args.message_id),
            "kind": "chat_turn",
        },
        "entityContext": "Long-term memory for Dignitate Claw Telegram chats. Prefer stable user facts, ongoing projects, preferences, commitments, social links, and recurring themes over filler.",
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

    print(
        json.dumps(
            {
                "ok": True,
                "configured": True,
                "containerTag": payload["containerTag"],
                "customId": payload["customId"],
                "response": data,
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

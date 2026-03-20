import sys
import json
import urllib.request
import urllib.error

WEBHOOK_URL = "http://187.77.178.148:5678/webhook/openclaw"
SHARED_SECRET = "my_secure_secret_12345"


def _normalize_id(value):
    if value is None:
        return value
    s = str(value).strip()
    if s.startswith("telegram:"):
        s = s.split(":", 1)[1].strip()
    return s


def normalize_payload(data):
    if not isinstance(data, dict):
        return data
    out = dict(data)
    if "chatId" in out:
        out["chatId"] = _normalize_id(out.get("chatId"))
    if "userId" in out:
        out["userId"] = _normalize_id(out.get("userId"))
    return out


def trigger_n8n(data):
    payload = normalize_payload(data)
    headers = {
        "Content-Type": "application/json",
        "X-OpenClaw-Secret": SHARED_SECRET,
    }

    req = urllib.request.Request(
        WEBHOOK_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return f"HTTP Error: {e.code} - {e.read().decode('utf-8')}"
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 trigger_n8n.py <payload_json>")
        sys.exit(1)
    
    try:
        payload = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print("Error: Invalid JSON payload.")
        sys.exit(1)
        
    res = trigger_n8n(payload)
    print("Webhook response:", res)

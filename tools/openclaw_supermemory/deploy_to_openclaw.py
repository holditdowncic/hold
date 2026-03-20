#!/usr/bin/env python3
import argparse
import shlex
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FILES = {
    ROOT / "SKILL.md": "/docker/openclaw-iwv9/data/.openclaw/workspace/skills/supermemory-memory/SKILL.md",
    ROOT / "get_context.py": "/docker/openclaw-iwv9/data/.openclaw/workspace/skills/supermemory-memory/scripts/get_context.py",
    ROOT / "store_turn.py": "/docker/openclaw-iwv9/data/.openclaw/workspace/skills/supermemory-memory/scripts/store_turn.py",
}


REMOTE_PATCH = r"""
from pathlib import Path

updates = {
    Path('/docker/openclaw-iwv9/data/.openclaw/workspace/AGENTS.md'): "\n## Supermemory Long-Term Memory\n- For meaningful natural-language chat that is not routed to n8n, use the supermemory-memory skill.\n- Before replying, recall relevant context with the current message. Use that context silently.\n- After replying, store the user message plus your final reply.\n- If Supermemory is not configured or returns nothing useful, continue naturally without mentioning it.\n",
    Path('/docker/openclaw-iwv9/data/.openclaw/workspace/TOOLS.md'): "\n### Supermemory Long-Term Memory\nFor normal chat that is not a workflow command, use the supermemory-memory skill to recall user context before replying and store meaningful turns afterward.\n- API key source: SUPERMEMORY_API_KEY or /data/.openclaw/workspace/.supermemory_api_key\n- Never mention Supermemory unless the user asks.\n- If Supermemory is unavailable, continue normally.\n",
    Path('/docker/openclaw-iwv9/data/.openclaw/workspace/USER.md'): "\n## Long-Term Memory\n- For normal chat, use Supermemory silently when available.\n- Do not use it for slash commands or n8n callbacks.\n- If no memory is available, answer normally without mentioning it.\n",
}

for path, block in updates.items():
    text = path.read_text()
    header = block.splitlines()[1]
    if header in text:
        continue
    path.write_text(text.rstrip() + "\n" + block)
"""


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="root@187.77.178.148")
    parser.add_argument("--key", default=str(Path.home() / ".ssh" / "id_ed25519_vps"))
    args = parser.parse_args()

    ssh_base = ["ssh", "-i", args.key, args.host]
    scp_base = ["scp", "-i", args.key]

    run(ssh_base + ["mkdir -p /docker/openclaw-iwv9/data/.openclaw/workspace/skills/supermemory-memory/scripts"])
    for source, target in FILES.items():
        run(scp_base + [str(source), f"{args.host}:/tmp/{source.name}"])
        remote_cmd = f"install -m {'755' if source.suffix == '.py' else '644'} /tmp/{source.name} {target}"
        run(ssh_base + [remote_cmd])

    run(
        ssh_base
        + [
            "touch /docker/openclaw-iwv9/data/.openclaw/workspace/.supermemory_api_key && "
            "chmod 600 /docker/openclaw-iwv9/data/.openclaw/workspace/.supermemory_api_key"
        ]
    )

    remote_python = "python3 - <<'PY'\n" + REMOTE_PATCH + "\nPY"
    run(ssh_base + [remote_python])

    run(ssh_base + ["cd /docker/openclaw-iwv9 && docker compose restart openclaw && sleep 15 && docker logs --since 40s openclaw-iwv9-openclaw-1 2>&1"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

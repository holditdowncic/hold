#!/usr/bin/env python3
import json
from pathlib import Path


FILES = [
    Path("/Users/srikarreddy/Downloads/DemContent/dignitate-workflow-v3-stable.json"),
    Path("/Users/srikarreddy/Downloads/DemContent/.tmp-workflow-live.json"),
]


OLD_EXTRACT = """  const lines = rest.split(/\\r?\\n/).map((x) => x.trim()).filter(Boolean);
  const ignore = (line) => /sent\\s+automatically\\s+with\\s+n8n/i.test(line);
  const first = lines.find((x) => !ignore(x)) || '';
  return normalizeTopic(first);"""

NEW_EXTRACT = """  const lines = rest.split(/\\r?\\n/).map((x) => x.trim()).filter(Boolean);
  const ignore = (line) =>
    /sent\\s+automatically\\s+with\\s+n8n/i.test(line) ||
    /^(tap a button below|talking head|kling multi-clip)$/i.test(line);
  const kept = lines.filter((x) => !ignore(x));
  const joined = normalizeTopic(kept.join(' '));
  if (!joined) return '';
  return joined.length > 1800 ? (joined.slice(0, 1797) + '...') : joined;"""

NEW_CHOOSE_TEXT = """={{ (() => {
  const input = String($json.args || '').trim();
  const preview = input.length > 1000 ? (input.slice(0, 1000) + '...') : input;
  return "Choose video style" + (preview ? ("\\n\\nI will use this input:\\n" + preview) : "");
})() }}"""


def load_workflow(path: Path):
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw, True
    return raw, False


def save_workflow(path: Path, workflow, wrap_as_list: bool):
    payload = [workflow] if wrap_as_list else workflow
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def patch_workflow(path: Path):
    raw, wrap_as_list = load_workflow(path)
    wf = raw[0] if wrap_as_list else raw
    nodes = wf.get("nodes", [])

    patched_extract = False
    patched_choose_text = False

    for node in nodes:
        if node.get("name") == "Quick Parse Slash":
            code = node.get("parameters", {}).get("jsCode", "")
            if OLD_EXTRACT in code:
                node["parameters"]["jsCode"] = code.replace(OLD_EXTRACT, NEW_EXTRACT)
                patched_extract = True
            elif NEW_EXTRACT in code:
                patched_extract = True

        if node.get("name") == "Video - Choose Mode":
            node.setdefault("parameters", {})["text"] = NEW_CHOOSE_TEXT
            patched_choose_text = True

    if not patched_extract:
        raise RuntimeError(f"{path}: failed to patch extractTopicFromChooseVideoMessage block")
    if not patched_choose_text:
        raise RuntimeError(f"{path}: failed to patch Video - Choose Mode text")

    save_workflow(path, wf, wrap_as_list)
    print(f"patched: {path}")


def main():
    for f in FILES:
        patch_workflow(f)


if __name__ == "__main__":
    main()


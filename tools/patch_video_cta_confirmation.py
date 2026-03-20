#!/usr/bin/env python3
import json
from pathlib import Path


FILES = [
    Path("/Users/srikarreddy/Downloads/DemContent/.tmp-workflow-live.json"),
    Path("/Users/srikarreddy/Downloads/DemContent/dignitate-workflow-v3-stable.json"),
]


NEW_CHOOSE_MODE_TEXT = """={{ (() => {
  const input = String($json.args || '').trim();
  const preview = input.length > 1000 ? (input.slice(0, 1000) + '...') : input;
  const cta = 'Follow Dignitate for support.';
  return "Choose video style" +
    (preview ? ("\\n\\nI will use this input:\\n" + preview) : "") +
    "\\n\\nEnding line (always added): " + cta;
})() }}"""


CTA_HELPER = """const CTA_LINE = "Follow Dignitate for support.";

function ensureCtaEnding(text, maxWords) {
  let t = clean(text)
    .replace(/\\bfollow\\s+dignitate(?:\\s+for\\s+support)?\\.?/ig, " ")
    .replace(/\\s+/g, " ")
    .trim();

  if (!t) return CTA_LINE;

  t = t.replace(/[.!?]*$/g, "").trim();
  let out = `${t}. ${CTA_LINE}`;

  if (countWords(out) > maxWords) {
    const keepWords = Math.max(1, maxWords - countWords(CTA_LINE));
    const trimmed = trimToWords(t, keepWords).replace(/[.!?]*$/g, "").trim();
    out = `${trimmed}. ${CTA_LINE}`;
  }

  return clean(out);
}

"""


def patch_parse_video_response(js: str) -> str:
    if "function ensureCtaEnding(text, maxWords)" not in js:
        marker = "function estimateDurationForNarration"
        if marker not in js:
            raise ValueError("Could not find estimateDuration marker in Parse Video Response")
        js = js.replace(marker, CTA_HELPER + marker, 1)

    js = js.replace(
        'const fallbackCta = "Follow Dignitate for support.";',
        "const fallbackCta = CTA_LINE;",
    )

    full_narration_line = "const fullNarration = clean(scenes.map((s) => s.narration).join(' '));"
    if "ensureCtaEnding(scenes[0].narration, 85)" not in js:
        enforcement = """if (TARGET_SCENES === 1 && scenes[0]) {
  scenes[0] = {
    ...scenes[0],
    narration: ensureCtaEnding(scenes[0].narration, 85),
  };
} else if (scenes.length) {
  const lastIdx = scenes.length - 1;
  scenes[lastIdx] = {
    ...scenes[lastIdx],
    narration: ensureCtaEnding(scenes[lastIdx].narration, 30),
  };
}

"""
        if full_narration_line not in js:
            raise ValueError("Could not find fullNarration line in Parse Video Response")
        js = js.replace(full_narration_line, enforcement + full_narration_line, 1)

    if 'caption = `${clean(caption).replace(/[.!?]*$/g, "").trim()}. ${CTA_LINE}`;' not in js:
        after_caption = 'if (isLeakText(caption)) caption = `${title}. ${actions[0] || "Take one practical step this week."} Follow Dignitate for support.`;'
        add_caption_guard = """if (!/follow\\s+dignitate\\s+for\\s+support\\.?$/i.test(caption)) {
  caption = `${clean(caption).replace(/[.!?]*$/g, "").trim()}. ${CTA_LINE}`;
}
"""
        if after_caption not in js:
            raise ValueError("Could not find caption fallback line in Parse Video Response")
        js = js.replace(after_caption, after_caption + "\n" + add_caption_guard, 1)

    return js


def patch_file(path: Path) -> bool:
    payload = json.loads(path.read_text())
    wf = payload[0] if isinstance(payload, list) else payload

    changed = False
    for node in wf.get("nodes", []):
        if node.get("name") == "Video - Choose Mode":
            if node.get("parameters", {}).get("text") != NEW_CHOOSE_MODE_TEXT:
                node.setdefault("parameters", {})["text"] = NEW_CHOOSE_MODE_TEXT
                changed = True
        if node.get("name") == "Parse Video Response":
            old_js = node.get("parameters", {}).get("jsCode", "")
            new_js = patch_parse_video_response(old_js)
            if new_js != old_js:
                node.setdefault("parameters", {})["jsCode"] = new_js
                changed = True

    if changed:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    return changed


def main() -> None:
    for path in FILES:
        if not path.exists():
            print(f"skip {path} (missing)")
            continue
        changed = patch_file(path)
        print(f"{path}: {'patched' if changed else 'no changes'}")


if __name__ == "__main__":
    main()

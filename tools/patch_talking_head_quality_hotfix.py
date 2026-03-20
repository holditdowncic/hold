#!/usr/bin/env python3
import json
from pathlib import Path


WORKFLOW_FILES = [
    Path("/Users/srikarreddy/Downloads/DemContent/.tmp-workflow-live.json"),
    Path("/Users/srikarreddy/Downloads/DemContent/dignitate-workflow-v3-stable.json"),
]


def patch_openrouter_video_script(node: dict) -> bool:
    params = node.get("parameters", {})
    body = params.get("jsonBody")
    if not isinstance(body, str):
        return False
    old = body
    body = body.replace(
        "TASK: Write ONE vertical short as a TALKING-HEAD presenter clip: exactly 1 scene (30 seconds).",
        "TASK: Write ONE vertical short as a TALKING-HEAD presenter clip: exactly 1 scene (18 seconds).",
    )
    body = body.replace(
        "- Narration: 65-82 words. Include hook + 2 points + 1 practical step + CTA: Follow Dignitate for support.",
        "- Narration: 38-50 words. Include hook + 1-2 key points + 1 practical step + CTA: Follow Dignitate for support.",
    )
    body = body.replace('\\"duration\\":30', '\\"duration\\":18')
    params["jsonBody"] = body
    node["parameters"] = params
    return body != old


def patch_parse_video_response(node: dict) -> bool:
    params = node.get("parameters", {})
    js = params.get("jsCode")
    if not isinstance(js, str):
        return False
    old = js
    js = js.replace(
        'const DEFAULT_SCENE_DURATION_SEC = mode === "talking_head" ? 30 : 12;',
        'const DEFAULT_SCENE_DURATION_SEC = mode === "talking_head" ? 18 : 12;',
    )
    js = js.replace("trimToWords(narrationBase, 85)", "trimToWords(narrationBase, 48)")
    js = js.replace("ensureCtaEnding(scenes[0].narration, 85)", "ensureCtaEnding(scenes[0].narration, 48)")
    js = js.replace("trimToWords(\n  `${fallbackHook} ${actions[0] || \"One practical step: write one clear support request and share it today.\"} ${actions[1] || fallbackAction} ${fallbackCta}`,\n  82\n)", "trimToWords(\n  `${fallbackHook} ${actions[0] || \"One practical step: write one clear support request and share it today.\"} ${actions[1] || fallbackAction} ${fallbackCta}`,\n  48\n)")
    params["jsCode"] = js
    node["parameters"] = params
    return js != old


def patch_resolve_founder_portrait(node: dict) -> bool:
    params = node.get("parameters", {})
    js = params.get("jsCode")
    if not isinstance(js, str):
        return False
    old = js
    js = js.replace(
        "const clipIdentityImageUrl = generatedPortraitUrl || originalCreatorUrl;",
        "const clipIdentityImageUrl = originalCreatorUrl || generatedPortraitUrl;",
    )
    js = js.replace(
        "const founderPortraitSource = generatedPortraitUrl\n  ? (originalCreatorUrl ? 'generated_variant_used' : 'generated_only')\n  : (originalCreatorUrl ? 'fallback_profile' : 'none');",
        "const founderPortraitSource = originalCreatorUrl\n  ? 'profile_locked'\n  : (generatedPortraitUrl ? 'generated_only' : 'none');",
    )
    params["jsCode"] = js
    node["parameters"] = params
    return js != old


def patch_package_video_data(node: dict) -> bool:
    params = node.get("parameters", {})
    js = params.get("jsCode")
    if not isinstance(js, str):
        return False
    old = js
    js = js.replace(
        'const duration = asNumber(s?.duration, mode === "talking_head" ? 30 : 12);',
        'const duration = asNumber(s?.duration, mode === "talking_head" ? 18 : 12);',
    )
    params["jsCode"] = js
    node["parameters"] = params
    return js != old


def patch_file(path: Path) -> None:
    payload = json.loads(path.read_text())
    wf = payload[0] if isinstance(payload, list) else payload
    changed = False
    for node in wf.get("nodes", []):
        name = node.get("name", "")
        if name == "OpenRouter - Video Script":
            changed = patch_openrouter_video_script(node) or changed
        elif name == "Parse Video Response":
            changed = patch_parse_video_response(node) or changed
        elif name == "Resolve Founder Portrait URL":
            changed = patch_resolve_founder_portrait(node) or changed
        elif name == "Package Video Data":
            changed = patch_package_video_data(node) or changed
    if changed:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"{path}: {'patched' if changed else 'no changes'}")


def main() -> None:
    for wf in WORKFLOW_FILES:
        if wf.exists():
            patch_file(wf)
        else:
            print(f"{wf}: missing")


if __name__ == "__main__":
    main()

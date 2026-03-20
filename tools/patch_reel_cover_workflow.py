#!/usr/bin/env python3
import json
from pathlib import Path


WORKFLOW_FILES = [
    Path("/Users/srikarreddy/Downloads/DemContent/dignitate-workflow-v3-stable.json"),
    Path("/Users/srikarreddy/Downloads/DemContent/.tmp-workflow-live.json"),
    Path("/Users/srikarreddy/Downloads/DemContent/.tmp-workflow-post.json"),
]


PREPARE_VIDEO_POST_DATA_JS = """function clean(s) {
  return String(s || '').replace(/[\\r\\n]+/g, ' ').replace(/\\s+/g, ' ').trim();
}

function uniqHashtags(list) {
  const out = [];
  const seen = new Set();
  for (const raw of (Array.isArray(list) ? list : [])) {
    let h = clean(raw);
    if (!h) continue;
    if (!h.startsWith('#')) h = '#' + h;
    const k = h.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(h);
  }
  return out;
}

function normalizeGithubRawUrl(u) {
  const s = clean(u);
  const m = s.match(/^https?:\\/\\/github\\.com\\/([^\\/]+)\\/([^\\/]+)\\/blob\\/([^\\/]+)\\/(.+)$/i);
  if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
  return s;
}

function normalizeUrlList(list) {
  const out = [];
  const seen = new Set();
  for (const raw of (Array.isArray(list) ? list : [])) {
    const u = normalizeGithubRawUrl(raw);
    if (!/^https?:\\/\\//i.test(u)) continue;
    const key = u.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u);
  }
  return out;
}

const j = $input.first().json || {};
if (j.error) return [{ json: j }];

const staticData = $getWorkflowStaticData('global');
if (!staticData.creatorProfileByChat) staticData.creatorProfileByChat = {};

const chatId = j.chatId;
const title = clean(j.title || j.args || 'Dignitate Video');
const caption = clean(j.caption || 'Research-backed guidance for carers with clear next steps.');
const hashtags = uniqHashtags(j.hashtags || []).slice(0, 12);

const videoUrl = clean(j.finalVideoUrl || j.videoUrl || '');
if (!videoUrl) {
  return [{
    json: {
      chatId,
      error: true,
      message: 'Video is not rendered yet (no MP4 URL found). Please wait for the render to finish, then approve again.'
    }
  }];
}

const creatorDefaults = normalizeUrlList([
  'https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_casual.png',
  'https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_houndstooth.png',
  'https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_suit.png',
  'https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_shirt.png',
  'https://srv1417199.hstgr.cloud/public/founders/malcolm-20260310-portrait-01.jpeg',
  'https://srv1417199.hstgr.cloud/public/founders/malcolm-20260310-portrait-03.jpeg',
  'https://srv1417199.hstgr.cloud/public/founders/malcolm-20260310-portrait-06.jpeg',
  'https://srv1417199.hstgr.cloud/public/founders/malcolm-20260310-video-frame-01.jpg'
]);

const profile = staticData.creatorProfileByChat[String(chatId || '')] || staticData.creatorProfileByChat[String(staticData.defaultChatId || '')] || {};
const profilePool = normalizeUrlList(profile.faceUrls || []);
const incomingPool = normalizeUrlList(j.creatorImageUrls || []);
const preferredCoverImageUrl = clean(
  j.coverImageUrl ||
  j.generatedFounderPortraitUrl ||
  j.creatorImageUrl ||
  profile.faceUrl ||
  incomingPool[0] ||
  profilePool[0] ||
  creatorDefaults[0] ||
  ''
);

let generatedCoverUrl = clean(j.coverImageUrl || '');
if (!generatedCoverUrl && preferredCoverImageUrl) {
  const coverLabel = j.sourceVideoUrl ? 'MEETING REEL' : 'DIGNITATE REEL';
  try {
    const coverResp = await this.helpers.httpRequest({
      method: 'POST',
      url: 'http://187.77.178.148:3001/cover/founder-reel',
      body: {
        imageUrl: preferredCoverImageUrl,
        title,
        label: coverLabel,
      },
      json: true,
    });
    generatedCoverUrl = clean(coverResp?.coverUrl || '');
  } catch (error) {
    generatedCoverUrl = '';
  }
}

const igCaption = [title, caption, hashtags.join(' ')].filter(Boolean).join('\\n\\n').slice(0, 2100);

const ytTitleBase = title.length > 90 ? title.slice(0, 87).trim() + '...' : title;
const ytTitle = (ytTitleBase + ' #Shorts').slice(0, 100);
const ytDescription = [caption, '', hashtags.join(' '), '#Shorts'].filter(Boolean).join('\\n').slice(0, 4500);

const ttCaption = (caption + (hashtags.length ? (' ' + hashtags.slice(0, 8).join(' ')) : '')).slice(0, 2000);

// Composio v2 requires UUID connectedAccountIds for TikTok/YouTube (not the ac_ ids used in v1).
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// If you only have Composio Auth Config IDs (ac_...), use entityId mode.
const rawTikTokId = '';
const rawYouTubeId = 'ac_45guMz9S841I';

const tiktokConnectedAccountUuid = uuidRe.test(rawTikTokId) ? rawTikTokId : '';
const youtubeConnectedAccountUuid = uuidRe.test(rawYouTubeId) ? rawYouTubeId : '';

const tiktokEntityId = (!tiktokConnectedAccountUuid && rawTikTokId) ? rawTikTokId : '';
const youtubeEntityId = (!youtubeConnectedAccountUuid && rawYouTubeId) ? rawYouTubeId : '';

return [{
  json: {
    ...j,
    type: 'video',
    chatId,
    title,
    caption,
    hashtags,
    videoUrl,
    instagramCaption: igCaption,
    instagramCoverUrl: generatedCoverUrl,
    coverImageUrl: generatedCoverUrl,
    coverSourceImageUrl: preferredCoverImageUrl,
    youtubeTitle: ytTitle,
    youtubeDescription: ytDescription,
    youtubeThumbnailUrl: generatedCoverUrl,
    tiktokCaption: ttCaption,

    // Prefer connectedAccount UUIDs; otherwise fall back to entityId mode.
    tiktokConnectedAccountUuid,
    youtubeConnectedAccountUuid,
    tiktokEntityId,
    youtubeEntityId,

    connectedAccountValidation: {
      rawTikTokId,
      rawYouTubeId,
      tiktokValidUuid: Boolean(tiktokConnectedAccountUuid),
      youtubeValidUuid: Boolean(youtubeConnectedAccountUuid),
      tiktokHasEntityId: Boolean(tiktokEntityId),
      youtubeHasEntityId: Boolean(youtubeEntityId)
    }
  }
}];"""


INSTAGRAM_REELS_JSON_BODY = """={{ JSON.stringify({ connectedAccountId: 'ac_KNBQiWjdvioh', input: Object.assign({ caption: $json.instagramCaption || '', video_url: $json.videoUrl, media_url: $json.videoUrl, is_carousel: false, media_type: 'REELS' }, ($json.instagramCoverUrl ? { cover_url: $json.instagramCoverUrl } : {})) }) }}"""


def load_workflow(path: Path):
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw[0], True
    return raw, False


def save_workflow(path: Path, workflow, wrap_as_list: bool):
    payload = [workflow] if wrap_as_list else workflow
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def patch_workflow(path: Path):
    if not path.exists():
      print(f"skip missing: {path}")
      return

    workflow, wrap_as_list = load_workflow(path)
    nodes = workflow.get("nodes", [])
    patched_prepare = False
    patched_ig = False

    for node in nodes:
      if node.get("name") == "Prepare Video Post Data":
        node.setdefault("parameters", {})["jsCode"] = PREPARE_VIDEO_POST_DATA_JS
        patched_prepare = True
      elif node.get("name") == "Composio - Instagram Reels":
        node.setdefault("parameters", {})["jsonBody"] = INSTAGRAM_REELS_JSON_BODY
        patched_ig = True

    if not patched_prepare or not patched_ig:
      raise RuntimeError(f"{path}: missing target nodes for reel cover patch")

    save_workflow(path, workflow, wrap_as_list)
    print(f"patched: {path}")


def main():
    for path in WORKFLOW_FILES:
        patch_workflow(path)


if __name__ == "__main__":
    main()

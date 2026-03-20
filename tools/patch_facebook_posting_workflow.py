#!/usr/bin/env python3
import json
from pathlib import Path


WORKFLOW_FILES = [
    Path("/Users/srikarreddy/Downloads/DemContent/dignitate-workflow-v3-stable.json"),
    Path("/Users/srikarreddy/Downloads/DemContent/.tmp-workflow-live.json"),
    Path("/Users/srikarreddy/Downloads/DemContent/.tmp-workflow-post.json"),
]

DEFAULT_FACEBOOK_PAGE_ID = "672136448"


FACEBOOK_CAROUSEL_NODE = {
    "parameters": {
        "method": "POST",
        "url": "https://backend.composio.dev/api/v1/actions/FACEBOOK_CREATE_PHOTO_POST/execute",
        "sendHeaders": True,
        "headerParameters": {
            "parameters": [
                {
                    "name": "x-api-key",
                    "value": "={{ $('TEST_KEYS').first().json.composioKey }}"
                },
                {
                    "name": "Content-Type",
                    "value": "application/json"
                }
            ]
        },
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ connectedAccountId: 'ac_sMO7kC-5c-L9', input: { page_id: $('Prepare Post Data').first().json.facebookPageId || '', url: $('Prepare Post Data').first().json.imageUrl, message: $('Prepare Post Data').first().json.facebookText || '', published: true } }) }}",
        "options": {}
    },
    "id": "a0b1c2d3-e4f5-6789-abcd-000000000200",
    "name": "Composio - Facebook",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [1480, 560],
    "onError": "continueRegularOutput",
    "continueOnFail": True
}


FACEBOOK_VIDEO_NODE = {
    "parameters": {
        "method": "POST",
        "url": "https://backend.composio.dev/api/v1/actions/FACEBOOK_CREATE_VIDEO_POST/execute",
        "sendHeaders": True,
        "headerParameters": {
            "parameters": [
                {
                    "name": "x-api-key",
                    "value": "={{ $('TEST_KEYS').first().json.composioKey }}"
                },
                {
                    "name": "Content-Type",
                    "value": "application/json"
                }
            ]
        },
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ connectedAccountId: 'ac_sMO7kC-5c-L9', input: { page_id: $json.facebookPageId || '', file_url: $json.videoUrl, title: $json.title || '', description: $json.facebookCaption || '', published: true } }) }}",
        "options": {}
    },
    "id": "a0b1c2d3-e4f5-6789-abcd-000000000201",
    "name": "Composio - Facebook Video",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [3280, 1460],
    "onError": "continueRegularOutput",
    "continueOnFail": True
}


PREPARE_POST_DATA_JS = """function clean(s) {
  return String(s || '').replace(/[\\r\\n]+/g, ' ').replace(/\\s+/g, ' ').trim();
}

function stripPrefixes(text) {
  return clean(text)
    .replace(/^why this matters now:\\s*/i, '')
    .replace(/^what changed:\\s*/i, '')
    .replace(/^evidence update:\\s*/i, '')
    .replace(/^what this means for carers:\\s*/i, '')
    .replace(/^what carers can do next:\\s*/i, '')
    .trim();
}

function uniqHashtags(list) {
  const out = [];
  const seen = new Set();
  for (const raw of (Array.isArray(list) ? list : [])) {
    let h = clean(raw);
    if (!h) continue;
    if (!h.startsWith('#')) h = '#' + h;
    const key = h.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}

const input = $input.first().json || {};
let data = { ...input };

// After Telegram confirmation nodes, payload can be replaced by Telegram API response.
// Recover canonical approved content from Handle Approval when needed.
const looksLikeTelegramOnly = !data.title && !data.caption && !Array.isArray(data.slides) && !data.imageUrl;
if (looksLikeTelegramOnly) {
  try {
    const approved = $('Handle Approval').first().json || {};
    data = { ...approved };
  } catch (e) {}
}

const title = clean(data.title || data.args || 'Dementia Care Update');
const slides = Array.isArray(data.slides) ? data.slides : [];
const allImageUrls = Array.isArray(data.allImageUrls) ? data.allImageUrls.filter(Boolean) : [];
const imageUrl = clean(data.imageUrl || allImageUrls[0] || '');
const chatId = data.chatId;
const type = clean(data.type || 'carousel').toLowerCase();

let hashtags = uniqHashtags(data.hashtags || []);
if (!hashtags.length) {
  hashtags = ['#DementiaCare', '#CarerSupport', '#UKHealth', '#Dignitate'];
}

let baseCaption = clean(data.caption || '');
if (!baseCaption) {
  baseCaption = 'Evidence-led update for carers with practical next steps and clear takeaways.';
}

const keyPoints = slides
  .map((s) => stripPrefixes(s?.text || s?.caption || ''))
  .filter(Boolean)
  .slice(0, 5);

const pointLines = keyPoints.map((p) => '- ' + p);

const defaultIntro = 'A practical update from Dignitate for carers and families navigating dementia support.';
const intro = baseCaption || defaultIntro;

const instagramCaption = [
  title,
  intro,
  pointLines.length ? 'Key points:\\n' + pointLines.join('\\n') : '',
  'Save and share with carers who need clear, practical guidance.',
  hashtags.join(' ')
].filter(Boolean).join('\\n\\n').slice(0, 2100);

const linkedinText = [
  title,
  intro,
  pointLines.length ? 'Highlights:\\n' + pointLines.join('\\n') : '',
  'Dignitate shares evidence-led dementia content to support cultural carers and families across the UK.',
  hashtags.slice(0, 8).join(' ')
].filter(Boolean).join('\\n\\n').slice(0, 2900);

const facebookText = [
  title,
  intro,
  pointLines.length ? 'Highlights:\\n' + pointLines.join('\\n') : '',
  'Follow Dignitate for more practical dementia support.',
  hashtags.slice(0, 8).join(' ')
].filter(Boolean).join('\\n\\n').slice(0, 4900);

const xCore = [
  title,
  keyPoints[0] ? keyPoints[0] : intro,
  'Practical next steps for carers in the full carousel.'
].filter(Boolean).join(' ');
const xTags = hashtags.slice(0, 3).join(' ');
const xText = (xCore + (xTags ? (' ' + xTags) : '')).slice(0, 275);

const rawFacebookPageId = clean(data.facebookPageId || '672136448');

return [{
  json: {
    chatId,
    type,
    title,
    caption: baseCaption,
    hashtags,
    allImageUrls,
    imageUrl,
    slides,
    instagramCaption,
    linkedinText,
    facebookText,
    facebookPageId: rawFacebookPageId,
    xText
  }
}];
"""


CHECK_POST_RESULTS_JS = """const postData = $('Prepare Post Data').first().json;
let igStatus = 'Failed';
let liStatus = 'Failed';
let fbStatus = postData.facebookPageId ? 'Failed' : 'Skipped';
let twStatus = 'Failed';

try {
  const igResult = $('Composio - Instagram').first().json;
  if (igResult && !igResult.error) igStatus = 'Posted';
} catch(e) {}

try {
  const liResult = $('Composio - LinkedIn').first().json;
  if (liResult && !liResult.error) liStatus = 'Posted';
} catch(e) {}

try {
  if (postData.facebookPageId) {
    const fbResult = $('Composio - Facebook').first().json;
    if (fbResult && !fbResult.error && fbResult.successful !== false) fbStatus = 'Posted';
  }
} catch(e) {}

try {
  const twResult = $('Composio - X/Twitter').first().json;
  if (twResult && !twResult.error) twStatus = 'Posted';
} catch(e) {}

const statuses = [igStatus, liStatus, fbStatus, twStatus];
const allSucceeded = statuses.every((s) => s === 'Posted' || s === 'Skipped');
const noneSucceeded = statuses.every((s) => s === 'Failed');

let summary;
if (allSucceeded) {
  summary = 'CAROUSEL POSTED SUCCESSFULLY!\\n\\nInstagram: ' + igStatus + '\\nLinkedIn: ' + liStatus + '\\nFacebook: ' + fbStatus + '\\nX/Twitter: ' + twStatus + '\\n\\nLive on all configured platforms!';
} else if (noneSucceeded) {
  summary = 'POSTING FAILED\\n\\nInstagram: ' + igStatus + '\\nLinkedIn: ' + liStatus + '\\nFacebook: ' + fbStatus + '\\nX/Twitter: ' + twStatus + '\\n\\nPlease check API credentials and try again.';
} else {
  summary = 'POSTING PARTIALLY COMPLETE\\n\\nInstagram: ' + igStatus + '\\nLinkedIn: ' + liStatus + '\\nFacebook: ' + fbStatus + '\\nX/Twitter: ' + twStatus + '\\n\\nSome platforms may need attention.';
}

if (!postData.facebookPageId) {
  summary += '\\n\\nFacebook is connected but no Facebook Page ID is configured yet.';
}

return [{ json: { chatId: postData.chatId, message: summary } }];
"""


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
const facebookCaption = [title, caption, hashtags.slice(0, 8).join(' ')].filter(Boolean).join('\\n\\n').slice(0, 4900);

const ytTitleBase = title.length > 90 ? title.slice(0, 87).trim() + '...' : title;
const ytTitle = (ytTitleBase + ' #Shorts').slice(0, 100);
const ytDescription = [caption, '', hashtags.join(' '), '#Shorts'].filter(Boolean).join('\\n').slice(0, 4500);

const ttCaption = (caption + (hashtags.length ? (' ' + hashtags.slice(0, 8).join(' ')) : '')).slice(0, 2000);

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const rawTikTokId = '';
const rawYouTubeId = 'ac_45guMz9S841I';
const rawFacebookPageId = clean(j.facebookPageId || '672136448');

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
    facebookCaption,
    facebookPageId: rawFacebookPageId,
    youtubeTitle: ytTitle,
    youtubeDescription: ytDescription,
    youtubeThumbnailUrl: generatedCoverUrl,
    tiktokCaption: ttCaption,
    tiktokConnectedAccountUuid,
    youtubeConnectedAccountUuid,
    tiktokEntityId,
    youtubeEntityId,
    connectedAccountValidation: {
      rawTikTokId,
      rawYouTubeId,
      rawFacebookPageId,
      tiktokValidUuid: Boolean(tiktokConnectedAccountUuid),
      youtubeValidUuid: Boolean(youtubeConnectedAccountUuid),
      tiktokHasEntityId: Boolean(tiktokEntityId),
      youtubeHasEntityId: Boolean(youtubeEntityId),
      facebookConfigured: Boolean(rawFacebookPageId)
    }
  }
}];
"""


CHECK_VIDEO_POST_RESULTS_JS = """const base = $('Prepare Video Post Data').first().json || {};
const chatId = base.chatId;

function statusFrom(nodeName) {
  try {
    const j = $(nodeName).first().json || {};
    if (j.error) return { status: 'Failed', detail: String(j.error?.message || j.message || j.error || '').slice(0, 200) };
    if (j.successful === false || j.successfull === false) return { status: 'Failed', detail: String(j.message || '').slice(0, 200) };
    if (j.status && Number(j.status) >= 400) return { status: 'Failed', detail: String(j.message || '').slice(0, 200) };
    return { status: 'Posted', detail: '' };
  } catch (e) {
    return { status: 'Skipped', detail: 'Not configured or not executed.' };
  }
}

const val = base.connectedAccountValidation || {};
const ttNote = (!val.tiktokValidUuid && val.rawTikTokId && val.rawTikTokId.startsWith('ac_'))
  ? ' (using entityId mode with ac_...; if this fails, Composio may require a UUID connected account id)'
  : (!val.tiktokValidUuid && val.rawTikTokId ? ' (invalid TikTok id)' : '');
const ytNote = (!val.youtubeValidUuid && val.rawYouTubeId && val.rawYouTubeId.startsWith('ac_'))
  ? ' (using entityId mode with ac_...; if this fails, Composio may require a UUID connected account id)'
  : (!val.youtubeValidUuid && val.rawYouTubeId ? ' (invalid YouTube id)' : '');

const ig = statusFrom('Composio - Instagram Reels');
const fb = base.facebookPageId
  ? statusFrom('Composio - Facebook Video')
  : { status: 'Skipped', detail: 'Facebook Page ID not set' };
const tt = (base.tiktokConnectedAccountUuid || base.tiktokEntityId)
  ? statusFrom('Composio - TikTok')
  : { status: 'Skipped', detail: 'TikTok account not set' };
const yt = (base.youtubeConnectedAccountUuid || base.youtubeEntityId)
  ? statusFrom('Composio - YouTube Shorts')
  : { status: 'Skipped', detail: 'YouTube account not set' };

const lines = [
  'VIDEO POST RESULTS',
  '',
  `Instagram Reels: ${ig.status}${ig.detail ? ` (${ig.detail})` : ''}`,
  `Facebook Video: ${fb.status}${fb.detail ? ` (${fb.detail})` : ''}`,
  `TikTok: ${tt.status}${ttNote}${tt.detail ? ` (${tt.detail})` : ''}`,
  `YouTube Shorts: ${yt.status}${ytNote}${yt.detail ? ` (${yt.detail})` : ''}`,
  '',
  `Title: ${base.title || ''}`,
  base.videoUrl ? `MP4: ${base.videoUrl}` : ''
].filter(Boolean);

return [{ json: { chatId, message: lines.join('\\n') } }];
"""


def load_workflow(path: Path):
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw[0], True
    return raw, False


def save_workflow(path: Path, workflow, wrap_as_list: bool):
    payload = [workflow] if wrap_as_list else workflow
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def node_by_name(workflow, name):
    for node in workflow.get("nodes", []):
        if node.get("name") == name:
            return node
    return None


def ensure_node(workflow, node_def):
    existing = node_by_name(workflow, node_def["name"])
    if existing:
        existing.clear()
        existing.update(node_def)
    else:
        workflow.setdefault("nodes", []).append(node_def)


def patch_connections(workflow):
    conns = workflow.setdefault("connections", {})

    conns["Composio - LinkedIn"] = {
        "main": [[{"node": "Composio - Facebook", "type": "main", "index": 0}]]
    }
    conns["Composio - Facebook"] = {
        "main": [[{"node": "Composio - X/Twitter", "type": "main", "index": 0}]]
    }
    conns["Composio - Instagram Reels"] = {
        "main": [[{"node": "Composio - Facebook Video", "type": "main", "index": 0}]]
    }
    conns["Composio - Facebook Video"] = {
        "main": [[{"node": "Composio - TikTok", "type": "main", "index": 0}]]
    }


def patch_workflow(path: Path):
    if not path.exists():
        print(f"skip missing: {path}")
        return

    workflow, wrap = load_workflow(path)

    prepare_post = node_by_name(workflow, "Prepare Post Data")
    if not prepare_post:
        raise RuntimeError(f"{path}: missing Prepare Post Data")
    prepare_post.setdefault("parameters", {})["jsCode"] = PREPARE_POST_DATA_JS

    check_post = node_by_name(workflow, "Check Post Results")
    if not check_post:
        raise RuntimeError(f"{path}: missing Check Post Results")
    check_post.setdefault("parameters", {})["jsCode"] = CHECK_POST_RESULTS_JS

    prepare_video = node_by_name(workflow, "Prepare Video Post Data")
    if not prepare_video:
        raise RuntimeError(f"{path}: missing Prepare Video Post Data")
    prepare_video.setdefault("parameters", {})["jsCode"] = PREPARE_VIDEO_POST_DATA_JS

    check_video = node_by_name(workflow, "Check Video Post Results")
    if not check_video:
        raise RuntimeError(f"{path}: missing Check Video Post Results")
    check_video.setdefault("parameters", {})["jsCode"] = CHECK_VIDEO_POST_RESULTS_JS

    ensure_node(workflow, FACEBOOK_CAROUSEL_NODE)
    ensure_node(workflow, FACEBOOK_VIDEO_NODE)
    patch_connections(workflow)

    save_workflow(path, workflow, wrap)
    print(f"patched: {path}")


def main():
    for path in WORKFLOW_FILES:
        patch_workflow(path)


if __name__ == "__main__":
    main()

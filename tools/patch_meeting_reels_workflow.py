#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path


WORKFLOW_FILES = [
    Path("/Users/srikarreddy/Downloads/DemContent/dignitate-workflow-v3-stable.json"),
]


HELP_RESPONSE_TEXT = """I can work like a normal chat assistant.

Try prompts like:
- Create a carousel about dementia-friendly home routines
- Make a short video about signs of caregiver burnout
- What are the latest UK dementia-care trends?
- This looks good, post it
- Regenerate this with a more hopeful tone

Meeting reels:
- /meeting <recording_url>
- Passcode: <if needed>
- Reels: 4 (default)
- Length: 25-40s

Creator profile for realistic videos:
- /setface <public_image_url>
- /setvoiceid <elevenlabs_voice_id>
- /creator
- /commands

Auto mode is currently disabled.

Give me your topic and preferred format, and I will handle the workflow."""


VIDEO_RENDERING_STATUS_TEXT = """={{ (() => {
  const incoming = $json || {};
  let prepared = {};
  try { prepared = $('Prepare Render Data').first().json || {}; } catch (e) {}
  let packaged = {};
  try { packaged = $('Package Video Data').first().json || {}; } catch (e) {}
  let base = (incoming && Object.keys(incoming).length) ? incoming : packaged;

  const mode = String(prepared.videoMode || base.videoMode || packaged.videoMode || '').toLowerCase().trim();
  if (mode === 'meeting_reels') {
    const meta = (prepared && Object.keys(prepared).length)
      ? prepared
      : ((incoming && Object.keys(incoming).length) ? incoming : packaged);
    const cfg = (meta.meetingConfig && typeof meta.meetingConfig === 'object')
      ? meta.meetingConfig
      : ((packaged.meetingConfig && typeof packaged.meetingConfig === 'object') ? packaged.meetingConfig : {});
    const reelCount = Number(cfg.reelCount || 4);
    const targetSec = Number(cfg.targetClipSeconds || 32);
    return `Creating meeting reels...\\n\\nTitle: ${meta.title || packaged.title || 'Meeting Highlights'}\\nReels: ${reelCount}\\nTarget length: ~${targetSec}s\\nAudio: source meeting audio\\nSubtitles: Word-by-word highlight\\nBranding: Dignitate teal + logo\\n\\nThis takes about 10-20 minutes. You will receive each reel automatically.`;
  }

  const view = (packaged && Object.keys(packaged).length) ? packaged : base;
  return `Assembling your video with Remotion...\\n\\nTitle: ${view.title || 'Untitled Video'}\\nClips: ${view.clipCount || 0}\\nVoice: ${(view.creatorVoiceId || '') ? 'configured' : 'default'}\\nPortrait source: ${view.founderPortraitSource || 'n/a'}\\nSubtitles: Word-by-word highlight\\nBranding: Dignitate teal + logo\\n\\nThis takes about 10-20 minutes (clip generation + render). You will receive the finished MP4 automatically.`;
})() }}"""


VIDEO_RENDERING_STATUS_CHAT_ID = """={{ (() => {
  try { return $('Prepare Render Data').first().json.chatId; } catch (e) {}
  try { return $('Package Video Data').first().json.chatId; } catch (e) {}
  return $json.chatId;
})() }}"""


TRIGGER_RENDER_JSON_BODY = """={{ JSON.stringify({
  clipUrls: $json.clipUrls || [],
  clipRequests: $json.clipRequests || [],
  creatorImageUrl: $json.creatorImageUrl || '',
  creatorImageUrls: $json.creatorImageUrls || [],
  audioUrl: $json.audioUrl || '',
  narrationText: $json.narrationText || $json.fullNarration || '',
  voiceId: $json.creatorVoiceId || 'GoLTMzQJAHarswiHqv3L',
  videoMode: $json.videoMode || 'kling_multiclip',
  sourceVideoUrl: $json.sourceVideoUrl || $json.source_video_url || '',
  meetingConfig: $json.meetingConfig || {},
  targetDurationSec: (String($json.videoMode || '').toLowerCase() === 'talking_head') ? 30 : null,
  scenes: $json.scenes,
  title: $json.title,
  chatId: String($json.chatId),
  n8nWebhookUrl: 'http://187.77.178.148:5678/webhook/dignitate-remotion-callback',
  renderConfig: {
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    forceVerticalRaster: true,
    cropMode: 'cover',
    normalizeToVertical: true,
    subtitles: {
      enabled: true,
      mode: 'word-highlight',
      placement: 'bottom-center',
      maxWordsOnScreen: 8
    },
    talkingHeadSingleImage: false,
    animation: {
      preset: 'smooth-cinematic',
      transition: 'crossfade',
      sceneMotion: 'subtle-zoom'
    },
    branding: {
      style: 'dignitate-teal-logo',
      enabled: true
    }
  },
  postMeta: {
    hashtags: $json.hashtags,
    caption: $json.caption
  }
}) }}"""


PREPARE_MEETING_REELS_JS = """// Build a direct meeting_reels render payload from a slash command message.
const data = $input.first().json || {};
let raw = '';
try { raw = String($('Load Chat History').first().json.message || '').trim(); } catch (e) {}

function clean(s) {
  return String(s || '').replace(/[\\r\\n]+/g, ' ').replace(/\\s+/g, ' ').trim();
}

function firstUrl(text) {
  const match = String(text || '').match(/https?:\\/\\/[^\\s<>()]+/i);
  return clean(match?.[0] || '');
}

function parseLineValue(text, keys) {
  const lines = String(text || '').split(/\\r?\\n/);
  for (const line of lines) {
    const m = line.match(/^\\s*([a-z _-]+)\\s*:\\s*(.+?)\\s*$/i);
    if (!m) continue;
    const key = clean(m[1]).toLowerCase();
    if (keys.includes(key)) return clean(m[2]);
  }
  return '';
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parsePasscode(text) {
  const fromLabel = parseLineValue(text, ['passcode', 'password', 'code']);
  if (fromLabel) return fromLabel;
  const m = String(text || '').match(/(?:passcode|password|code)\\s*[:=-]?\\s*(.+?)(?=\\s+(?:reels?|clips?|length|duration|clip length|language|title|name)\\s*[:=-]|$)/i);
  return clean(m?.[1] || '');
}

function parseReelCount(text) {
  const fromLabel = parseLineValue(text, ['reels', 'reel', 'clips', 'clip count', 'reel count']);
  if (fromLabel) return clamp(fromLabel, 1, 5, 4);
  const labeled = String(text || '').match(/(?:reels?|clips?|clip count|reel count)\\s*[:=-]?\\s*(\\d{1,2})(?=\\D|$)/i);
  if (labeled?.[1]) return clamp(labeled[1], 1, 5, 4);
  const m = String(text || '').match(/(?:reels?|clips?)\\s*[:=-]?\\s*(\\d{1,2})/i);
  return clamp(m?.[1], 1, 5, 4);
}

function parseLengths(text) {
  const rawText = String(text || '');
  const labeledRange = rawText.match(/(?:length|duration|clip length)\\s*[:=-]?\\s*(\\d{1,2})\\s*(?:-|to)\\s*(\\d{1,2})\\s*s?/i);
  if (labeledRange) {
    const a = clamp(labeledRange[1], 12, 75, 25);
    const b = clamp(labeledRange[2], 12, 75, 40);
    const minClipSeconds = Math.min(a, b);
    const maxClipSeconds = Math.max(a, b);
    const targetClipSeconds = Math.round((minClipSeconds + maxClipSeconds) / 2);
    return { minClipSeconds, targetClipSeconds, maxClipSeconds };
  }
  const labeledSingle = rawText.match(/(?:length|duration|clip length)\\s*[:=-]?\\s*(\\d{1,2})\\s*s?/i);
  if (labeledSingle?.[1]) {
    const targetClipSeconds = clamp(labeledSingle[1], 12, 60, 32);
    return {
      minClipSeconds: Math.max(12, targetClipSeconds - 8),
      targetClipSeconds,
      maxClipSeconds: Math.min(75, targetClipSeconds + 8),
    };
  }
  return { minClipSeconds: 22, targetClipSeconds: 32, maxClipSeconds: 42 };
}

function parseLanguage(text) {
  return parseLineValue(text, ['language']) || '';
}

function deriveTitle(text, sourceVideoUrl) {
  const explicit = parseLineValue(text, ['title', 'name']);
  if (explicit) return explicit.slice(0, 120);

  try {
    const u = new URL(sourceVideoUrl);
    if (/zoom\\.us$/i.test(u.hostname) || /zoom\\.us$/i.test(u.hostname.replace(/^www\\./, ''))) {
      return 'Meeting Highlights';
    }
    const base = u.pathname.split('/').pop() || '';
    const cleaned = base.replace(/\\.[a-z0-9]{2,5}$/i, '').replace(/[-_]+/g, ' ').trim();
    if (cleaned) return cleaned.slice(0, 120);
  } catch (e) {}

  return 'Meeting Highlights';
}

const argsBlock = String(data.args || raw || '').trim();
const sourceVideoUrl = firstUrl(argsBlock);
if (!sourceVideoUrl) {
  throw new Error('meeting_reels requires a recording URL.');
}

const lengths = parseLengths(argsBlock);
const meetingConfig = {
  reelCount: parseReelCount(argsBlock),
  minClipSeconds: lengths.minClipSeconds,
  targetClipSeconds: lengths.targetClipSeconds,
  maxClipSeconds: lengths.maxClipSeconds,
  preserveSourceAudio: true,
  language: parseLanguage(argsBlock),
  transcriptionPrompt: 'Identify the strongest self-contained clips from this meeting. Prefer complete thoughts, clean sentence starts, clear hooks, and the dominant speaker.',
  passcode: parsePasscode(argsBlock),
  sourceKind: /zoom\\.us\\/rec\\/share/i.test(sourceVideoUrl) ? 'zoom_share' : 'direct_url',
};

const title = deriveTitle(argsBlock, sourceVideoUrl);

const staticData = $getWorkflowStaticData('global');
if (!staticData.pendingContent) staticData.pendingContent = {};

const chatKey = String(data.chatId || '');
if (chatKey) {
  staticData.pendingContent[chatKey] = {
    type: 'meeting_reels',
    title,
    caption: 'Meeting highlight reels ready for review.',
    hashtags: ['#Dignitate', '#MeetingReels'],
    chatId: chatKey,
    args: sourceVideoUrl,
    sourceVideoUrl,
    meetingConfig,
    renderPending: true,
    timestamp: Date.now(),
  };
}

return [{
  json: {
    ...data,
    title,
    args: sourceVideoUrl,
    videoMode: 'meeting_reels',
    sourceVideoUrl,
    meetingConfig,
    scenes: [],
    clipUrls: [],
    clipRequests: [],
    hashtags: ['#Dignitate', '#MeetingReels'],
    caption: 'Meeting highlight reels ready for review.',
    creatorImageUrl: '',
    creatorImageUrls: [],
  }
}];
"""


PREPARE_VIDEO_ARGS_MEETING_HELPERS = """
function firstUrl(text) {
  const match = String(text || '').match(/https?:\\/\\/[^\\s<>()]+/i);
  return clean(match?.[0] || '');
}

function parseLineValue(text, keys) {
  const lines = String(text || '').split(/\\r?\\n/);
  for (const line of lines) {
    const m = line.match(/^\\s*([a-z _-]+)\\s*:\\s*(.+?)\\s*$/i);
    if (!m) continue;
    const key = clean(m[1]).toLowerCase();
    if (keys.includes(key)) return clean(m[2]);
  }
  return '';
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseMeetingPasscode(text) {
  const fromLabel = parseLineValue(text, ['passcode', 'password', 'code']);
  if (fromLabel) return fromLabel;
  const m = String(text || '').match(/(?:passcode|password|code)\\s*[:=-]?\\s*(.+?)(?=\\s+(?:reels?|clips?|length|duration|clip length|language|title|name)\\s*[:=-]|$)/i);
  return clean(m?.[1] || '');
}

function parseMeetingReelCount(text) {
  const fromLabel = parseLineValue(text, ['reels', 'reel', 'clips', 'clip count', 'reel count']);
  if (fromLabel) return clamp(fromLabel, 1, 5, 4);
  const labeled = String(text || '').match(/(?:reels?|clips?|clip count|reel count)\\s*[:=-]?\\s*(\\d{1,2})(?=\\D|$)/i);
  if (labeled?.[1]) return clamp(labeled[1], 1, 5, 4);
  const m = String(text || '').match(/(?:reels?|clips?)\\s*[:=-]?\\s*(\\d{1,2})/i);
  return clamp(m?.[1], 1, 5, 4);
}

function parseMeetingLengths(text) {
  const rawText = String(text || '');
  const labeledRange = rawText.match(/(?:length|duration|clip length)\\s*[:=-]?\\s*(\\d{1,2})\\s*(?:-|to)\\s*(\\d{1,2})\\s*s?/i);
  if (labeledRange) {
    const a = clamp(labeledRange[1], 12, 75, 25);
    const b = clamp(labeledRange[2], 12, 75, 40);
    const minClipSeconds = Math.min(a, b);
    const maxClipSeconds = Math.max(a, b);
    const targetClipSeconds = Math.round((minClipSeconds + maxClipSeconds) / 2);
    return { minClipSeconds, targetClipSeconds, maxClipSeconds };
  }
  const labeledSingle = rawText.match(/(?:length|duration|clip length)\\s*[:=-]?\\s*(\\d{1,2})\\s*s?/i);
  if (labeledSingle?.[1]) {
    const targetClipSeconds = clamp(labeledSingle[1], 12, 60, 32);
    return {
      minClipSeconds: Math.max(12, targetClipSeconds - 8),
      targetClipSeconds,
      maxClipSeconds: Math.min(75, targetClipSeconds + 8),
    };
  }
  return { minClipSeconds: 22, targetClipSeconds: 32, maxClipSeconds: 42 };
}

function parseMeetingLanguage(text) {
  return parseLineValue(text, ['language']) || '';
}

function deriveMeetingTitle(text, sourceVideoUrl) {
  const explicit = parseLineValue(text, ['title', 'name']);
  if (explicit) return explicit.slice(0, 120);
  const inline = String(text || '').match(/(?:title|name)\\s*[:=-]\\s*(.+)$/i);
  if (inline?.[1]) return clean(inline[1]).slice(0, 120);

  try {
    const u = new URL(sourceVideoUrl);
    if (/zoom\\.us$/i.test(u.hostname) || /zoom\\.us$/i.test(u.hostname.replace(/^www\\./, ''))) {
      return 'Meeting Highlights';
    }
    const base = u.pathname.split('/').pop() || '';
    const cleaned = base.replace(/\\.[a-z0-9]{2,5}$/i, '').replace(/[-_]+/g, ' ').trim();
    if (cleaned) return cleaned.slice(0, 120);
  } catch (e) {}

  return 'Meeting Highlights';
}
"""


HANDLE_AUTO_MODE_JS = """const data = $input.first().json || {};
let raw = '';
try { raw = String($('Load Chat History').first().json.message || '').trim(); } catch (e) {}
if (!raw) return [{ json: data }];

const isAuto = /^\\/auto(?:\\b|$)/i.test(raw);
const isCommands = /^\\/(commands|cmds)(?:\\b|$)/i.test(raw);
const isCreator = /^\\/(setface|setvoiceid|creator)(?:\\b|$)/i.test(raw);
if (!isAuto && !isCommands && !isCreator) return [{ json: data }];

const staticData = $getWorkflowStaticData('global');
if (!staticData.autoScheduleByChat) staticData.autoScheduleByChat = {};
if (!staticData.pendingAutoActionByChat) staticData.pendingAutoActionByChat = {};
if (!staticData.creatorProfileByChat) staticData.creatorProfileByChat = {};
if (!staticData.defaultChatId && data.chatId) staticData.defaultChatId = String(data.chatId);

const chatKey = String(data.chatId || staticData.defaultChatId || '');
if (!chatKey) {
  return [{ json: { ...data, action: { type: 'none', topic: '' }, args: '', replyText: 'Could not identify chat for setup.' } }];
}

const creatorDefaults = {
  faceUrls: [
    'https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_casual.png',
    'https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_houndstooth.png',
    'https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_suit.png',
    'https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_shirt.png',
    'https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_layered.png'
  ],
  faceUrl: 'https://raw.githubusercontent.com/dignitatesocial/dignitatevideo/main/malcolm_portrait_houndstooth.png',
  voiceId: 'GoLTMzQJAHarswiHqv3L',
  updatedAt: Date.now(),
};
const creatorCfg = {
  ...creatorDefaults,
  ...(staticData.creatorProfileByChat[chatKey] || {}),
};

const cfg = {
  enabled: false,
  timezoneOffset: '+00:00',
  carouselTime: '09:00',
  videoTime: '18:00',
  fixedTopic: '',
  lastRun: {},
  ...(staticData.autoScheduleByChat[chatKey] || {}),
  updatedAt: Date.now(),
};

const botFatherCommands = [
  'carousel - Create carousel from topic',
  'video - Create video from topic',
  'meeting - Create 4 reels from a meeting link',
  'trends - Get latest trend topic',
  'approve - Approve pending draft',
  'regenerate - Regenerate pending draft',
  'status - Check bot status',
  'help - Show help',
  'setface - Set creator face image URL',
  'setvoiceid - Set ElevenLabs voice ID',
  'creator - Show creator profile',
  'commands - Show command list'
].join('\\n');

function normalizeGithubRawUrl(u) {
  const s = String(u || '').trim();
  const m = s.match(/^https?:\\/\\/github\\.com\\/([^\\/]+)\\/([^\\/]+)\\/blob\\/([^\\/]+)\\/(.+)$/i);
  if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
  return s;
}

function isHttpUrl(v) {
  return /^https?:\\/\\//i.test(String(v || '').trim());
}

if (isAuto) {
  cfg.enabled = false;
  cfg.updatedAt = Date.now();
  staticData.autoScheduleByChat[chatKey] = cfg;
  staticData.pendingAutoActionByChat[chatKey] = '';
  staticData.creatorProfileByChat[chatKey] = creatorCfg;

  return [{
    json: {
      ...data,
      action: { type: 'none', topic: '' },
      args: '',
      replyText: [
        'Auto mode is temporarily disabled.',
        'Use manual commands for now:',
        '/carousel <topic>',
        '/video <topic>',
        '/meeting <recording_url> [Passcode: ...]',
        '/trends'
      ].join('\\n')
    }
  }];
}

if (isCommands) {
  staticData.autoScheduleByChat[chatKey] = cfg;
  staticData.pendingAutoActionByChat[chatKey] = '';
  staticData.creatorProfileByChat[chatKey] = creatorCfg;

  return [{
    json: {
      ...data,
      action: { type: 'none', topic: '' },
      args: '',
      replyText: [
        'Available commands:',
        '/carousel <topic>',
        '/video <topic>',
        '/meeting <recording_url> [Passcode: ...]',
        '/trends',
        '/approve',
        '/regenerate',
        '/status',
        '/help',
        '/setface <public_image_url>',
        '/setvoiceid <elevenlabs_voice_id>',
        '/creator',
        '',
        'Auto mode is currently disabled.',
        '',
        'To show commands in Telegram / menu, use @BotFather /setcommands and paste:',
        botFatherCommands
      ].join('\\n')
    }
  }];
}

const cmd = String(raw.split(/\\s+/)[0] || '').toLowerCase();
let reply = '';

if (cmd === '/creator') {
  reply = [
    'CREATOR PROFILE',
    '',
    'Face URL: ' + (creatorCfg.faceUrl || 'not set'),
    'Voice ID: ' + (creatorCfg.voiceId || 'not set'),
    '',
    'Commands:',
    '/setface <public_image_url>',
    '/setvoiceid <elevenlabs_voice_id>',
    '/creator'
  ].join('\\n');
} else if (cmd === '/setface') {
  const url = raw.replace(/^\\/setface\\s*/i, '').trim();
  if (!url || !isHttpUrl(url)) {
    reply = 'Invalid face image URL. Use: /setface https://...';
  } else {
    creatorCfg.faceUrl = normalizeGithubRawUrl(url);
    creatorCfg.updatedAt = Date.now();
    reply = 'Creator face image saved for future videos.';
  }
} else if (cmd === '/setvoiceid') {
  const voiceId = raw.replace(/^\\/setvoiceid\\s*/i, '').trim();
  if (!voiceId || /\\s/.test(voiceId) || voiceId.length < 6) {
    reply = 'Invalid voice ID. Use: /setvoiceid <elevenlabs_voice_id>';
  } else {
    creatorCfg.voiceId = voiceId;
    creatorCfg.updatedAt = Date.now();
    reply = 'Creator voice ID saved for future videos.';
  }
}

cfg.enabled = false;
cfg.updatedAt = Date.now();
staticData.autoScheduleByChat[chatKey] = cfg;
staticData.pendingAutoActionByChat[chatKey] = '';
staticData.creatorProfileByChat[chatKey] = creatorCfg;

return [{
  json: {
    ...data,
    action: { type: 'none', topic: '' },
    args: '',
    replyText: reply || 'Creator command updated.',
    creatorProfile: creatorCfg
  }
}];
"""


def get_root(payload):
    if isinstance(payload, list):
        return payload[0]
    if isinstance(payload, dict) and "data" in payload and "nodes" not in payload:
        return payload["data"]
    return payload


def get_node(root, name):
    for node in root.get("nodes", []):
        if node.get("name") == name:
            return node
    raise KeyError(name)


def patch_help_response(node):
    node.setdefault("parameters", {})["text"] = HELP_RESPONSE_TEXT


def patch_handle_auto_mode(node):
    node["parameters"]["jsCode"] = HANDLE_AUTO_MODE_JS


def patch_quick_parse_slash(node):
    js = node["parameters"]["jsCode"]

    helper = """
function firstUrl(text) {
  const match = String(text || '').match(/https?:\\/\\/[^\\s<>()]+/i);
  return clean(match?.[0] || '');
}

"""
    marker = "function extractTopicFromChooseVideoMessage(text) {\n"
    if "function firstUrl(text)" not in js:
        insert_at = js.find("\n\nconst slash = rawMessage.match(")
        if insert_at == -1:
            raise RuntimeError("Could not find Quick Parse Slash insertion point")
        js = js[:insert_at] + "\n" + helper + js[insert_at:]

    js = re.sub(
        r"    '/video_kling': 'video',\n(?:    '/meeting': 'meeting_reels',\n)?(?:    '/meeting_reels': 'meeting_reels',\n)?(?:    '/reels': 'meeting_reels',\n)?\n    '/trends': 'trends',\n",
        "    '/video_kling': 'video',\n    '/meeting': 'meeting_reels',\n    '/meeting_reels': 'meeting_reels',\n    '/reels': 'meeting_reels',\n\n    '/trends': 'trends',\n",
        js,
        count=1,
    )

    meeting_block = """if (actionType === 'meeting_reels') {\n  const meetingUrl = firstUrl(directArgs);\n  if (!meetingUrl) {\n    actionType = 'none';\n    args = '';\n    topicSource = 'meeting_usage';\n    customReply = [\n      'Use /meeting with a meeting or recording link.',\n      '',\n      'Example:',\n      '/meeting https://example.com/recording.mp4',\n      'Passcode: abc123',\n      'Reels: 4',\n      'Length: 25-40s'\n    ].join('\\\\n');\n  } else {\n    args = directArgs;\n    topicSource = 'direct';\n    videoMode = 'meeting_reels';\n    customReply = 'Great, I will create 4 meeting reels from that recording now.';\n  }\n}\n\nif (actionType === 'stop') {\n"""
    js, count = re.subn(
        r"if \(actionType === 'meeting_reels'\) \{[\s\S]*?\n\}\n\nif \(actionType === 'stop'\) \{\n",
        meeting_block,
        js,
        count=1,
    )
    if count == 0:
        js = js.replace("if (actionType === 'stop') {\n", meeting_block, 1)

    js = js.replace(
        "if (['carousel', 'video', 'choose_video'].includes(actionType) && lockKey) {",
        "if (['carousel', 'video', 'choose_video', 'meeting_reels'].includes(actionType) && lockKey) {",
    )
    js = js.replace(
        "if (args && ['carousel', 'video'].includes(actionType)) {",
        "if (args && ['carousel', 'video', 'meeting_reels'].includes(actionType)) {",
    )
    js = js.replace(
        "if (chatKey && ['carousel', 'video', 'choose_video', 'trends', 'approve', 'regenerate'].includes(actionType)) {",
        "if (chatKey && ['carousel', 'video', 'choose_video', 'meeting_reels', 'trends', 'approve', 'regenerate'].includes(actionType)) {",
    )
    js = js.replace(
        "  video: args ? 'Great, I will create your video draft on: ' + args : 'I could not resolve a topic for video.',\n",
        "  video: args ? 'Great, I will create your video draft on: ' + args : 'I could not resolve a topic for video.',\n  meeting_reels: args ? 'Great, I will create 4 meeting reels from that recording now.' : 'I could not resolve a recording link for meeting reels.',\n",
    )

    node["parameters"]["jsCode"] = js


def patch_prepare_video_args(node):
    js = node["parameters"]["jsCode"]

    if "function parseMeetingPasscode(text)" in js:
        js = re.sub(
            r"function parseMeetingPasscode\(text\) \{[\s\S]*?\n\nfunction hashToIndex\(str, mod\) \{",
            lambda _m: PREPARE_VIDEO_ARGS_MEETING_HELPERS + "\n\nfunction hashToIndex(str, mod) {",
            js,
            count=1,
            flags=re.S,
        )
    else:
        insert_at = js.find("\n\nfunction hashToIndex(str, mod) {")
        if insert_at == -1:
            raise RuntimeError("Could not find Prepare Video Args helper insertion point")
        js = js[:insert_at] + "\n" + PREPARE_VIDEO_ARGS_MEETING_HELPERS + js[insert_at:]

    meeting_block = """const meetingArgsBlock = String(data.forcedTopic || data.debugTopicSources?.directArgs || data.args || '').trim();\nif (clean(data.videoMode).toLowerCase() === 'meeting_reels') {\n  const sourceVideoUrl = firstUrl(meetingArgsBlock);\n  if (!sourceVideoUrl) {\n    throw new Error('meeting_reels requires a recording URL.');\n  }\n\n  const lengths = parseMeetingLengths(meetingArgsBlock);\n  const meetingConfig = {\n    reelCount: parseMeetingReelCount(meetingArgsBlock),\n    minClipSeconds: lengths.minClipSeconds,\n    targetClipSeconds: lengths.targetClipSeconds,\n    maxClipSeconds: lengths.maxClipSeconds,\n    preserveSourceAudio: true,\n    language: parseMeetingLanguage(meetingArgsBlock),\n    transcriptionPrompt: 'Identify the strongest self-contained clips from this meeting. Prefer complete thoughts, clean sentence starts, clear hooks, and the dominant speaker.',\n    passcode: parseMeetingPasscode(meetingArgsBlock),\n    sourceKind: /zoom\\.us\\/rec\\/share/i.test(sourceVideoUrl) ? 'zoom_share' : 'direct_url',\n  };\n\n  const title = deriveMeetingTitle(meetingArgsBlock, sourceVideoUrl);\n  if (chatKey) {\n    staticData.pendingContent[chatKey] = {\n      type: 'meeting_reels',\n      title,\n      caption: 'Meeting highlight reels ready for review.',\n      hashtags: ['#Dignitate', '#MeetingReels'],\n      chatId: chatKey,\n      args: sourceVideoUrl,\n      sourceVideoUrl,\n      meetingConfig,\n      renderPending: true,\n      timestamp: Date.now(),\n    };\n  }\n\n  return [{\n    json: {\n      ...data,\n      title,\n      args: sourceVideoUrl,\n      videoMode: 'meeting_reels',\n      sourceVideoUrl,\n      meetingConfig,\n      chatId: data.chatId,\n      messageId: data.messageId,\n      scenes: [],\n      clipUrls: [],\n      clipRequests: [],\n      hashtags: ['#Dignitate', '#MeetingReels'],\n      caption: 'Meeting highlight reels ready for review.',\n      creatorImageUrl: '',\n      creatorImageUrls: [],\n      creatorVoiceId: 'GoLTMzQJAHarswiHqv3L',\n      creatorProfileSet: false,\n      selectedTrendSummary: '',\n      selectedTrendCategory: '',\n      selectedTrendRegion: '',\n      selectedTrendSourceUrl: '',\n      selectedTrendSourceName: '',\n      selectedTrendPublishedAt: ''\n    }\n  }];\n}\n"""
    js = re.sub(
        r"const meetingArgsBlock = String\([^\n]+\)\.trim\(\);",
        "const meetingArgsBlock = String(data.forcedTopic || data.debugTopicSources?.directArgs || data.args || '').trim();",
        js,
        count=1,
    )
    js = re.sub(
        r"function deriveMeetingTitle\(text, sourceVideoUrl\) \{[\s\S]*?\n\nfunction hashToIndex\(str, mod\) \{",
        lambda _m: """function deriveMeetingTitle(text, sourceVideoUrl) {\n  const explicit = parseLineValue(text, ['title', 'name']);\n  if (explicit) return explicit.slice(0, 120);\n  const inline = String(text || '').match(/(?:title|name)\\s*[:=-]\\s*(.+)$/i);\n  if (inline?.[1]) return clean(inline[1]).slice(0, 120);\n\n  try {\n    const u = new URL(sourceVideoUrl);\n    if (/zoom\\.us$/i.test(u.hostname) || /zoom\\.us$/i.test(u.hostname.replace(/^www\\./, ''))) {\n      return 'Meeting Highlights';\n    }\n    const base = u.pathname.split('/').pop() || '';\n    const cleaned = base.replace(/\\.[a-z0-9]{2,5}$/i, '').replace(/[-_]+/g, ' ').trim();\n    if (cleaned) return cleaned.slice(0, 120);\n  } catch (e) {}\n\n  return 'Meeting Highlights';\n}\n\nfunction hashToIndex(str, mod) {""",
        js,
        count=1,
        flags=re.S,
    )
    insert_marker = "const trendMeta = findTrendMeta(args);\n"
    if "const meetingArgsBlock =" in js:
        js = re.sub(
            r"const meetingArgsBlock = String\([^\n]+\)\.trim\(\);\nif \(clean\(data\.videoMode\)\.toLowerCase\(\) === 'meeting_reels'\) \{[\s\S]*?\n\}\n\nconst trendMeta = findTrendMeta\(args\);\n",
            lambda _m: meeting_block + "\nconst trendMeta = findTrendMeta(args);\n",
            js,
            count=1,
            flags=re.S,
        )
    else:
        if insert_marker not in js:
            raise RuntimeError("Could not find Prepare Video Args meeting block insertion point")
        js = js.replace(insert_marker, meeting_block + "\n" + insert_marker)

    node["parameters"]["jsCode"] = js


def patch_prepare_render_data(node):
    js = node["parameters"]["jsCode"]

    if "const staticData = $getWorkflowStaticData('global');" not in js:
        js = js.replace(
            "const data = $input.first().json || {};\n",
            "const data = $input.first().json || {};\nconst staticData = $getWorkflowStaticData('global');\nif (!staticData.pendingContent) staticData.pendingContent = {};\n",
            1,
        )

    recovery_block = """const mode = String(data.videoMode || '').trim().toLowerCase();\nlet sourceVideoUrl = String(data.sourceVideoUrl || data.source_video_url || '').trim();\nlet meetingConfig = (data.meetingConfig && typeof data.meetingConfig === 'object') ? data.meetingConfig : {};\nlet title = String(data.title || '').trim();\nif (mode === 'meeting_reels') {\n  const chatKey = String(data.chatId || '');\n  const pending = (chatKey && staticData.pendingContent?.[chatKey] && typeof staticData.pendingContent[chatKey] === 'object')\n    ? staticData.pendingContent[chatKey]\n    : {};\n  if (!sourceVideoUrl) sourceVideoUrl = String(data.args || '').trim();\n  if (!sourceVideoUrl) sourceVideoUrl = String(pending.sourceVideoUrl || '').trim();\n  if (!Object.keys(meetingConfig).length && pending.meetingConfig && typeof pending.meetingConfig === 'object') {\n    meetingConfig = pending.meetingConfig;\n  }\n  title = String(pending.title || title || 'Meeting Highlights').trim();\n}\n"""
    if "let sourceVideoUrl = String(data.sourceVideoUrl || data.source_video_url || '').trim();" not in js:
        insert_at = js.find("\n\nlet hasVoiceoverBinary = false;\n")
        if insert_at == -1:
            raise RuntimeError("Could not find Prepare Render Data recovery insertion point")
        js = js[:insert_at] + "\n" + recovery_block + js[insert_at:]

    old_return = """return [{\n  json: {\n    ...data,\n    audioUrl: String(data.audioUrl || '').trim(),\n    narrationText: String(data.narrationText || data.fullNarration || '').trim(),\n    creatorVoiceId: String(data.creatorVoiceId || 'GoLTMzQJAHarswiHqv3L').trim(),\n    hasVoiceoverBinary\n  }\n}];"""
    new_return = """return [{\n  json: {\n    ...data,\n    title: title || String(data.title || '').trim(),\n    sourceVideoUrl,\n    meetingConfig,\n    audioUrl: String(data.audioUrl || '').trim(),\n    narrationText: String(data.narrationText || data.fullNarration || '').trim(),\n    creatorVoiceId: String(data.creatorVoiceId || 'GoLTMzQJAHarswiHqv3L').trim(),\n    hasVoiceoverBinary\n  }\n}];"""
    js = js.replace(old_return, new_return)

    node["parameters"]["jsCode"] = js


def patch_action_router(node):
    values = node["parameters"]["rules"]["values"]
    if any(v.get("outputKey") == "Meeting Reels" for v in values):
        return
    fallback = values.pop()
    values.append({
        "conditions": {
            "options": {"version": 2},
            "combinator": "and",
            "conditions": [
                {
                    "leftValue": "={{ $json.action.type }}",
                    "rightValue": "meeting_reels",
                    "operator": {"type": "string", "operation": "equals"},
                }
            ],
        },
        "renameOutput": True,
        "outputKey": "Meeting Reels",
    })
    values.append(fallback)


def ensure_prepare_meeting_reels_node(root):
    try:
        node = get_node(root, "Prepare Meeting Reels Request")
        node["parameters"]["jsCode"] = PREPARE_MEETING_REELS_JS
        return
    except KeyError:
        pass

    root.setdefault("nodes", []).append({
        "parameters": {"jsCode": PREPARE_MEETING_REELS_JS},
        "id": "meeting-reels-prepare-0001",
        "name": "Prepare Meeting Reels Request",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [960, 620],
        "onError": "continueErrorOutput",
    })


def remove_meeting_reels_gate(root):
    root["nodes"] = [node for node in root.get("nodes", []) if node.get("name") != "Meeting Reels Gate"]


def patch_video_rendering_status(node):
    node["parameters"]["chatId"] = VIDEO_RENDERING_STATUS_CHAT_ID
    node["parameters"]["text"] = VIDEO_RENDERING_STATUS_TEXT


NORMALIZE_RENDER_CALLBACK_JS = r"""const src = ($json.body && typeof $json.body === 'object') ? $json.body : ($json || {});
const chatId = String(src.chatId || '').trim();
if (!chatId) return [];

function clean(s) {
  return String(s || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
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

const localPublicMatchers = [
  /^https?:\/\/187\.77\.178\.148:3001\/public\/(.+)$/i,
  /^https?:\/\/srv1417199\.hstgr\.cloud\/public\/(.+)$/i,
];

function normalizeAssetUrl(raw) {
  return String(raw || '').trim();
}

function toDownloadUrl(raw) {
  const u = normalizeAssetUrl(raw);
  if (!u) return '';
  for (const re of localPublicMatchers) {
    const match = u.match(re);
    if (match && match[1]) {
      return 'http://187.77.178.148:3001/public/' + match[1];
    }
  }
  return u;
}

const statusRaw = String(src.status || '').trim();
const status = statusRaw ? statusRaw.toLowerCase() : '';
const assetType = String(src.assetType || 'video').trim().toLowerCase();
const title = String(src.title || 'Untitled Content').trim();
const publicVideoUrl = normalizeAssetUrl(src.videoUrl || '');
const publicVideoUrls = Array.isArray(src.videoUrls)
  ? src.videoUrls.map((u) => normalizeAssetUrl(u)).filter(Boolean)
  : (publicVideoUrl ? [publicVideoUrl] : []);
const downloadVideoUrl = toDownloadUrl(publicVideoUrl);
const downloadVideoUrls = publicVideoUrls.map((u) => toDownloadUrl(u)).filter(Boolean);
const videoTitles = Array.isArray(src.videoTitles)
  ? src.videoTitles.map((value) => clean(value)).filter(Boolean)
  : [];
const videoDescriptions = Array.isArray(src.videoDescriptions)
  ? src.videoDescriptions.map((value) => clean(value)).filter(Boolean)
  : [];
const imageUrls = Array.isArray(src.allImageUrls)
  ? src.allImageUrls.map((u) => normalizeAssetUrl(u)).filter(Boolean)
  : [];

const staticData = $getWorkflowStaticData('global');
if (!staticData.pendingContent) staticData.pendingContent = {};
if (!Array.isArray(staticData.approvedArchiveQueue)) staticData.approvedArchiveQueue = [];
if (staticData.activeGenerationByChat?.[chatId]) delete staticData.activeGenerationByChat[chatId];

const pending = staticData.pendingContent[chatId] && typeof staticData.pendingContent[chatId] === 'object'
  ? staticData.pendingContent[chatId]
  : null;
const pendingTitle = String(pending?.title || '').trim();
const pendingType = String(pending?.type || '').trim().toLowerCase();
const pendingMatchesTitle = pending && pendingType === assetType && pendingTitle && pendingTitle.toLowerCase() === title.toLowerCase();

const pendingCaption = pendingMatchesTitle ? String(pending?.caption || '').trim() : String(src.caption || '').trim();
const pendingHashtags = pendingMatchesTitle && Array.isArray(pending?.hashtags) ? pending.hashtags : (Array.isArray(src.hashtags) ? src.hashtags : []);
const pendingSlides = Array.isArray(pending?.slides) ? pending.slides : [];
const pendingArgs = String(pending?.args || '').trim();
const pendingBackgrounds = Array.isArray(pending?.backgroundImageUrls)
  ? pending.backgroundImageUrls.map((u) => normalizeAssetUrl(u)).filter(Boolean)
  : [];

if (assetType === 'carousel') {
  const carouselOk = status === 'success' && imageUrls.length > 0;

  if (!carouselOk) {
    const err = String(src.error || 'Unknown carousel render error').slice(0, 700);
    return [{
      json: {
        chatId,
        title,
        callbackKind: 'carousel',
        status: status || 'error',
        renderOk: false,
        text: ['Carousel render failed.', '', 'Title: ' + title, 'Error: ' + err].join('\n')
      }
    }];
  }

  const finalSlides = Array.isArray(src.slides) && src.slides.length ? src.slides : pendingSlides;
  const finalCaption = String(src.caption || pendingCaption).trim();
  const finalHashtags = uniqHashtags(Array.isArray(src.hashtags) ? src.hashtags : pendingHashtags).slice(0, 12);
  const finalArgs = String(src.args || pendingArgs).trim();

  staticData.pendingContent[chatId] = {
    type: 'carousel',
    title,
    slides: finalSlides,
    hashtags: finalHashtags,
    caption: finalCaption,
    backgroundImageUrls: pendingBackgrounds,
    allImageUrls: imageUrls,
    imageUrl: imageUrls[0] || '',
    firstImageUrl: imageUrls[0] || '',
    imageCount: imageUrls.length,
    chatId,
    args: finalArgs,
    renderStatus: 'success',
    renderPending: false,
    timestamp: Date.now()
  };

  return [{
    json: {
      callbackKind: 'carousel',
      status: 'success',
      renderOk: true,
      chatId,
      title,
      slides: finalSlides,
      hashtags: finalHashtags,
      caption: finalCaption,
      args: finalArgs,
      backgroundImageUrls: pendingBackgrounds,
      allImageUrls: imageUrls,
      imageUrl: imageUrls[0] || '',
      firstImageUrl: imageUrls[0] || '',
      imageCount: imageUrls.length,
      text: ['Carousel render complete.', '', 'Title: ' + title, '', 'Slides ready: ' + imageUrls.length, '', 'Asset host: VPS'].join('\n')
    }
  }];
}

const renderOk = status === 'success' && publicVideoUrls.length > 0;
const hashtags = uniqHashtags(Array.isArray(src.hashtags) ? src.hashtags : pendingHashtags).slice(0, 12);

if (renderOk && assetType !== 'meeting_reels') {
  const baseType = 'video';
  const base = pendingMatchesTitle && pending && pending.type === baseType
    ? { ...pending }
    : { type: baseType, chatId, title, caption: '', hashtags: [], timestamp: Date.now() };

  staticData.pendingContent[chatId] = {
    ...base,
    title,
    finalVideoUrl: publicVideoUrl,
    videoUrl: publicVideoUrl,
    videoUrls: publicVideoUrls,
    renderStatus: 'success',
    renderedAt: Date.now(),
  };
}

if (renderOk && assetType === 'meeting_reels') {
  const createdAt = Date.now();
  const baseTitle = String(pending?.title || title || 'Meeting Highlights').trim();
  const baseCaption = String(src.caption || pendingCaption || 'Meeting highlight reel ready for review.').trim();
  const baseHashtags = hashtags.length ? hashtags : ['#Dignitate', '#MeetingReels'];
  const existingItems = Array.isArray(pending?.approvalItems) ? pending.approvalItems : [];
  const existingByUrl = new Map(
    existingItems
      .map((item) => [normalizeAssetUrl(item?.videoUrl || item?.finalVideoUrl || ''), item])
      .filter(([u]) => Boolean(u))
  );

  function shortHash(...parts) {
    const raw = parts.map((part) => String(part || '')).join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  const approvalItems = publicVideoUrls.map((u, idx) => {
    const reelNumber = idx + 1;
    const reelTitle = videoTitles[idx] || `${baseTitle} - Reel ${reelNumber}`;
    const reelDescription = videoDescriptions[idx] || '';
    const existing = existingByUrl.get(u) || {};
    return {
      type: 'video',
      assetType: 'video',
      chatId,
      title: reelTitle,
      parentTitle: baseTitle,
      caption: reelDescription || baseCaption,
      description: reelDescription,
      hashtags: baseHashtags,
      videoUrl: u,
      finalVideoUrl: u,
      downloadVideoUrl: downloadVideoUrls[idx] || toDownloadUrl(u),
      approvalId: String(existing.approvalId || `meeting-${shortHash(chatId, baseTitle, reelTitle, u, reelNumber)}`),
      archiveId: String(existing.archiveId || `archive-${shortHash(chatId, baseTitle, reelTitle, u, 'approved')}`),
      sourceVideoUrl: String(src.sourceVideoUrl || pending?.sourceVideoUrl || pendingArgs || '').trim(),
      meetingConfig: (pending?.meetingConfig && typeof pending.meetingConfig === 'object') ? pending.meetingConfig : {},
      args: pendingArgs,
      timestamp: createdAt,
    };
  });

  staticData.pendingContent[chatId] = {
    ...(pending && pending.type === 'meeting_reels' ? pending : {}),
    type: 'meeting_reels',
    title: baseTitle,
    caption: baseCaption,
    hashtags: baseHashtags,
    chatId,
    args: pendingArgs,
    sourceVideoUrl: String(src.sourceVideoUrl || pending?.sourceVideoUrl || pendingArgs || '').trim(),
    meetingConfig: (pending?.meetingConfig && typeof pending.meetingConfig === 'object') ? pending.meetingConfig : {},
    finalVideoUrl: publicVideoUrl || publicVideoUrls[0] || '',
    videoUrl: publicVideoUrl || publicVideoUrls[0] || '',
    videoUrls: publicVideoUrls,
    approvalItems,
    renderStatus: 'success',
    renderPending: false,
    renderedAt: createdAt,
    timestamp: pending?.timestamp || createdAt,
  };

  return approvalItems.map((item, idx) => {
    const reelNumber = idx + 1;
    const reelCaption = [
      `MEETING REEL ${reelNumber}/${approvalItems.length}`,
      '',
      'Title: ' + item.title,
      ...(item.description ? ['', 'Description: ' + item.description] : []),
      ...(item.hashtags?.length ? ['', 'Hashtags: ' + item.hashtags.join(' ')] : []),
      '',
      'Asset host: VPS',
      '',
      'Tap Approve to send this reel into the posting flow.'
    ].join('\n');

    return {
      json: {
        callbackKind: 'video',
        chatId,
        title: item.title,
        parentTitle: item.parentTitle,
        status: 'success',
        assetType,
        videoUrl: item.videoUrl,
        videoUrls: publicVideoUrls,
        downloadVideoUrl: item.downloadVideoUrl,
        downloadVideoUrls,
        renderOk: true,
        approvalId: item.approvalId,
        archiveId: item.archiveId,
        caption: item.caption,
        description: item.description,
        hashtags: item.hashtags,
        approvalCaption: reelCaption,
        text: ['Meeting reel ready.', '', 'Title: ' + item.title, ...(item.description ? ['', item.description] : []), '', `Reel ${reelNumber}/${approvalItems.length}`, item.videoUrl].join('\n')
      }
    };
  });
}

let approvalCaption = '';
if (renderOk) {
  const parts = [
    assetType === 'meeting_reels' ? 'MEETING REELS READY FOR REVIEW' : 'VIDEO READY FOR REVIEW',
    '',
    'Title: ' + title,
  ];

  if (assetType === 'meeting_reels') {
    parts.push('', 'Reels: ' + publicVideoUrls.length);
  }

  if (pendingCaption) {
    parts.push('', 'Draft caption:', pendingCaption);
  }

  if (hashtags.length) {
    parts.push('', 'Hashtags: ' + hashtags.join(' '));
  }

  parts.push('', 'Asset host: VPS');
  parts.push('', 'Tap a button below: Approve to post, or Regenerate for a new version.');

  const joined = parts.join('\n');
  approvalCaption = joined.length > 1000 ? (joined.slice(0, 997).trim() + '...') : joined;
}

let text = '';
if (renderOk) {
  text = assetType === 'meeting_reels'
    ? ['Meeting reels render complete.', '', 'Title: ' + title, '', ...publicVideoUrls].join('\n')
    : ['Video render complete.', '', 'Title: ' + title, '', publicVideoUrl].join('\n');
}

if (!renderOk) {
  const err = String(src.error || 'Unknown render error').slice(0, 700);
  text = ['Video render failed.', '', 'Title: ' + title, 'Error: ' + err].join('\n');
}

return [{
  json: {
    callbackKind: 'video',
    chatId,
    title,
    status: renderOk ? 'success' : (status || 'error'),
    assetType,
    videoUrl: publicVideoUrl,
    videoUrls: publicVideoUrls,
    downloadVideoUrl,
    downloadVideoUrls,
    renderOk,
    approvalCaption,
    text,
  }
}];
"""


HANDLE_APPROVAL_JS = r"""const staticData = $getWorkflowStaticData('global');
if (!staticData.pendingContent) staticData.pendingContent = {};
if (!Array.isArray(staticData.approvedArchiveQueue)) staticData.approvedArchiveQueue = [];

const commandData = $('Load Chat History').first().json || {};
const chatId = String(commandData.chatId || $json.chatId || '').trim();

function clean(s) {
  return String(s || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
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

const rawCommand = [
  commandData.message,
  commandData.callbackQueryData,
  commandData.callback_data,
  commandData.sourceMessageText,
  commandData.replyToText,
  commandData.command,
  $json.message,
  $json.callbackQueryData,
  $json.callback_data,
].map(clean).find(Boolean) || '';

const approvalMatch = rawCommand.match(/\/approve(?:@[A-Za-z0-9_]+)?(?:\s+([^\s]+))?/i);
const requestedApprovalId = clean(
  approvalMatch?.[1] ||
  commandData.args ||
  $json.args ||
  $json.approvalId ||
  ''
);

const pending = chatId ? staticData.pendingContent[chatId] : null;

if (!pending) {
  return [{ json: { chatId, error: true, message: 'No pending content found. Generate content first with /carousel, /video, or /meeting.' } }];
}

const approvalItems = Array.isArray(pending.approvalItems) ? pending.approvalItems : [];
if (approvalItems.length) {
  const selected = requestedApprovalId
    ? approvalItems.find((item) => String(item?.approvalId || '').trim() === requestedApprovalId)
    : approvalItems[0];

  if (!selected) {
    return [{ json: { chatId, error: true, message: 'Could not find that meeting reel approval item. Please approve from the latest buttons.' } }];
  }

  const remaining = approvalItems.filter((item) => String(item?.approvalId || '').trim() !== String(selected.approvalId || '').trim());
  if (remaining.length) {
    staticData.pendingContent[chatId] = {
      ...pending,
      approvalItems: remaining,
      lastApprovedId: selected.approvalId,
      timestamp: Date.now(),
    };
  } else {
    delete staticData.pendingContent[chatId];
  }

  const approvedAt = new Date().toISOString();
  const approvedVideoUrl = clean(selected.finalVideoUrl || selected.videoUrl || '');
  const archiveId = clean(selected.archiveId || selected.approvalId || `${chatId}-${Date.now()}`);

  if (approvedVideoUrl && !staticData.approvedArchiveQueue.some((item) => String(item?.archiveId || '') === archiveId)) {
    staticData.approvedArchiveQueue.push({
      archiveId,
      title: clean(selected.title || pending.title || 'Approved Clip'),
      parentTitle: clean(selected.parentTitle || pending.title || ''),
      videoUrl: approvedVideoUrl,
      caption: clean(selected.caption || pending.caption || ''),
      description: clean(selected.description || ''),
      hashtags: uniqHashtags(selected.hashtags || pending.hashtags || []),
      assetType: 'video',
      chatId,
      sourceArgs: clean(selected.args || pending.args || ''),
      approvedAt,
      archivedAt: '',
      archiveTag: '',
      archiveReleaseUrl: '',
      archiveAssetUrl: '',
      archiveMetadataUrl: '',
    });
  }

  return [{
    json: {
      ...selected,
      type: 'video',
      assetType: 'video',
      chatId,
      approved: true,
      finalVideoUrl: approvedVideoUrl,
      videoUrl: approvedVideoUrl,
      caption: clean(selected.caption || pending.caption || ''),
      hashtags: uniqHashtags(selected.hashtags || pending.hashtags || []),
      parentTitle: clean(selected.parentTitle || pending.title || ''),
      args: clean(selected.args || pending.args || ''),
      sourceVideoUrl: clean(selected.sourceVideoUrl || pending.sourceVideoUrl || pending.args || ''),
      meetingConfig: (selected.meetingConfig && typeof selected.meetingConfig === 'object')
        ? selected.meetingConfig
        : ((pending.meetingConfig && typeof pending.meetingConfig === 'object') ? pending.meetingConfig : {}),
      archiveId,
      approvedAt,
    }
  }];
}

const contentData = { ...pending };
delete staticData.pendingContent[chatId];

const approvedVideoUrl = clean(contentData.finalVideoUrl || contentData.videoUrl || '');
const archiveId = clean(contentData.archiveId || `${chatId}-${Date.now()}`);
if (approvedVideoUrl && !staticData.approvedArchiveQueue.some((item) => String(item?.archiveId || '') === archiveId)) {
  staticData.approvedArchiveQueue.push({
    archiveId,
    title: clean(contentData.title || 'Approved Clip'),
    parentTitle: clean(contentData.parentTitle || ''),
    videoUrl: approvedVideoUrl,
    caption: clean(contentData.caption || ''),
    description: clean(contentData.description || ''),
    hashtags: uniqHashtags(contentData.hashtags || []),
    assetType: clean(contentData.assetType || contentData.type || 'video'),
    chatId,
    sourceArgs: clean(contentData.args || ''),
    approvedAt: new Date().toISOString(),
    archivedAt: '',
    archiveTag: '',
    archiveReleaseUrl: '',
    archiveAssetUrl: '',
    archiveMetadataUrl: '',
  });
}

return [{
  json: {
    ...contentData,
    chatId,
    approved: true,
    archiveId,
  }
}];"""


PREPARE_WEEKLY_ARCHIVE_PAYLOAD_JS = r"""const staticData = $getWorkflowStaticData('global');
if (!Array.isArray(staticData.approvedArchiveQueue)) staticData.approvedArchiveQueue = [];

const pendingItems = staticData.approvedArchiveQueue
  .filter((item) => item && typeof item === 'object')
  .filter((item) => String(item.videoUrl || '').trim())
  .filter((item) => !String(item.archivedAt || '').trim());

if (!pendingItems.length) {
  return [];
}

return [{
  json: {
    itemCount: pendingItems.length,
    items: pendingItems,
  }
}];"""


MARK_WEEKLY_ARCHIVE_COMPLETE_JS = r"""const staticData = $getWorkflowStaticData('global');
if (!Array.isArray(staticData.approvedArchiveQueue)) staticData.approvedArchiveQueue = [];

const data = $input.first().json || {};
const archived = Array.isArray(data.archived) ? data.archived : [];
if (!archived.length) {
  return [];
}

const byId = new Map(
  archived
    .filter((item) => item && typeof item === 'object' && String(item.archiveId || '').trim())
    .map((item) => [String(item.archiveId).trim(), item])
);

staticData.approvedArchiveQueue = staticData.approvedArchiveQueue.map((item) => {
  const match = byId.get(String(item?.archiveId || '').trim());
  if (!match) return item;
  return {
    ...item,
    archivedAt: String(match.archivedAt || new Date().toISOString()),
    archiveTag: String(match.archiveTag || ''),
    archiveReleaseUrl: String(match.archiveReleaseUrl || ''),
    archiveAssetUrl: String(match.archiveAssetUrl || ''),
    archiveMetadataUrl: String(match.archiveMetadataUrl || ''),
  };
});

return [{
  json: {
    archivedCount: archived.length,
    archived,
  }
}];"""


def patch_normalize_render_callback(node):
    node["parameters"]["jsCode"] = NORMALIZE_RENDER_CALLBACK_JS


def patch_send_rendered_video(node):
    params = node["parameters"]
    params["replyMarkup"] = "inlineKeyboard"
    params["inlineKeyboard"] = "={{ { rows: [{ row: { buttons: [{ text: 'Approve', additionalFields: { callback_data: ($json.assetType === 'meeting_reels' && $json.approvalId) ? ('/approve ' + $json.approvalId) : '/approve' } }, { text: 'Regenerate', additionalFields: { callback_data: '/regenerate' } }] } }] } }}"
    node["parameters"] = params


def patch_handle_approval(node):
    node["parameters"]["jsCode"] = HANDLE_APPROVAL_JS


def patch_trigger_render(node):
    node["parameters"]["jsonBody"] = TRIGGER_RENDER_JSON_BODY


def ensure_weekly_archive_nodes(root):
    nodes = root.setdefault("nodes", [])

    def upsert(node_def):
        try:
            node = get_node(root, node_def["name"])
            node.clear()
            node.update(node_def)
        except KeyError:
            nodes.append(node_def)

    upsert({
        "parameters": {
            "rule": {
                "interval": [
                    {
                        "field": "weeks",
                        "weeksInterval": 1,
                        "triggerAtDay": [1],
                        "triggerAtHour": 9,
                        "triggerAtMinute": 0,
                    }
                ]
            }
        },
        "id": "approved-archive-schedule-0001",
        "name": "Schedule Weekly Approved Archive",
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2,
        "position": [-720, 980],
    })

    upsert({
        "parameters": {
            "jsCode": PREPARE_WEEKLY_ARCHIVE_PAYLOAD_JS,
        },
        "id": "approved-archive-prepare-0001",
        "name": "Prepare Weekly Approved Archive Payload",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [-480, 980],
    })

    upsert({
        "parameters": {
            "method": "POST",
            "url": "http://187.77.178.148:3001/archive/github-release",
            "sendHeaders": False,
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify({ items: $json.items || [] }) }}",
            "options": {
                "timeout": 600000,
            },
        },
        "id": "approved-archive-http-0001",
        "name": "Archive Approved Clips To GitHub Releases",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.1,
        "position": [-220, 980],
        "onError": "continueErrorOutput",
    })

    upsert({
        "parameters": {
            "jsCode": MARK_WEEKLY_ARCHIVE_COMPLETE_JS,
        },
        "id": "approved-archive-mark-0001",
        "name": "Mark Weekly Approved Archive Complete",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [40, 980],
        "onError": "continueErrorOutput",
    })


def patch_connections(root):
    connections = root.setdefault("connections", {})

    action_router_main = connections.setdefault("Action Router", {}).setdefault("main", [])
    router = get_node(root, "Action Router")
    output_keys = [value.get("outputKey") for value in router["parameters"]["rules"]["values"]]
    try:
        meeting_idx = output_keys.index("Meeting Reels")
        choose_idx = output_keys.index("Choose Video")
    except ValueError as exc:
        raise RuntimeError("Expected Meeting Reels and Choose Video outputs on Action Router") from exc

    while len(action_router_main) <= max(meeting_idx, choose_idx):
        action_router_main.append([])

    for idx, edges in enumerate(action_router_main):
        filtered = [
            edge for edge in edges
            if edge.get("node") not in {"Prepare Meeting Reels Request", "Video - Choose Mode"}
        ]
        action_router_main[idx] = filtered

    action_router_main[meeting_idx].append({
        "node": "Prepare Meeting Reels Request",
        "type": "main",
        "index": 0,
    })
    action_router_main[choose_idx].append({
        "node": "Video - Choose Mode",
        "type": "main",
        "index": 0,
    })

    ensure_action_intent_main = connections.setdefault("Ensure Action Intent", {}).setdefault("main", [[]])
    if not ensure_action_intent_main:
        ensure_action_intent_main.append([])
    ensure_action_intent_main[0] = [
        edge for edge in ensure_action_intent_main[0]
        if edge.get("node") != "Meeting Reels Gate"
    ]
    if not any(edge.get("node") == "Action Router" for edge in ensure_action_intent_main[0]):
        ensure_action_intent_main[0].append({
            "node": "Action Router",
            "type": "main",
            "index": 0,
        })

    connections.pop("Meeting Reels Gate", None)

    prep_meeting = connections.setdefault("Prepare Meeting Reels Request", {}).setdefault("main", [])
    if not prep_meeting:
        prep_meeting.append([
            {"node": "Prepare Render Data", "type": "main", "index": 0}
        ])
    else:
        if not any(edge.get("node") == "Prepare Render Data" for edge in prep_meeting[0]):
            prep_meeting[0].append({"node": "Prepare Render Data", "type": "main", "index": 0})

    weekly_schedule = connections.setdefault("Schedule Weekly Approved Archive", {}).setdefault("main", [[]])
    weekly_schedule[0] = [
        {"node": "Prepare Weekly Approved Archive Payload", "type": "main", "index": 0}
    ]

    weekly_prepare = connections.setdefault("Prepare Weekly Approved Archive Payload", {}).setdefault("main", [[]])
    weekly_prepare[0] = [
        {"node": "Archive Approved Clips To GitHub Releases", "type": "main", "index": 0}
    ]

    weekly_archive = connections.setdefault("Archive Approved Clips To GitHub Releases", {}).setdefault("main", [[]])
    weekly_archive[0] = [
        {"node": "Mark Weekly Approved Archive Complete", "type": "main", "index": 0}
    ]


def patch_file(path: Path):
    payload = json.loads(path.read_text())
    root = get_root(payload)

    patch_help_response(get_node(root, "Help Response"))
    patch_handle_auto_mode(get_node(root, "Handle Auto Mode Commands"))
    patch_quick_parse_slash(get_node(root, "Quick Parse Slash"))
    patch_prepare_video_args(get_node(root, "Prepare Video Args"))
    patch_prepare_render_data(get_node(root, "Prepare Render Data"))
    patch_action_router(get_node(root, "Action Router"))
    ensure_prepare_meeting_reels_node(root)
    remove_meeting_reels_gate(root)
    patch_video_rendering_status(get_node(root, "Video - Rendering Status"))
    patch_normalize_render_callback(get_node(root, "Normalize Render Callback"))
    patch_send_rendered_video(get_node(root, "Send Rendered Video To Telegram"))
    patch_handle_approval(get_node(root, "Handle Approval"))
    patch_trigger_render(get_node(root, "Trigger GitHub Actions"))
    ensure_weekly_archive_nodes(root)
    patch_connections(root)

    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"patched {path}")


def main():
    workflow_files = [Path(arg) for arg in sys.argv[1:]] or WORKFLOW_FILES
    for wf in workflow_files:
        if wf.exists():
            patch_file(wf)
        else:
            print(f"missing {wf}")


if __name__ == "__main__":
    main()

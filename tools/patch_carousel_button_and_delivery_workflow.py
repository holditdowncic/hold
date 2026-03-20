#!/usr/bin/env python3
import json
from pathlib import Path


ROOT = Path("/Users/srikarreddy/Downloads/DemContent")
WORKFLOW_PATH = ROOT / "dignitate-workflow-v3-stable.json"


def load_workflow():
    with WORKFLOW_PATH.open() as fh:
        return json.load(fh)


def save_workflow(data):
    with WORKFLOW_PATH.open("w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")


def node_by_name(workflow, name):
    for node in workflow["nodes"]:
        if node.get("name") == name:
            return node
    raise KeyError(name)


FORMAT_TREND_MESSAGE = """const items = $input.all();
const clean = (s) => String(s || '')
  .replace(/[\\r\\n]+/g, ' ')
  .replace(/\\[(\\d{1,3})\\]/g, '')
  .replace(/([A-Za-z])\\.(\\d{1,2})(?=\\s|$)/g, '$1.')
  .replace(/\\s+/g, ' ')
  .trim();
const normTitle = (s) => clean(s).toLowerCase().replace(/[^a-z0-9\\s]/g, '').replace(/\\s+/g, ' ').trim();

const staticData = $getWorkflowStaticData('global');
if (!staticData.pendingTrendTopicByChat) staticData.pendingTrendTopicByChat = {};
if (!staticData.latestSuggestedTopicByChat) staticData.latestSuggestedTopicByChat = {};
if (!staticData.lastTrendByChat) staticData.lastTrendByChat = {};
if (!staticData.userMemory) staticData.userMemory = {};
if (!staticData.globalSuggestedTopic) staticData.globalSuggestedTopic = '';
if (!staticData.trendMetaByTitle) staticData.trendMetaByTitle = {};
if (!staticData.trendButtonMapByChat) staticData.trendButtonMapByChat = {};

function shortHash(...parts) {
  const raw = parts.map((p) => String(p || '')).join('|');
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h) + raw.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function sentenceSplit(text) {
  return clean(text)
    .split(/(?<=[.!?])\\s+/)
    .map((x) => clean(x))
    .filter(Boolean);
}

function firstSentence(text) {
  return sentenceSplit(text)[0] || clean(text);
}

function titleCase(text) {
  return clean(text)
    .toLowerCase()
    .split(/\\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function classifyAngle(title, summary, category) {
  const t = `${clean(title)} ${clean(summary)} ${clean(category)}`.toLowerCase();
  if (/\\b(diagnosis|diagnostic|care plan review|care plan|primary care dementia data|ethnicity|age breakdown|equity|unequal|inequity)\\b/.test(t)) return 'diagnosis_gap';
  if (/\\b(antipsychotic|anti-psychotic|medication|prescrib|drug|medicine|side effect|falls)\\b/.test(t)) return 'medication';
  if (/\\b(wait|waiting|delay|delays|backlog|referral wait|memory clinic wait)\\b/.test(t)) return 'delay';
  if (/\\b(funding|budget|poverty|cost of care|social care funding)\\b/.test(t)) return 'funding';
  if (/\\b(workforce|staffing|vacanc|recruitment|retention)\\b/.test(t)) return 'workforce';
  if (/\\b(attendance allowance|benefit|benefits|legal rights|entitlement|entitlements)\\b/.test(t)) return 'legal';
  if (/\\b(community|hub|support group|carers centre|programme|program)\\b/.test(t)) return 'community';
  if (/\\b(digital|app|technology|tool|ai|platform)\\b/.test(t)) return 'technology';
  if (/\\b(research|study|trial|paper|journal|scientist|evidence)\\b/.test(t)) return 'research';
  if (/\\b(policy|framework|guidance|strategy|plan|report|government|nhs|minister|icb|standard)\\b/.test(t)) return 'policy';
  return String(category || '').toLowerCase() || 'caregiving';
}

function rewriteTitle(title, summary, category) {
  const angle = classifyAngle(title, summary, category);
  if (angle === 'diagnosis_gap') return 'New NHS Dementia Data Shows Where Diagnosis Gaps Still Exist';
  if (angle === 'delay') return 'Why Some Families Still Wait Too Long For Dementia Help';
  if (angle === 'medication') return 'Why Dementia Medication Reviews Need Closer Attention';
  if (angle === 'funding') return 'How Social Care Pressure Is Hitting Families At Home';
  if (angle === 'workforce') return 'Why Staffing Pressure Still Changes Dementia Care';
  if (angle === 'legal') return 'What Carers May Be Missing In Financial Support';
  if (angle === 'community') return 'Where Families Are Finding Better Dementia Support';
  if (angle === 'technology') return 'Which Dementia Care Tools Could Actually Save Time';
  if (angle === 'research') return 'What The Latest Dementia Evidence Could Change For Carers';
  if (angle === 'policy') return 'What This NHS Dementia Change Could Mean For Families';
  const cleaned = clean(title).replace(/\\b(highlights|update|report|data release|published|framework|strategy|guidance)\\b/ig, '').replace(/\\s+/g, ' ').trim();
  return titleCase(cleaned || title || 'Dementia Care Update').slice(0, 180);
}

function rewriteSummary(title, summary, category) {
  const angle = classifyAngle(title, summary, category);
  const lead = firstSentence(summary);
  if (angle === 'diagnosis_gap') {
    return 'The latest NHS dementia data suggests diagnosis rates, care-plan reviews, and prescribing patterns are still uneven. For carers, the real issue is whether help is arriving early enough and equally across communities.';
  }
  if (angle === 'delay') {
    return 'Delays in assessment or follow-up usually mean families are carrying more uncertainty at home. The practical question is who owns the next step and how long support will really take.';
  }
  if (angle === 'medication') {
    return 'Medication updates matter when they change falls risk, sleep, agitation, or daily function. Carers need to know what changed, what to watch, and when the next review should happen.';
  }
  if (angle === 'funding') {
    return 'Funding pressure usually shows up as less respite, thinner home support, or more strain landing on families. The practical issue is what support is still available locally and what needs chasing now.';
  }
  if (angle === 'workforce') {
    return 'Staffing pressure often turns into slower answers, less continuity, and more confusion for carers. Families need clarity on who to contact and how to keep care moving.';
  }
  if (angle === 'legal') {
    return 'Support rights only matter if families know what to ask for and when to challenge a decision. This is about turning entitlements into practical help, not paperwork alone.';
  }
  if (angle === 'community') {
    return 'Good local support can reduce isolation, confusion, and repeated admin for carers. The key question is which services offer real practical help rather than vague signposting.';
  }
  if (angle === 'technology') {
    return 'Digital tools only matter if they reduce confusion, save time, or improve follow-up between appointments. The useful angle is whether they make life easier for carers in practice.';
  }
  if (angle === 'research') {
    return 'New evidence matters only when carers know what to notice, what to ask, and what should change at home. The useful question is what this changes in real care decisions now.';
  }
  if (angle === 'policy') {
    return 'Policy changes matter when they alter referrals, reviews, or access to support. Families need the plain-English version: what changed, who it affects, and what to ask next.';
  }
  if (lead) {
    return `${lead} For carers, the practical question is what this changes at home and what should be clarified next.`;
  }
  return 'This matters when it changes what carers should notice, ask about, or organise at home. The useful next step is one clear question for the next appointment.';
}

return items.map((item, index) => {
  const d = item.json || {};

  const originalTitle = clean(d.title || d.topic || 'Untitled topic').slice(0, 180);
  const originalSummary = clean(d.summary || d.description || 'No summary available.').slice(0, 1200);
  const category = clean(d.category || 'caregiving');
  const region = clean(d.region || 'UK');
  const sourceUrl = clean(d.source_url || d.sourceUrl || '');
  const sourceName = clean(d.source_name || d.sourceName || '');
  const publishedAt = clean(d.published_at || d.publishedAt || '');

  const title = rewriteTitle(originalTitle, originalSummary, category).slice(0, 180);
  const summary = rewriteSummary(originalTitle, originalSummary, category).slice(0, 600);

  let score = Number(d.engagement_score ?? d.engagementScore ?? 7);
  if (!Number.isFinite(score)) score = 7;
  score = Math.max(1, Math.min(10, Math.round(score)));

  const rank = Number.isFinite(Number(d.rank)) ? Number(d.rank) : (index + 1);
  const total = Number.isFinite(Number(d.totalTopics)) ? Number(d.totalTopics) : items.length;

  const trendMessage = [
    `Trending Topic ${rank}/${total}:`,
    '',
    title,
    '',
    summary,
    '',
    `Category: ${category}`,
    `Region: ${region}`,
    `Engagement Score: ${score}/10`,
    ...(sourceUrl ? [`Source: ${sourceName || 'link'} - ${sourceUrl}`] : []),
    ...(publishedAt ? [`Published: ${publishedAt}`] : []),
    '',
    'Tap one of the buttons below to generate content for this exact topic.',
    'Workflow build: 2026-03-16-carousel-button-fix',
    'Manual fallback: type carousel + topic or video + topic'
  ].join('\\n');

  const chatKey = String(d.chatId || staticData.defaultChatId || '');
  const token = 'tt_' + shortHash(chatKey, title, rank, Date.now(), index);
  if (chatKey) {
    const map = staticData.trendButtonMapByChat[chatKey] || {};
    for (const [key, value] of Object.entries(map)) {
      if ((Date.now() - Number(value?.updatedAt || 0)) > (48 * 60 * 60 * 1000)) {
        delete map[key];
      }
    }
    map[token] = {
      title,
      summary,
      category,
      region,
      sourceUrl,
      sourceName,
      publishedAt,
      updatedAt: Date.now(),
    };
    staticData.trendButtonMapByChat[chatKey] = map;
  }

  if (title) {
    const meta = {
      title,
      summary,
      category,
      region,
      sourceUrl,
      sourceName,
      publishedAt,
      originalTitle,
      originalSummary,
      updatedAt: Date.now()
    };
    staticData.trendMetaByTitle[title.toLowerCase()] = meta;
    const normalized = normTitle(title);
    if (normalized) staticData.trendMetaByTitle[normalized] = meta;
  }

  if (chatKey && title) {
    staticData.pendingTrendTopicByChat[chatKey] = title;
    staticData.latestSuggestedTopicByChat[chatKey] = title;
    staticData.lastTrendByChat[chatKey] = title;
    staticData.globalSuggestedTopic = title;
    staticData.userMemory[chatKey] = {
      ...(staticData.userMemory[chatKey] || {}),
      lastTopic: title,
      lastAction: 'trends',
      updatedAt: Date.now()
    };
  }

  return {
    json: {
      ...d,
      title,
      summary,
      originalTitle,
      originalSummary,
      category,
      region,
      engagement_score: score,
      rank,
      totalTopics: total,
      trendMessage,
      callbackCarousel: `/carousel topic:${token}`,
      callbackVideo: `/video topic:${token}`,
      sourceUrl,
      sourceName,
      publishedAt
    }
  };
});
"""


QUICK_PARSE_SLASH = """// Deterministic slash parser for button-first trend flow + generation lock
const data = $input.first().json || {};
const rawMessage = String(data.message || '').trim();
const replyToText = String(data.replyToText || '').trim();
const sourceMessageText = String(data.sourceMessageText || '').trim();

let actionType = 'none';
let args = '';
let command = '';
let directArgs = '';
let topicSource = 'none';
let customReply = '';
let videoMode = ''; // 'talking_head' | 'kling_multiclip'
let selectedTrendSummary = '';
let selectedTrendCategory = '';
let selectedTrendRegion = '';
let selectedTrendSourceUrl = '';
let selectedTrendSourceName = '';
let selectedTrendPublishedAt = '';

function clean(s) {
  return String(s || '').replace(/[\\r\\n]+/g, ' ').replace(/\\s+/g, ' ').trim();
}

function normalizeTopic(s) {
  let t = clean(s);
  for (let i = 0; i < 3; i++) {
    const first = t.charAt(0);
    const last = t.charAt(t.length - 1);
    const pairs = { '"': '"', "'": "'", '(': ')', '[': ']', '{': '}' };
    if (pairs[first] && pairs[first] === last) t = clean(t.slice(1, -1));
  }
  return t;
}

function normTitle(s) {
  return normalizeTopic(s).toLowerCase().replace(/[^a-z0-9\\s]/g, '').replace(/\\s+/g, ' ').trim();
}


function escapeRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
}

function extractTopicFromTrendMessage(text, cmd) {
  const t = String(text || '').trim();
  const cmdRe = new RegExp('^\\\\s*' + escapeRegExp(cmd) + '\\\\s+(.+)$', 'im');
  const cmdMatch = t.match(cmdRe);
  if (cmdMatch?.[1]) return normalizeTopic(cmdMatch[1]);

  const trendingMatch = t.match(/Trending Topic(?:\\s+\\d+\\/\\d+)?\\s*:\\s*[\\r\\n]+([^\\n\\r]+)/i);
  if (trendingMatch?.[1]) return normalizeTopic(trendingMatch[1]);

  const lines = t.split(/\\r?\\n/).map((x) => x.trim()).filter(Boolean);
  if (!lines.length) return '';
  const idx = lines.findIndex((x) => /^Trending Topic/i.test(x));
  if (idx >= 0 && lines[idx + 1]) return normalizeTopic(lines[idx + 1]);

  return '';
}

function extractSummaryFromTrendMessage(text) {
  const t = String(text || '').trim();
  if (!t) return '';
  const lines = t.split(/\\r?\\n/).map((x) => x.trim()).filter(Boolean);
  const idx = lines.findIndex((x) => /^Trending Topic/i.test(x));
  if (idx >= 0 && lines[idx + 2]) return normalizeTopic(lines[idx + 2]);
  const m = t.match(/Trending Topic(?:\\s+\\d+\\/\\d+)?\\s*:\\s*[\\r\\n]+[^\\n\\r]+[\\r\\n]+[\\r\\n]*([^\\n\\r]+)/i);
  return m?.[1] ? normalizeTopic(m[1]) : '';
}

function extractMetaFromTrendMessage(text) {
  const t = String(text || '').trim();
  if (!t) return { summary: '', category: '', region: '', sourceUrl: '', sourceName: '', publishedAt: '' };

  const summary = extractSummaryFromTrendMessage(t);
  const category = normalizeTopic((t.match(/^\\s*Category\\s*:\\s*(.+)$/im) || [])[1] || '');
  const region = normalizeTopic((t.match(/^\\s*Region\\s*:\\s*(.+)$/im) || [])[1] || '');
  const publishedAt = normalizeTopic((t.match(/^\\s*Published\\s*:\\s*(.+)$/im) || [])[1] || '');

  const srcLine = normalizeTopic((t.match(/^\\s*Source\\s*:\\s*(.+)$/im) || [])[1] || '');
  let sourceName = '';
  let sourceUrl = '';
  if (srcLine) {
    const urlMatch = srcLine.match(/(https?:\\/\\/\\S+)/i);
    sourceUrl = normalizeTopic(urlMatch?.[1] || '');
    sourceName = normalizeTopic(srcLine.replace(/\\s*-\\s*https?:\\/\\/\\S+/i, ''));
    if (sourceName.toLowerCase() === 'link') sourceName = '';
  }

  return { summary, category, region, sourceUrl, sourceName, publishedAt };
}

function extractTopicFromChooseVideoMessage(text) {
  const t = String(text || '').trim();
  if (!t) return '';

  const m = t.match(/\\bChoose\\s+(?:a\\s+)?video\\s+style(?:\\s+for)?\\s*:?\\s*([\\s\\S]+)/i);
  if (!m?.[1]) return '';

  const rest = String(m[1] || '').trim();
  if (!rest) return '';

  const lines = rest.split(/\\r?\\n/).map((x) => x.trim()).filter(Boolean);
  const ignore = (line) =>
    /sent\\s+automatically\\s+with\\s+n8n/i.test(line) ||
    /^(tap a button below|talking head|kling multi-clip)$/i.test(line);
  const kept = lines.filter((x) => !ignore(x));
  const joined = normalizeTopic(kept.join(' '));
  if (!joined) return '';
  return joined.length > 1800 ? (joined.slice(0, 1797) + '...') : joined;
}

function firstUrl(text) {
  const match = String(text || '').match(/https?:\\/\\/[^\\s<>()]+/i);
  return clean(match?.[0] || '');
}

const slash = rawMessage.match(/^\\/([a-z0-9_]+)(?:@[A-Za-z0-9_]+)?(?:\\s+([\\s\\S]+))?$/i);
if (slash) {
  command = '/' + String(slash[1] || '').toLowerCase();
  directArgs = normalizeTopic(String(slash[2] || ''));
} else if (rawMessage.startsWith('/')) {
  command = rawMessage.split(/\\s+/)[0].toLowerCase();
}

if (command === '/video_talking') videoMode = 'talking_head';
if (command === '/video_kling') videoMode = 'kling_multiclip';

const staticData = $getWorkflowStaticData('global');
if (!staticData.lastTrendByChat) staticData.lastTrendByChat = {};
if (!staticData.latestSuggestedTopicByChat) staticData.latestSuggestedTopicByChat = {};
if (!staticData.pendingTrendTopicByChat) staticData.pendingTrendTopicByChat = {};
if (!staticData.pendingVideoTopicByChat) staticData.pendingVideoTopicByChat = {};
if (!staticData.userMemory) staticData.userMemory = {};
if (!staticData.pendingAutoActionByChat) staticData.pendingAutoActionByChat = {};
if (!staticData.lastManualCommandAtByChat) staticData.lastManualCommandAtByChat = {};
if (!staticData.globalSuggestedTopic) staticData.globalSuggestedTopic = '';
if (!staticData.activeGenerationByChat) staticData.activeGenerationByChat = {};
if (!staticData.recentTapByChat) staticData.recentTapByChat = {};
if (!staticData.recentCallbackIdsByChat) staticData.recentCallbackIdsByChat = {};
if (!staticData.trendMetaByTitle) staticData.trendMetaByTitle = {};
if (!staticData.trendButtonMapByChat) staticData.trendButtonMapByChat = {};

function findTrendMeta(topic) {
  const map = staticData.trendMetaByTitle || {};
  const exact = map[String(topic || '').toLowerCase()];
  if (exact) return exact;

  const wanted = normTitle(topic);
  if (!wanted) return null;

  for (const [key, value] of Object.entries(map)) {
    if (normTitle(key) === wanted) return value;
    if (normTitle(value?.title || '') === wanted) return value;
  }
  return null;
}

function syncTrendMeta(topic) {
  if (!topic) return;
  const meta = findTrendMeta(topic);
  if (!meta) return;
  if (!selectedTrendSummary) selectedTrendSummary = normalizeTopic(meta.summary || '');
  if (!selectedTrendCategory) selectedTrendCategory = normalizeTopic(meta.category || '');
  if (!selectedTrendRegion) selectedTrendRegion = normalizeTopic(meta.region || '');
  if (!selectedTrendSourceUrl) selectedTrendSourceUrl = normalizeTopic(meta.sourceUrl || '');
  if (!selectedTrendSourceName) selectedTrendSourceName = normalizeTopic(meta.sourceName || '');
  if (!selectedTrendPublishedAt) selectedTrendPublishedAt = normalizeTopic(meta.publishedAt || '');
}

function resolveTrendButtonToken(rawToken, chatKey) {
  const tokenMatch = normalizeTopic(rawToken).match(/^topic:([a-z0-9_-]{4,64})$/i);
  if (!tokenMatch?.[1]) return null;
  const token = tokenMatch[1];
  const scoped = staticData.trendButtonMapByChat[String(chatKey || '')] || {};
  const found = scoped[token];
  if (!found?.title) return null;
  return {
    token,
    title: normalizeTopic(found.title || ''),
    summary: normalizeTopic(found.summary || ''),
    category: normalizeTopic(found.category || ''),
    region: normalizeTopic(found.region || ''),
    sourceUrl: normalizeTopic(found.sourceUrl || ''),
    sourceName: normalizeTopic(found.sourceName || ''),
    publishedAt: normalizeTopic(found.publishedAt || '')
  };
}

const now = Date.now();
const LOCK_MS = 10 * 60 * 1000;
const chatKey = String(data.chatId || '');
const defaultChatKey = String(staticData.defaultChatId || '');
const memoryKey = chatKey || defaultChatKey;
const lockKey = memoryKey;
const pick = (...vals) => vals.map((v) => normalizeTopic(v)).find(Boolean) || '';
const isCallbackTap = Boolean(sourceMessageText || data.sourceMessageId || data.callbackQueryId);
const callbackQueryId = String(data.callbackQueryId || '').trim();

const resolvedButtonTopic =
  resolveTrendButtonToken(directArgs, chatKey) ||
  resolveTrendButtonToken(directArgs, defaultChatKey) ||
  resolveTrendButtonToken(directArgs, memoryKey);
if (resolvedButtonTopic) {
  directArgs = resolvedButtonTopic.title;
  selectedTrendSummary = resolvedButtonTopic.summary;
  selectedTrendCategory = resolvedButtonTopic.category;
  selectedTrendRegion = resolvedButtonTopic.region;
  selectedTrendSourceUrl = resolvedButtonTopic.sourceUrl;
  selectedTrendSourceName = resolvedButtonTopic.sourceName;
  selectedTrendPublishedAt = resolvedButtonTopic.publishedAt;
  topicSource = 'button_token';
}

function getPendingVideoTopic(key) {
  const v = staticData.pendingVideoTopicByChat?.[key];
  if (!v) return '';
  if (typeof v === 'string') return normalizeTopic(v);
  const topic = normalizeTopic(v.topic || '');
  const ts = Number(v.ts || 0);
  const TTL = 2 * 60 * 60 * 1000;
  if (!topic) return '';
  if (ts && (Date.now() - ts) > TTL) return '';
  return topic;
}

if (lockKey && isCallbackTap) {
  const CALLBACK_TTL_MS = 30 * 60 * 1000;
  const cbSeen = staticData.recentCallbackIdsByChat[lockKey] || {};
  for (const [k, ts] of Object.entries(cbSeen)) {
    if ((Date.now() - Number(ts || 0)) > CALLBACK_TTL_MS) delete cbSeen[k];
  }

  if (callbackQueryId && cbSeen[callbackQueryId]) {
    return [];
  }

  if (callbackQueryId) cbSeen[callbackQueryId] = Date.now();
  staticData.recentCallbackIdsByChat[lockKey] = cbSeen;
}

const active = staticData.activeGenerationByChat[lockKey];
if (active && (now - Number(active.startedAt || 0) > LOCK_MS)) {
  delete staticData.activeGenerationByChat[lockKey];
}

if (slash) {
  const map = {
    '/carousel': 'carousel',
    '/video': 'choose_video',
    '/video_talking': 'video',
    '/video_kling': 'video',
    '/meeting': 'meeting_reels',
    '/meeting_reels': 'meeting_reels',
    '/reels': 'meeting_reels',
    '/trends': 'trends',
    '/status': 'status',
    '/approve': 'approve',
    '/regenerate': 'regenerate',
    '/help': 'help',
    '/stop': 'stop',
    '/cancel': 'stop',
    '/auto': 'none',
    '/commands': 'none',
    '/cmds': 'none',
    '/creator': 'none',
    '/setface': 'none',
    '/setvoiceid': 'none'
  };
  actionType = map[command] || 'none';
  args = directArgs;
  if (args && ['carousel', 'video', 'choose_video'].includes(actionType) && !topicSource) topicSource = 'direct';
}

if (actionType === 'meeting_reels') {
  const meetingUrl = firstUrl(directArgs);
  if (!meetingUrl) {
    actionType = 'none';
    args = '';
    topicSource = 'meeting_usage';
    customReply = [
      'Use /meeting with a meeting or recording link.',
      '',
      'Example:',
      '/meeting https://example.com/recording.mp4',
      'Passcode: abc123',
      'Reels: 4',
      'Length: 25-40s'
    ].join('\\n');
  } else {
    args = directArgs;
    topicSource = 'direct';
    videoMode = 'meeting_reels';
    customReply = 'Great, I will create 4 meeting reels from that recording now.';
  }
}

if (actionType === 'stop') {
  if (lockKey) delete staticData.activeGenerationByChat[lockKey];
  if (chatKey) staticData.pendingAutoActionByChat[chatKey] = '';
  actionType = 'none';
  args = '';
  topicSource = 'stop';
  customReply = 'Stopped. I cleared the active generation lock for this chat. You can send /carousel <topic> or /video <topic> again.';
}

const pendingVideoTopic = getPendingVideoTopic(memoryKey);

syncTrendMeta(args);

const fallbackTopic = pick(
  pendingVideoTopic,
  staticData.pendingTrendTopicByChat[memoryKey],
  staticData.latestSuggestedTopicByChat[memoryKey],
  staticData.lastTrendByChat[memoryKey],
  staticData.userMemory[memoryKey]?.lastTopic,
  staticData.globalSuggestedTopic
);

const isVideoLike = actionType === 'video' || actionType === 'choose_video';

if (!args && (actionType === 'carousel' || isVideoLike)) {
  const replyTopic = extractTopicFromTrendMessage(replyToText, command || '/carousel');
  if (replyTopic) {
    args = replyTopic;
    topicSource = 'reply';
  }
}

if (!args && (actionType === 'carousel' || isVideoLike) && sourceMessageText) {
  const trendTopic = extractTopicFromTrendMessage(sourceMessageText, command || '/carousel');
  const chooseTopic = extractTopicFromChooseVideoMessage(sourceMessageText);
  const sourceTopic = trendTopic || chooseTopic;
  if (sourceTopic) {
    args = sourceTopic;
    topicSource = chooseTopic ? 'source_mode_message' : 'source_message';
  }
}

if (sourceMessageText) {
  const sourceMeta = extractMetaFromTrendMessage(sourceMessageText);
  if (sourceMeta.summary && !selectedTrendSummary) selectedTrendSummary = sourceMeta.summary;
  if (sourceMeta.category && !selectedTrendCategory) selectedTrendCategory = sourceMeta.category;
  if (sourceMeta.region && !selectedTrendRegion) selectedTrendRegion = sourceMeta.region;
  if (sourceMeta.sourceUrl && !selectedTrendSourceUrl) selectedTrendSourceUrl = sourceMeta.sourceUrl;
  if (sourceMeta.sourceName && !selectedTrendSourceName) selectedTrendSourceName = sourceMeta.sourceName;
  if (sourceMeta.publishedAt && !selectedTrendPublishedAt) selectedTrendPublishedAt = sourceMeta.publishedAt;
}

if (!args && (actionType === 'carousel' || isVideoLike)) {
  args = fallbackTopic;
  if (args && topicSource === 'none') topicSource = 'memory';
}

syncTrendMeta(args);

if (['carousel', 'video', 'choose_video'].includes(actionType) && lockKey && isCallbackTap) {
  const tapSig = [
    actionType,
    String(data.sourceMessageId || data.messageId || ''),
    normalizeTopic(args || '')
  ].join('|');
  const lastTap = staticData.recentTapByChat[lockKey];
  const TAP_DEDUPE_MS = 10 * 60 * 1000;

  if (lastTap && lastTap.sig === tapSig && (now - Number(lastTap.ts || 0) < TAP_DEDUPE_MS)) {
    return [];
  }

  staticData.recentTapByChat[lockKey] = { sig: tapSig, ts: now };
}

if (['carousel', 'video', 'choose_video', 'meeting_reels'].includes(actionType) && lockKey) {
  const lock = staticData.activeGenerationByChat[lockKey];
  if (lock && (now - Number(lock.startedAt || 0) < LOCK_MS)) {
    const sameAction = String(lock.type || '') === String(actionType || '');
    const sameSource = String(lock.sourceMessageId || '') === String(data.sourceMessageId || '');

    if (isCallbackTap && sameAction && sameSource) {
      return [];
    }

    const mins = Math.max(1, Math.ceil((LOCK_MS - (now - Number(lock.startedAt || 0))) / 60000));
    actionType = 'none';
    args = '';
    topicSource = 'active_lock';
    customReply = 'A ' + String(lock.type || 'content') + ' generation is already running for this chat. Please wait about ' + mins + ' minute(s), or send /stop to unlock immediately.';
  }
}

let autoAction = '';
if (!args && (actionType === 'carousel' || actionType === 'video' || actionType === 'choose_video')) {
  autoAction = (actionType === 'carousel') ? 'carousel' : 'video';
  actionType = 'trends';
  if (chatKey) staticData.pendingAutoActionByChat[chatKey] = autoAction;
}

if (args && actionType === 'choose_video') {
  const writeKey = chatKey || memoryKey;
  if (writeKey) {
    staticData.pendingVideoTopicByChat[writeKey] = { topic: args, ts: now };
    staticData.pendingTrendTopicByChat[writeKey] = args;
    staticData.latestSuggestedTopicByChat[writeKey] = args;
    staticData.lastTrendByChat[writeKey] = args;
  }
}

if (!args && actionType === 'video' && videoMode) {
  args = pick(
    getPendingVideoTopic(chatKey),
    getPendingVideoTopic(memoryKey),
    fallbackTopic
  );
  if (args && topicSource === 'none') topicSource = 'pending_video_topic';
}

if (args && ['carousel', 'video', 'meeting_reels'].includes(actionType)) {
  const writeKey = chatKey || memoryKey;
  if (writeKey) {
    staticData.userMemory[writeKey] = {
      ...(staticData.userMemory[writeKey] || {}),
      lastAction: actionType,
      lastTopic: args,
      updatedAt: now
    };
    staticData.pendingTrendTopicByChat[writeKey] = args;
    staticData.latestSuggestedTopicByChat[writeKey] = args;
    staticData.lastTrendByChat[writeKey] = args;
    staticData.pendingAutoActionByChat[writeKey] = '';
    staticData.activeGenerationByChat[writeKey] = {
      type: actionType,
      topic: args,
      startedAt: now,
      messageId: String(data.messageId || ''),
      sourceMessageId: String(data.sourceMessageId || '')
    };
  }
}

if (chatKey && ['carousel', 'video', 'choose_video', 'meeting_reels', 'trends', 'approve', 'regenerate'].includes(actionType)) {
  staticData.lastManualCommandAtByChat[chatKey] = now;
}

const replies = {
  carousel: args ? 'Great, I will create your carousel on: ' + args : 'I could not resolve a topic for carousel.',
  video: args ? 'Great, I will create your video draft on: ' + args : 'I could not resolve a topic for video.',
  meeting_reels: args ? 'Great, I will create 4 meeting reels from that recording now.' : 'I could not resolve a recording link for meeting reels.',
  choose_video: args ? 'Choose video style for:\\n' + args : 'I could not resolve a topic for video.',
  trends: 'I am pulling the latest UK dementia-care trends now.',
  approve: 'Approving the latest content now.',
  regenerate: 'Regenerating a fresh version now.',
  status: 'Checking system status now.',
  help: 'You can use /trends, /carousel <topic>, /video <topic>, /meeting <link>, /approve, or /regenerate.'
};

const replyText = customReply || replies[actionType] || 'Ready.';

return [{
  json: {
    ...data,
    action: { type: actionType, topic: args },
    args,
    forcedTopic: directArgs,
    topicSource,
    customReply: replyText,
    command,
    videoMode,
    chatId: data.chatId,
    messageId: data.messageId,
    selectedTrendSummary,
    selectedTrendCategory,
    selectedTrendRegion,
    selectedTrendSourceUrl,
    selectedTrendSourceName,
    selectedTrendPublishedAt,
    debugTopicSources: {
      directArgs,
      fallbackTopic,
      sourceMessageText,
      replyToText,
      resolvedButtonTopic: resolvedButtonTopic?.token || '',
    }
  }
}];
"""


NORMALIZE_RENDER_CALLBACK = """const src = ($json.body && typeof $json.body === 'object') ? $json.body : ($json || {});
const chatId = String(src.chatId || '').trim();
if (!chatId) return [];

function clean(s) {
  return String(s || '').replace(/[\\r\\n]+/g, ' ').replace(/\\s+/g, ' ').trim();
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
  /^https?:\\/\\/187\\.77\\.178\\.148:3001\\/public\\/(.+)$/i,
  /^https?:\\/\\/srv1417199\\.hstgr\\.cloud\\/public\\/(.+)$/i,
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
const downloadImageUrls = imageUrls.map((u) => toDownloadUrl(u)).filter(Boolean);

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
const pendingDownloadImageUrls = Array.isArray(pending?.downloadImageUrls)
  ? pending.downloadImageUrls.map((u) => normalizeAssetUrl(u)).filter(Boolean)
  : [];

if (assetType === 'carousel') {
  const finalImageUrls = imageUrls.length ? imageUrls : pendingBackgrounds;
  const finalDownloadImageUrls = downloadImageUrls.length
    ? downloadImageUrls
    : (pendingDownloadImageUrls.length ? pendingDownloadImageUrls : finalImageUrls.map((u) => toDownloadUrl(u)).filter(Boolean));
  const carouselOk = status === 'success' && finalImageUrls.length > 0;

  if (!carouselOk) {
    const err = String(src.error || 'Unknown carousel render error').slice(0, 700);
    return [{
      json: {
        chatId,
        title,
        callbackKind: 'carousel',
        status: status || 'error',
        renderOk: false,
        text: ['Carousel render failed.', '', 'Title: ' + title, 'Error: ' + err].join('\\n')
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
    backgroundImageUrls: finalImageUrls,
    downloadImageUrls: finalDownloadImageUrls,
    allImageUrls: finalImageUrls,
    imageUrl: finalImageUrls[0] || '',
    firstImageUrl: finalImageUrls[0] || '',
    imageCount: finalImageUrls.length,
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
      backgroundImageUrls: finalImageUrls,
      downloadImageUrls: finalDownloadImageUrls,
      allImageUrls: finalImageUrls,
      imageUrl: finalImageUrls[0] || '',
      firstImageUrl: finalImageUrls[0] || '',
      imageCount: finalImageUrls.length,
      text: ['Carousel render complete.', '', 'Title: ' + title, '', 'Slides ready: ' + finalImageUrls.length, '', 'Asset host: VPS'].join('\\n')
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
    ].join('\\n');

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
        text: ['Meeting reel ready.', '', 'Title: ' + item.title, ...(item.description ? ['', item.description] : []), '', `Reel ${reelNumber}/${approvalItems.length}`, item.videoUrl].join('\\n')
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

  const joined = parts.join('\\n');
  approvalCaption = joined.length > 1000 ? (joined.slice(0, 997).trim() + '...') : joined;
}

let text = '';
if (renderOk) {
  text = assetType === 'meeting_reels'
    ? ['Meeting reels render complete.', '', 'Title: ' + title, '', ...publicVideoUrls].join('\\n')
    : ['Video render complete.', '', 'Title: ' + title, '', publicVideoUrl].join('\\n');
}

if (!renderOk) {
  const err = String(src.error || 'Unknown render error').slice(0, 700);
  text = ['Video render failed.', '', 'Title: ' + title, 'Error: ' + err].join('\\n');
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


SPLIT_REMAINING_IMAGES = """let data = $input.first().json || {};

if (!Array.isArray(data.allImageUrls) || data.allImageUrls.length === 0) {
  try { data = $('Store Pending Carousel').first().json || data; } catch (e) {}
}
if (!Array.isArray(data.allImageUrls) || data.allImageUrls.length === 0) {
  try { data = $('Package Carousel Data').first().json || data; } catch (e) {}
}

const publicUrls = Array.isArray(data.allImageUrls) ? data.allImageUrls.filter(Boolean) : [];
const downloadUrls = Array.isArray(data.downloadImageUrls) && data.downloadImageUrls.length
  ? data.downloadImageUrls.filter(Boolean)
  : publicUrls;
const slides = Array.isArray(data.slides) ? data.slides : [];

if (!publicUrls.length) {
  throw new Error('No carousel image URLs found to send on Telegram.');
}

return publicUrls.map((url, idx) => {
  const slide = slides[idx] || {};
  return {
    json: {
      chatId: data.chatId,
      imageUrl: String(downloadUrls[idx] || url),
      publicImageUrl: String(url),
      slideIndex: idx + 1,
      totalSlides: publicUrls.length,
      title: data.title || '',
      slideHeading: String(slide.heading || '').trim(),
      slideBody: String(slide.subline || '').trim()
    }
  };
});
"""


SEND_IMAGE_URL_FALLBACK = """={{(() => {
  const current = Number($json.slideIndex || 1);
  const total = Number($json.totalSlides || 1);
  const publicUrl = String($json.publicImageUrl || '').trim();
  if (publicUrl) {
    return `Slide ${current}/${total}:\\n${publicUrl}`;
  }
  return `Slide ${current}/${total} is ready, but Telegram could not fetch the image preview.`;
})()}}"""


def main():
    workflow = load_workflow()

    node_by_name(workflow, "Format Trend Message")["parameters"]["jsCode"] = FORMAT_TREND_MESSAGE
    node_by_name(workflow, "Trends - Send Topic")["parameters"]["inlineKeyboard"]["rows"][0]["row"]["buttons"][0]["additionalFields"]["callback_data"] = "={{ $json.callbackCarousel || \"/carousel\" }}"
    node_by_name(workflow, "Trends - Send Topic")["parameters"]["inlineKeyboard"]["rows"][0]["row"]["buttons"][1]["additionalFields"]["callback_data"] = "={{ $json.callbackVideo || \"/video\" }}"
    node_by_name(workflow, "Quick Parse Slash")["parameters"]["jsCode"] = QUICK_PARSE_SLASH
    node_by_name(workflow, "Normalize Render Callback")["parameters"]["jsCode"] = NORMALIZE_RENDER_CALLBACK
    node_by_name(workflow, "Split Remaining Images")["parameters"]["jsCode"] = SPLIT_REMAINING_IMAGES

    fallback = node_by_name(workflow, "Send Image URL Fallback")
    fallback["parameters"]["text"] = SEND_IMAGE_URL_FALLBACK
    fallback["parameters"]["additionalFields"]["disableWebPagePreview"] = True

    save_workflow(workflow)


if __name__ == "__main__":
    main()

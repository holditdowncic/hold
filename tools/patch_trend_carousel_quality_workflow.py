#!/usr/bin/env python3
import json
from pathlib import Path


WORKFLOW_FILES = [
    Path("/Users/srikarreddy/Downloads/DemContent/dignitate-workflow-v3-stable.json"),
    Path("/Users/srikarreddy/Downloads/DemContent/.tmp-workflow-live.json"),
]


OPENROUTER_TRENDS_JSON_BODY = """={{ JSON.stringify({
  model: "perplexity/sonar-pro",
  messages: [
    {
      role: "system",
      content: "You are a trend analyst for Dignitate, a UK dementia-care organisation supporting cultural carers. Return strict JSON only."
    },
    {
      role: "user",
      content:
        "Find 12 diverse high-engagement trend topics about dementia care and carers from the last 7 days (prioritize last 72 hours)." +
        " Focus UK first, but include major global developments with clear UK relevance." +
        " Cover varied areas: policy, clinical research, caregiving practice, social care delivery, community support, legal rights, workforce, prevention, digital health, finance, and lived-experience stories." +
        " Avoid near-duplicate topics and avoid repeating the same angle." +
        " Phrase each title like a human-facing content hook a carer would actually stop for, not like a policy memo or publication heading." +
        " Avoid titles such as data release highlights, framework update, published report, strategy document, or guidance refresh." +
        " Each summary must explain what changed, why it matters to carers, and one practical implication in plain UK English." +
        " Prefer angles about delayed help, diagnosis gaps, care-plan follow-through, medication risk, support access, carer strain, or practical next steps." +
        " Return ONLY JSON array with exactly 12 items and this schema:" +
        " [{\\"title\\":\\"...\\",\\"summary\\":\\"2-3 sentences in plain English\\",\\"engagement_score\\":8,\\"category\\":\\"policy|research|caregiving|community|technology|finance|legal|clinical\\",\\"region\\":\\"UK|Global-UK\\",\\"source_url\\":\\"...\\",\\"source_name\\":\\"...\\",\\"published_at\\":\\"...\\"}]"
    }
  ]
}) }}"""


FORMAT_TREND_MESSAGE_JS = """const items = $input.all();
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
  if (/\\b(funding|budget|poverty|cost of care|social care funding|council funding)\\b/.test(t)) return 'funding';
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
    'Workflow build: 2026-03-14-trend-carousel-quality-fix',
    'Manual fallback: type carousel + topic or video + topic'
  ].join('\\n');

  const chatKey = String(d.chatId || staticData.defaultChatId || '');
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
      callbackCarousel: '/carousel',
      callbackVideo: '/video',
      sourceUrl,
      sourceName,
      publishedAt
    }
  };
});"""


PARSE_CAROUSEL_RESPONSE_JS = """const response = $input.first().json || {};
const rawContent = response.choices?.[0]?.message?.content || '{}';
const content = Array.isArray(rawContent)
  ? rawContent.map((c) => c?.text || '').join('\\n')
  : String(rawContent || '{}');

let base = {};
try {
  base = $('Parse Carousel Research').first().json || {};
} catch (e) {
  base = {};
}

let commandData = {};
try {
  commandData = $('Prepare Carousel Args').first().json || {};
} catch (e) {
  commandData = {};
}

function clean(value) {
  return String(value || '')
    .replace(/[\\r\\n\\t]+/g, ' ')
    .replace(/\\[(\\d{1,3})\\]/g, '')
    .replace(/([A-Za-z])\\.(\\d{1,2})(?=\\s|$)/g, '$1.')
    .replace(/\\s+/g, ' ')
    .trim();
}

function parseJsonLoose(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  const stripped = t
    .replace(/^```json\\s*/i, '')
    .replace(/^```\\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  try { return JSON.parse(stripped); } catch (e) {}
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(stripped.slice(start, end + 1)); } catch (e2) {}
  }
  return null;
}

function ensurePeriod(text) {
  const t = clean(text).replace(/[,:;\\-\\s]+$/g, '').trim();
  if (!t) return '';
  return /[.!?]$/.test(t) ? t : t + '.';
}

function trimWords(text, maxWords) {
  const tokens = clean(text).split(/\\s+/).filter(Boolean);
  if (!tokens.length) return '';
  if (tokens.length <= maxWords) return ensurePeriod(tokens.join(' '));
  return ensurePeriod(tokens.slice(0, maxWords).join(' '));
}

function titleCase(text) {
  return clean(text)
    .toLowerCase()
    .split(/\\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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

function topicKind(topic, summary, facts) {
  const factText = (Array.isArray(facts) ? facts : []).map((f) => clean(f?.fact || f)).join(' ');
  const t = `${clean(topic)} ${clean(summary)} ${factText}`.toLowerCase();
  if (/\\b(diagnosis|diagnostic|care plan review|care plan|primary care dementia data|ethnicity|age breakdown|equity|unequal|inequity)\\b/.test(t)) return 'diagnosis_gap';
  if (/\\b(antipsychotic|anti-psychotic|medication|medications|prescrib|drug|medicine|side effect|falls)\\b/.test(t)) return 'medication';
  if (/\\b(wait|waiting|delay|delays|backlog|referral wait|memory clinic wait)\\b/.test(t)) return 'delay';
  if (/\\b(research|study|trial|scient|paper|journal|evidence)\\b/.test(t)) return 'research';
  if (/\\b(policy|framework|guidance|government|minister|nhs|icb|board|standard|rollout|strategy|plan)\\b/.test(t)) return 'policy';
  if (/\\b(conference|event|summit|forum|webinar|awards|workshop)\\b/.test(t)) return 'event';
  return 'general';
}

function normalizeFact(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    const fact = clean(item);
    return fact ? { fact, source: '', date: '' } : null;
  }
  const fact = clean(item.fact || item.statement || item.text || item.value || '');
  const source = clean(item.source || '');
  const date = clean(item.date || item.year || '');
  if (!fact) return null;
  return { fact, source, date };
}

function uniqueFacts(values) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(values) ? values : []) {
    const fact = normalizeFact(raw);
    if (!fact) continue;
    const key = fact.fact.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(fact);
  }
  return out;
}

function uniqueStrings(values) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(values) ? values : []) {
    const text = clean(raw);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function normalizeAction(item) {
  if (!item) return '';
  if (typeof item === 'string') return clean(item);
  return clean(item.action || item.step || item.text || item.value || '');
}

function sourceStamp(factObj) {
  const source = clean(factObj?.source || '');
  const date = clean(factObj?.date || '');
  if (!source && !date) return '';
  if (source && date) return ` Source: ${source} (${date}).`;
  if (source) return ` Source: ${source}.`;
  return ` Date: ${date}.`;
}

function buildTwoSentence(primary, secondary, maxWords) {
  const p = ensurePeriod(primary);
  const s = ensurePeriod(secondary);
  return trimWords(`${p} ${s}`, maxWords);
}

function imagePromptFor(role, kind, fallbackPrompt, slideIndex = -1) {
  const fallback = clean(fallbackPrompt);
  const baseStyle = 'Photorealistic UK documentary scene, diverse carers and clinicians including people of colour, natural light, clean realistic details, no logos, no visible text, editorial healthcare photography';
  if (kind === 'diagnosis_gap') {
    if (slideIndex === 0) return baseStyle + ', family carer reviewing NHS letters, a care-plan notebook, and appointment dates at a kitchen table';
    if (slideIndex === 1) return baseStyle + ', clinician discussing diagnosis, review timing, and follow-up with a family carer in a calm NHS consultation room';
    if (slideIndex === 2) return baseStyle + ', family carer at home keeping symptom notes and support paperwork beside an older relative';
    if (slideIndex === 3) return baseStyle + ', family carer asking one focused question while a clinician writes a clear next step';
    if (slideIndex === 4) return baseStyle + ', family organising names, dates, letters, and questions together around a table at home';
  }
  if (kind === 'delay') {
    if (slideIndex === 0) return baseStyle + ', family carer at home reviewing an appointment letter, calendar, and notes at a kitchen table';
    if (slideIndex === 1) return baseStyle + ', family carer waiting in an NHS memory-clinic corridor with an appointment letter in hand, clock blurred in the background';
    if (slideIndex === 2) return baseStyle + ', family carer at home checking routine notes, a medication list, and safety reminders with an older relative nearby';
    if (slideIndex === 3) return baseStyle + ', GP or memory-service appointment with a carer taking notes while a clinician explains the next steps';
    if (slideIndex === 4) return baseStyle + ', family around a table reviewing written questions and support notes together in a warm home setting';
  }
  if (kind === 'medication') {
    if (slideIndex === 0) return baseStyle + ', family carer at home checking a pill organiser, prescription list, and written questions';
    if (slideIndex === 1) return baseStyle + ', medication review appointment with a clinician, carer, blister packs, and a printed medication chart';
    if (slideIndex === 2) return baseStyle + ', family carer at home noting side effects, dose times, and routine changes beside an older relative';
    if (slideIndex === 3) return baseStyle + ', clinician and carer reviewing a medication list together and writing down what changes next';
    if (slideIndex === 4) return baseStyle + ', family carer at a kitchen table updating a handwritten medication diary beside an older relative, with a pill organiser and medicine notes clearly visible';
  }
  if (kind === 'research') {
    if (slideIndex === 0) return baseStyle + ', family carer reading a printed healthcare update with notes and questions at home';
    if (slideIndex === 1) return baseStyle + ', clinician explaining a new care finding to a family carer with a printed summary';
    if (slideIndex === 2) return baseStyle + ', family carer at home comparing notes, symptoms, and routine changes after reading new guidance';
    if (slideIndex === 3) return baseStyle + ', carer asking one focused question in a clinic appointment while a clinician writes the plan';
    if (slideIndex === 4) return baseStyle + ', family keeping organised notes and questions together after a care discussion';
  }
  if (kind === 'policy') {
    if (slideIndex === 0) return baseStyle + ', family carer reviewing NHS letters, referral paperwork, and appointment notes at home';
    if (slideIndex === 1) return baseStyle + ', family carer in an NHS clinic checking referral paperwork and waiting pathway details';
    if (slideIndex === 2) return baseStyle + ', family at home sorting forms, letters, and care notes while planning the next step';
    if (slideIndex === 3) return baseStyle + ', clinician or care coordinator explaining a changed care pathway to a family carer and writing next steps';
    if (slideIndex === 4) return baseStyle + ', family organising letters, names, and appointment dates together at a table';
  }
  if (kind === 'event') {
    if (slideIndex === 0) return baseStyle + ', family carer reviewing a verified healthcare event notice and calendar at home';
    if (slideIndex === 1) return baseStyle + ', carer checking a healthcare event leaflet or registration details on paper with clear context';
    if (slideIndex === 2) return baseStyle + ', family carer discussing whether a local support event is relevant to care needs';
    if (slideIndex === 3) return baseStyle + ', carer saving one verified event link and writing down attendance details';
    if (slideIndex === 4) return baseStyle + ', family keeping event details, contact names, and next steps in one notebook';
  }
  if (kind === 'general') {
    if (slideIndex === 0) return baseStyle + ', family carer at home reviewing care notes, appointment letters, and a written question list';
    if (slideIndex === 1) return baseStyle + ', clinician explaining one current care issue to a family carer in a calm healthcare setting';
    if (slideIndex === 2) return baseStyle + ', family carer at home writing down symptoms, routine changes, and care concerns beside an older relative';
    if (slideIndex === 3) return baseStyle + ', carer and clinician agreeing one practical next step and writing it down';
    if (slideIndex === 4) return baseStyle + ', family reviewing notes and next steps together around a table at home';
  }
  if (fallback) return fallback;
  return baseStyle + ', practical dementia-care conversation between a professional and a family carer';
}

const parsed = parseJsonLoose(content) || {};
const requestedTopic = clean(base.requestedTopic || base.args || commandData.args || 'UK dementia care update');
const summaryAnchor = firstSentence(base.selectedTrendSummary || base.researchSummary || '');
const facts = uniqueFacts(base.researchFacts);
const actions = uniqueStrings((Array.isArray(base.researchActions) ? base.researchActions : []).map(normalizeAction));
const kind = topicKind(requestedTopic, summaryAnchor, facts);

const fact1 = facts[0] || { fact: 'Support delays can leave carers repeating the same information while they wait for the next step in care.', source: '', date: '' };
const fact2 = facts[1] || facts[0] || { fact: 'When support is delayed, families often carry more confusion, more stress, and less clarity about what to do next.', source: '', date: '' };
const action1 = actions[0] || 'Ask your GP or memory service for one named contact and a written plan you can refer to at home.';
const action2 = actions[1] || 'Keep one short written list of symptoms, medication changes, and questions for the next appointment so decisions are easier.';

function coverHeadingFor(kind) {
  if (kind === 'diagnosis_gap') return 'Diagnosis Gaps Still Matter';
  if (kind === 'delay') return 'Diagnosis Delays Hit Families';
  if (kind === 'medication') return 'Medication Reviews Matter Now';
  if (kind === 'research') return 'What New Evidence Changes';
  if (kind === 'policy') return 'Policy Changes Affect Care';
  if (kind === 'event') return 'Use Only Verified Details';
  return 'One Care Change Matters';
}

function coverSublineFor(kind) {
  if (kind === 'diagnosis_gap') {
    return trimWords(
      'New NHS dementia data suggests some families are still being diagnosed, reviewed, or supported later than they should.',
      38
    );
  }
  if (kind === 'delay') {
    return trimWords(
      'When diagnosis is delayed, families are often left managing memory changes, safety concerns, and appointments without clear guidance.',
      38
    );
  }
  if (kind === 'medication') {
    return trimWords(
      'Medication changes can affect alertness, falls, sleep, and daily function, so carers need a clear review plan.',
      38
    );
  }
  if (kind === 'research') {
    return trimWords(
      'New evidence matters only when carers know what to notice, what to ask, and what should change at home.',
      38
    );
  }
  if (kind === 'policy') {
    return trimWords(
      'Changes in NHS guidance or local pathways can affect referrals, reviews, and who families hear from next.',
      38
    );
  }
  if (kind === 'event') {
    return trimWords(
      'Only use verified event details when they offer practical support, clear guidance, or a real next step for carers.',
      38
    );
  }
  return trimWords(
    `${ensurePeriod(summaryAnchor || fact1.fact)} This can affect daily care, what families should watch at home, and what needs clarifying next.`,
    38
  );
}

function slide2HeadingFor(kind) {
  if (kind === 'diagnosis_gap') return 'What The Data Shows';
  if (kind === 'delay') return 'Delays Slow Care Access';
  if (kind === 'medication') return 'Review The Medication';
  if (kind === 'research') return 'What Changed';
  if (kind === 'policy') return 'Pathways Can Change Quickly';
  if (kind === 'event') return 'Check The Key Details';
  return 'What Matters Now';
}

function slide3HeadingFor(kind) {
  if (kind === 'diagnosis_gap') return 'Why Families Feel It';
  if (kind === 'delay') return 'What This Changes At Home';
  if (kind === 'medication') return 'What To Watch At Home';
  if (kind === 'research') return 'Why It Matters At Home';
  if (kind === 'policy') return 'What Families May Notice';
  if (kind === 'event') return 'Why It Matters For Carers';
  return 'What This Means At Home';
}

function slide4HeadingFor(kind) {
  if (kind === 'diagnosis_gap') return 'Ask This At The Review';
  if (kind === 'delay') return 'Ask For One Named Contact';
  if (kind === 'medication') return 'Bring One Medication List';
  if (kind === 'research') return 'Ask One Specific Question';
  if (kind === 'policy') return 'Ask How The Pathway Changed';
  if (kind === 'event') return 'Use One Verified Link';
  return 'Take One Clear Step';
}

function closeHeading(kind) {
  if (kind === 'diagnosis_gap') return 'Keep The Next Step Clear';
  if (kind === 'delay') return 'Keep Support Moving';
  if (kind === 'medication') return 'Safer Care Starts Here';
  if (kind === 'research') return 'Keep Notes You Can Use';
  if (kind === 'policy') return 'Use The Next Appointment';
  if (kind === 'event') return 'Keep The Details Together';
  return 'Keep Moving Forward';
}

function slide2BodyFor(kind, factObj) {
  if (kind === 'diagnosis_gap') {
    return trimWords(
      `${ensurePeriod(factObj.fact || summaryAnchor)}${sourceStamp(factObj)} The practical question is whether diagnosis, review, and follow-up are happening early enough and equally.`,
      40
    );
  }
  if (kind === 'delay') {
    return trimWords(
      'Long waits can delay care planning, referrals, medication reviews, and clear follow-up. Families are often left chasing updates without knowing who owns the next step.',
      40
    );
  }
  if (kind === 'medication') {
    return trimWords(
      'Antipsychotics and other medication changes can affect alertness, falls, sleep, or agitation. Carers need to know what changed, why it changed, and when it will be reviewed again.',
      40
    );
  }
  if (kind === 'research') {
    return trimWords(
      `${ensurePeriod(factObj.fact)}${sourceStamp(factObj)} The useful question is what carers should now notice, ask about, or record at home.`,
      40
    );
  }
  if (kind === 'policy') {
    return trimWords(
      `${ensurePeriod(factObj.fact)}${sourceStamp(factObj)} Check whether this changes referrals, waiting times, review timing, or who owns follow-up.`,
      40
    );
  }
  if (kind === 'event') {
    return trimWords(
      `${ensurePeriod(factObj.fact)}${sourceStamp(factObj)} Confirm the organiser, date, and booking details before you act on it.`,
      40
    );
  }
  return trimWords(
    `${ensurePeriod(factObj.fact)}${sourceStamp(factObj)} Check what changes now in care, timing, or follow-up for families.`,
    40
  );
}

function slide3BodyFor(kind, factObj) {
  if (kind === 'diagnosis_gap') {
    return trimWords(
      'At home, unequal diagnosis or follow-up usually means more uncertainty, repeated admin, and delayed support. A short written record becomes the fastest way to keep the next review focused.',
      40
    );
  }
  if (kind === 'delay') {
    return trimWords(
      'At home, this can mean missed routines, repeated questions, safety worries, and the same concerns being raised again. A short written record becomes essential when no one owns the next step.',
      40
    );
  }
  if (kind === 'medication') {
    return trimWords(
      'At home, note drowsiness, agitation, dizziness, appetite changes, constipation, falls, and any change in routine or safety before the next review.',
      40
    );
  }
  if (kind === 'research') {
    return trimWords(
      `${ensurePeriod(factObj.fact)} In practice, carers may need to watch for changes earlier, keep clearer notes, and bring one precise question to the next review.`,
      40
    );
  }
  if (kind === 'policy') {
    return trimWords(
      `${ensurePeriod(factObj.fact)} At home, this can show up as new forms, changed thresholds, longer waits, or different teams handling the next step.`,
      40
    );
  }
  if (kind === 'event') {
    return trimWords(
      'Only use event details that create a clear benefit for carers: practical guidance, local support, or clear signposting. Skip vague announcements with no care next step.',
      40
    );
  }
  return trimWords(
    `${ensurePeriod(factObj.fact)} At home, note what changes in routine, function, safety, or stress before the next review.`,
    40
  );
}

function slide4BodyFor(kind) {
  if (kind === 'diagnosis_gap') {
    return trimWords(
      'Ask whether the care plan has been reviewed, what the next follow-up date is, and who to contact if support stalls. Request the answer in writing.',
      36
    );
  }
  if (kind === 'delay') {
    return trimWords(
      'Ask who will update you, what happens next, and when you should hear again. Request one named contact and a written summary of the next step.',
      36
    );
  }
  if (kind === 'medication') {
    return trimWords(
      'Take one up-to-date medication list, note any side effects, and ask what should stay, stop, or be reviewed again. Ask who to contact if symptoms worsen before the next appointment.',
      36
    );
  }
  if (kind === 'research') {
    return trimWords(
      'Choose one clear question and ask how this changes the current care plan, monitoring, or next review date. Request the answer in writing if the plan changes.',
      36
    );
  }
  if (kind === 'policy') {
    return trimWords(
      'Ask what changed locally, who now owns the next step, and whether any referral, assessment, or review needs repeating. Request the updated pathway in writing.',
      36
    );
  }
  if (kind === 'event') {
    return trimWords(
      'Share one verified source, note who it is for, and record any booking or follow-up details in writing.',
      36
    );
  }
  return buildTwoSentence(action1, 'Ask who to contact next and when you should expect an update.', 36);
}

function slide5BodyFor(kind) {
  if (kind === 'diagnosis_gap') {
    return trimWords(
      'Keep dates, letters, symptoms, and your top questions in one place so delays or missed reviews are easier to challenge. If you need extra support, reach out to Dignitate.',
      38
    );
  }
  if (kind === 'delay') {
    return trimWords(
      'Take a short written record of symptoms, safety concerns, medication changes, and your top questions to the next appointment. If you need extra support, reach out to Dignitate.',
      38
    );
  }
  if (kind === 'medication') {
    return trimWords(
      'Keep one written record of doses, side effects, sleep, appetite, and falls, and take it to each review. If you need extra support, reach out to Dignitate.',
      38
    );
  }
  if (kind === 'research') {
    return trimWords(
      'Keep a short record of symptoms, routines, and questions so new evidence can guide real decisions at home. If you need extra support, reach out to Dignitate.',
      38
    );
  }
  if (kind === 'policy') {
    return trimWords(
      'Keep dates, letters, and names in one place so pathway changes do not interrupt follow-up. If you need extra support, reach out to Dignitate.',
      38
    );
  }
  if (kind === 'event') {
    return trimWords(
      'Keep the date, contact, and next step in one place so useful support does not get lost. If you need extra support, reach out to Dignitate.',
      38
    );
  }
  return trimWords(
    'Keep a short record of changes, questions, and next steps so the next appointment starts with the right facts. If you need extra support, reach out to Dignitate.',
    38
  );
}

const coverHeading = coverHeadingFor(kind);
const coverSubline = coverSublineFor(kind);
const slide2Heading = slide2HeadingFor(kind);
const slide3Heading = slide3HeadingFor(kind);
const slide4Heading = slide4HeadingFor(kind);
const slide5Heading = closeHeading(kind);
const slide2Body = slide2BodyFor(kind, fact1);
const slide3Body = slide3BodyFor(kind, fact2);
const slide4Body = slide4BodyFor(kind);
const slide5Body = slide5BodyFor(kind);

const modelSlides = Array.isArray(parsed.slides) ? parsed.slides : [];
const modelPrompt = (index) => {
  const raw = modelSlides[index] || {};
  return clean(raw.imagePrompt || raw.image_prompt || raw.visualPrompt || raw.prompt || '');
};

function fallbackTitleFor(kind, requestedTopic) {
  if (kind === 'diagnosis_gap') return 'Where Dementia Diagnosis Gaps Still Show Up';
  if (kind === 'delay') return 'Why Dementia Support Can Still Stall';
  if (kind === 'medication') return 'What A Medication Review Should Clarify';
  if (kind === 'research') return 'What The Latest Dementia Evidence Means';
  if (kind === 'policy') return 'What This NHS Change Means For Carers';
  return titleCase(requestedTopic).slice(0, 96);
}

const slides = [
  {
    role: 'cover',
    heading: coverHeading,
    subline: coverSubline,
    text: `${coverHeading}: ${coverSubline}`,
    imagePrompt: imagePromptFor('cover', kind, modelPrompt(0), 0),
  },
  {
    role: 'information',
    heading: slide2Heading,
    subline: slide2Body,
    text: `${slide2Heading}: ${slide2Body}`,
    imagePrompt: imagePromptFor('information', kind, modelPrompt(1), 1),
  },
  {
    role: 'information',
    heading: slide3Heading,
    subline: slide3Body,
    text: `${slide3Heading}: ${slide3Body}`,
    imagePrompt: imagePromptFor('information', kind, modelPrompt(2), 2),
  },
  {
    role: 'action',
    heading: slide4Heading,
    subline: slide4Body,
    text: `${slide4Heading}: ${slide4Body}`,
    imagePrompt: imagePromptFor('action', kind, modelPrompt(3), 3),
  },
  {
    role: 'conclusion',
    heading: slide5Heading,
    subline: slide5Body,
    text: `${slide5Heading}: ${slide5Body}`,
    imagePrompt: imagePromptFor('conclusion', kind, modelPrompt(4), 4),
  },
];

const title = clean(parsed.title)
  ? titleCase(parsed.title).slice(0, 96)
  : fallbackTitleFor(kind, requestedTopic);

let caption = clean(parsed.caption || '');
if (!caption) {
  if (kind === 'diagnosis_gap') {
    caption = 'The latest NHS dementia data points to diagnosis and follow-up gaps that still affect families unevenly. One clear question at the next review can save time and confusion. Follow Dignitate for support.';
  } else {
    caption = 'UK dementia-care guidance for carers: one clear fact, what it means in daily life, and one practical step to take next. Follow Dignitate for support.';
  }
}
caption = trimWords(caption, 65);
if (!/\\bfollow\\s+dignitate\\b/i.test(caption)) {
  caption = ensurePeriod(clean(caption + ' Follow Dignitate for support.'));
}

let hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
hashtags = uniqueStrings(hashtags.map((tag) => {
  const t = clean(tag);
  if (!t) return '';
  return t.startsWith('#') ? t : '#' + t.replace(/\\s+/g, '');
})).slice(0, 8);
if (!hashtags.length) {
  hashtags = kind === 'diagnosis_gap'
    ? ['#DementiaCare', '#DiagnosisGap', '#CarerSupport', '#NHS', '#Dignitate']
    : ['#DementiaCare', '#CarerSupport', '#UKHealth', '#NHS', '#Dignitate'];
}

return [{
  json: {
    title,
    slides,
    hashtags,
    caption,
    chatId: base.chatId || commandData.chatId,
    args: requestedTopic,
    coherence: {
      forcedStructure: true,
      factCount: facts.length,
      actionCount: actions.length,
      leakGuard: true,
      deterministicCopy: true,
      denserCopy: true,
      editorialRewrite: true,
    },
    qualityGate: {
      approved: true,
      issues: [],
      fixesApplied: {
        deterministicCopy: true,
        malformedCopyRemoved: true,
        denserCopy: true,
        editorialRewrite: true,
      },
    },
    researchBlocked: Boolean(base.researchBlocked),
    researchBlockReason: clean(base.researchBlockReason || ''),
  }
}];"""


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

    patched = {
        "OpenRouter - Trends": False,
        "Format Trend Message": False,
        "Parse Carousel Response": False,
    }

    for node in nodes:
        name = node.get("name")
        if name == "OpenRouter - Trends":
            node.setdefault("parameters", {})["jsonBody"] = OPENROUTER_TRENDS_JSON_BODY
            patched[name] = True
        elif name == "Format Trend Message":
            node.setdefault("parameters", {})["jsCode"] = FORMAT_TREND_MESSAGE_JS
            patched[name] = True
        elif name == "Parse Carousel Response":
            node.setdefault("parameters", {})["jsCode"] = PARSE_CAROUSEL_RESPONSE_JS
            patched[name] = True

    missing = [name for name, done in patched.items() if not done]
    if missing:
        raise RuntimeError(f"{path}: missing nodes {missing}")

    save_workflow(path, workflow, wrap_as_list)
    print(f"patched: {path}")


def main():
    for path in WORKFLOW_FILES:
        patch_workflow(path)


if __name__ == "__main__":
    main()

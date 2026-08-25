require('dotenv').config();
const path = require('path');
const https = require('https');
const express = require('express');
const { startRecording, stopRecording, isRecording } = require('./recorder');
const { uploadRecording } = require('./upload');

// Works on all Node versions (no native fetch needed)
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 20000 }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse failed: ' + data.slice(0, 100))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('request timeout')); });
  });
}
const { XMLParser } = require('fast-xml-parser');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const {
  Client,
  GatewayIntentBits,
  Events,
  AuditLogEvent,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
  ],
});

// ── Roadmap state (persists in memory while bot runs) ──
let roadmapMessageId = null;

const ROADMAP_SECTIONS = {
  vol1: {
    header: '**◎ BEGINNER — Elements of a Trade**',
    items: [
      'Understanding Terminology',
      'Growth Projection Vol. 1, 2 & 3',
      'Smart Money Concepts',
      'Market Structure',
      'Liquidity',
      'Dealing Ranges',
      'Kill Zones',
      'Power of Three // AMD',
      'Displacement',
      'Economic Calendar // Environment Selection',
      'Time Cycles',
      'SMT / Inter-market Relationship',
      'Market Structure Deviations',
      'Mech Models',
      'Opening Prices / Key Times',
    ],
  },
  vol2: {
    header: '**◈ INTERMEDIATE — Pattern Recognition**',
    items: [
      'Macros',
      'Fixed Range Deviations',
      'Growth Projection Vol. 4',
      'Refined FVGs *(cFVGs, eFVGs)*',
      'Breaker Pattern + Reversal Anticipations',
      'Time-Based Liquidity Pools',
      'IPDA Cycles + Look Back Dealing Ranges',
      'Engineered Liquidity + Unfinished Business',
      'MMXM',
      '3 Candle Model by Nautilus',
      'Fractality of the Markets',
      'Goldbach Po3 Ranges + Goldbach Time',
      'BPR // IBPR // Imbalanced Opens',
      'Range Deviations *(Monday Range)*',
      'True Order Blocks — Wick Theory',
    ],
  },
  vol3: {
    header: '**✦ ADVANCED — The Rabbit Hole**',
    items: [
      'TAPDA Projections',
      'TAPDA',
      'IMP Nodes',
      'Time Fib',
      'Recognizing Market Cycles *(Profiles)*',
      'Smart Money Paradigm Vision',
      'Theoretical Concepts',
      "ICT's Logo",
      '3 Drives Pattern + Shorting ATH',
      'Flout Projections',
      'Alignment',
    ],
  },
};

function buildRoadmapContent() {
  const fmt = (section) =>
    section.header + '\n\n' +
    section.items.map((item, i) => `\`${String(i + 1).padStart(2, '0')}\` ${item}`).join('\n');

  return (
    `@everyone\n\n` +
    `**⌬ THE SMART MONEY PARADIGM**\n` +
    `*A structured path from foundations to the rabbit hole.*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    fmt(ROADMAP_SECTIONS.vol1) + '\n\n' +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    fmt(ROADMAP_SECTIONS.vol2) + '\n\n' +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    fmt(ROADMAP_SECTIONS.vol3) + '\n\n' +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*The market is engineered. Learn the engineering.*`
  );
}

// ── Welcome card ──
const LOGO_PATH = path.join(__dirname, 'assets/logo.png');
const FONT_BASE = path.join(__dirname, 'node_modules/@fontsource/plus-jakarta-sans/files/');

GlobalFonts.registerFromPath(FONT_BASE + 'plus-jakarta-sans-latin-700-normal.woff2', 'Jakarta700');
GlobalFonts.registerFromPath(FONT_BASE + 'plus-jakarta-sans-latin-400-normal.woff2', 'Jakarta400');
GlobalFonts.registerFromPath(FONT_BASE + 'plus-jakarta-sans-latin-300-italic.woff2', 'Jakarta300i');

const fs = require('fs');

async function buildWelcomeCard(member, memberCount) {
  const W = 960, H = 360;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#090909';
  ctx.fillRect(0, 0, W, H);

  const atmo = ctx.createRadialGradient(W * 0.78, H * 0.1, 0, W * 0.78, H * 0.1, W * 0.55);
  atmo.addColorStop(0, 'rgba(255,255,255,0.035)');
  atmo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = atmo;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#232323';
  ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, W - 24, H - 24);

  const logoData = fs.readFileSync(LOGO_PATH);
  const logo = await loadImage(logoData);
  const logoH = 250;
  const logoW = (logo.width / logo.height) * logoH;
  const logoX = 38;
  const logoY = (H - logoH) / 2;
  ctx.drawImage(logo, logoX, logoY, logoW, logoH);

  const fadeLeft = ctx.createLinearGradient(logoX, 0, logoX + 30, 0);
  fadeLeft.addColorStop(0, '#090909'); fadeLeft.addColorStop(1, 'rgba(9,9,9,0)');
  ctx.fillStyle = fadeLeft; ctx.fillRect(logoX, logoY, 30, logoH);

  const fadeTop = ctx.createLinearGradient(0, logoY, 0, logoY + 30);
  fadeTop.addColorStop(0, '#090909'); fadeTop.addColorStop(1, 'rgba(9,9,9,0)');
  ctx.fillStyle = fadeTop; ctx.fillRect(logoX, logoY, logoW, 30);

  const fadeBot = ctx.createLinearGradient(0, logoY + logoH - 30, 0, logoY + logoH);
  fadeBot.addColorStop(0, 'rgba(9,9,9,0)'); fadeBot.addColorStop(1, '#090909');
  ctx.fillStyle = fadeBot; ctx.fillRect(logoX, logoY + logoH - 30, logoW, 30);

  const fadeRight = ctx.createLinearGradient(logoX + logoW - 50, 0, logoX + logoW + 10, 0);
  fadeRight.addColorStop(0, 'rgba(9,9,9,0)'); fadeRight.addColorStop(1, '#090909');
  ctx.fillStyle = fadeRight; ctx.fillRect(logoX + logoW - 50, logoY, 60, logoH);

  const halo = ctx.createRadialGradient(logoX + logoW / 2, H / 2, 20, logoX + logoW / 2, H / 2, 150);
  halo.addColorStop(0, 'rgba(255,255,255,0.05)'); halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);

  const divX = 310;
  const divGrad = ctx.createLinearGradient(0, 40, 0, H - 40);
  divGrad.addColorStop(0, 'rgba(255,255,255,0)');
  divGrad.addColorStop(0.25, 'rgba(255,255,255,0.1)');
  divGrad.addColorStop(0.75, 'rgba(255,255,255,0.1)');
  divGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = divGrad; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(divX, 40); ctx.lineTo(divX, H - 40); ctx.stroke();

  ctx.save();
  ctx.translate(divX, H / 2); ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
  ctx.strokeRect(-4, -4, 8, 8);
  ctx.restore();

  const tX = 340;
  const rG = ctx.createLinearGradient(tX, 0, W - 50, 0);
  rG.addColorStop(0, 'rgba(255,255,255,0.12)'); rG.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '10px Jakarta400';
  ctx.fillText('T H E   S M A R T   M O N E Y   P A R A D I G M', tX, 84);

  ctx.strokeStyle = rG; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(tX, 92); ctx.lineTo(W - 50, 92); ctx.stroke();

  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.3)'; ctx.shadowBlur = 20;
  ctx.fillStyle = '#f8f8f8'; ctx.font = 'bold 36px Jakarta700';
  const displayName = member.user.displayName || member.user.username;
  ctx.fillText(`Welcome, ${displayName}`, tX, 148);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.06)'; ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.font = 'italic 13px Jakarta300i';
  ctx.fillText('The market is engineered. Learn the engineering.', tX, 177);
  ctx.restore();

  ctx.strokeStyle = rG;
  ctx.beginPath(); ctx.moveTo(tX, 193); ctx.lineTo(W - 50, 193); ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px Jakarta400';
  ctx.fillText(`Member  #${memberCount}`, tX, 220);

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.font = 'italic 11px Jakarta300i';
  ctx.fillText('— The Smart Money Paradigm', tX, 300);

  return canvas.toBuffer('image/png');
}

// ── Env Calendar ──
// Canonical event titles — when TV returns multiple variants of the same release,
// only the title matching these exact substrings is kept (first match wins per date+time group)
const EVENT_CANONICAL = [
  'core pce price index mom', 'core pce price index yoy',
  'nonfarm payrolls', 'non-farm payrolls',
  'unemployment rate',
  'average hourly earnings mom',
  'cpi mom', 'core cpi mom',
  'gdp qoq', 'gdp annualized',
  'initial jobless claims',
  'durable goods orders mom',
  'retail sales mom',
  'ism manufacturing', 'ism services',
  'flash manufacturing pmi', 'flash services pmi',
  'personal spending mom', 'personal income mom',
  'michigan consumer sentiment',
  'jolts job openings',
  'federal funds rate', 'fomc statement',
];

async function fetchUSDEvents(week = 'thisweek') {
  const all = await fetchAllUSDEvents(week);
  // TV impact ratings unreliable — reclassify using TSMP tier system
  const classified = all
    .filter(e => e.currency === 'USD' || e.country === 'US')
    .map(e => {
      const tier = _envTier(e.title || e.name || '');
      const n = (e.title || e.name || '').toLowerCase();
      const excluded = ENV_EXCLUDE.some(x => n.includes(x));
      if (excluded || tier > 3) return null;
      return { ...e, impact: tier === 1 ? 'High' : 'Medium', _tier: tier };
    })
    .filter(Boolean);

  // Deduplicate — per date+time bucket, prefer canonical title; drop redundant variants
  const buckets = {};
  for (const e of classified) {
    const key = (e.date || '').slice(0, 10) + '|' + (e.time || '') + '|' + e._tier;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(e);
  }
  const result = [];
  for (const group of Object.values(buckets)) {
    if (group.length === 1) { result.push(group[0]); continue; }
    // Find canonical match
    const canon = group.find(e => EVENT_CANONICAL.some(c => (e.title||'').toLowerCase().includes(c)));
    result.push(canon || group[0]);
  }
  return result.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''));
}

// ── Environment Engine (ported from TradoArc) ──
const ENV_TIER1 = ['federal funds rate','fomc statement','fomc minutes','fomc press conference','interest rate decision','non-farm','nonfarm','nfp','unemployment rate','average hourly earnings','cpi','consumer price index','core pce','pce price'];
const ENV_TIER2 = ['ppi','producer price','retail sales','ism manufacturing','ism services','s&p global pmi','flash manufacturing pmi','flash services pmi','pmi','gdp','durable goods','new home sales','existing home sales','jolts'];
const ENV_TIER3 = ['jobless claims','initial claims','continuing claims','unemployment claims','jolts','consumer confidence','michigan sentiment','michigan consumer','michigan inflation','uom','consumer sentiment','inflation expectations','personal income','personal spending','factory orders'];
const ENV_EXCLUDE = ['nomination','member speaks','speaks','press briefing','testimony','auction','budget balance','statistical bulletin','business index','leading indicators','bank holiday','holiday','crude oil','natural gas','baker hughes','rig count','cftc','speculative positions','net positions','gasoline inventories','distillate','heating oil','commitment of traders','cushing','redbook','ibd/tipp','challenger','federal budget','beige book'];

function _envTier(name) {
  const n = name.toLowerCase();
  if (ENV_TIER1.some(k => n.includes(k))) return 1;
  if (ENV_TIER2.some(k => n.includes(k))) return 2;
  if (ENV_TIER3.some(k => n.includes(k))) return 3;
  return 4;
}

function _envDayType(events) {
  const usd = events.filter(e => {
    if (e.currency !== 'USD' && e.country !== 'US' && (e.country || e.currency || '').toUpperCase() !== 'USD') return false;
    const n = (e.title || e.name || '').toLowerCase();
    if (ENV_EXCLUDE.some(x => n.includes(x))) return false;
    // Use tier system — ignore TV's unreliable impact field
    return _envTier(e.title || e.name || '') <= 3;
  });
  const t1 = usd.filter(e => _envTier(e.title || e.name || '') === 1);
  const t2 = usd.filter(e => _envTier(e.title || e.name || '') === 2);
  const t3 = usd.filter(e => _envTier(e.title || e.name || '') === 3);
  const isNFP = t1.some(e => { const n = (e.title || e.name || '').toLowerCase(); return n.includes('non-farm') || n.includes('nfp') || n.includes('unemployment rate'); });
  const isFOMC = usd.some(e => { const n = (e.title || e.name || '').toLowerCase(); return n.includes('federal funds rate') || n.includes('fomc statement') || n.includes('fomc minutes') || n.includes('fomc press conference') || n.includes('interest rate decision'); });
  const isCPI = t1.some(e => { const n = (e.title || e.name || '').toLowerCase(); return n.includes('cpi') || n.includes('consumer price'); });
  if (t1.length >= 2 || (t1.length && t2.length >= 1)) return { type: 'DOUBLE EVENT', nfp: isNFP, fomc: isFOMC, cpi: isCPI, t1, t2 };
  if (t1.length) return { type: 'EVENT', nfp: isNFP, fomc: isFOMC, cpi: isCPI, t1, t2 };
  if (t2.length >= 2) return { type: 'STACKED', nfp: false, fomc: false, cpi: false, t1, t2 };
  if (t2.length) return { type: 'NORMAL+', nfp: false, fomc: false, cpi: false, t1, t2 };
  if (t3.length) return { type: 'NORMAL+', nfp: false, fomc: false, cpi: false, t1, t2 };
  return { type: 'NORMAL', nfp: false, fomc: false, cpi: false, t1, t2 };
}

function _envSessions(dt, dayOfWeek, allDays, dayIdx) {
  const { type, nfp, fomc, cpi, t1, t2 } = dt;
  const nextDT = allDays[dayIdx + 1];
  const isPreFOMC = !fomc && nextDT && nextDT.fomc;
  const isPreCPI = !cpi && nextDT && nextDT.cpi;
  const isNFPWeekClean = (dayOfWeek === 0 || dayOfWeek === 1) && allDays.some(d => d.nfp);
  const isNFPEve = dayOfWeek === 3 && allDays.some((d, i) => i > dayIdx && d.nfp);
  const hasPPI = t2.some(e => { const n = (e.title || e.name || '').toLowerCase(); return n.includes('ppi') || n.includes('producer price'); });
  const has10am = t2.some(e => { const n = (e.title || e.name || '').toLowerCase(); return n.includes('ism') || n.includes('confidence') || n.includes('jolts'); });

  let sessions = {
    London:    { rating: 'IDEAL',   reason: 'Institutional delivery expected — clean liquidity sweep probable. Best window for London Kill Zone setups.', notes: [] },
    PreMarket: { rating: 'IDEAL',   reason: 'Strong pre-market window. Look for displacement or accumulation into NY open.', notes: [] },
    NYAM:      { rating: 'IDEAL',   reason: 'NY AM Kill Zone active. Expect volatility expansion and directional delivery if structure is clear.', notes: [] },
    Lunch:     { rating: 'CAUTION', reason: 'Lunch session is low-probability on normal days. Price tends to chop or consolidate. Wait for clear continuation.', notes: ['Low volume — avoid chasing', 'Use to manage open trades, not enter new ones'] },
    NYPM:      { rating: 'AVOID',   reason: 'NY PM has low institutional participation. Price action is noise-driven. No edge here on a normal day.', notes: ['Market makers thin out after 13:30', 'Prone to stop hunts without follow-through'] },
  };
  let dayBias = 'IDEAL';
  let behaviorLabel = 'Trending / Clean Delivery';
  let killzones = ['London Kill Zone (02:00–05:00 NY)', 'NY AM Kill Zone (09:30–11:00 NY)'];
  let execNotes = ['Wait for displacement before entry — do not chase', 'Mark liquidity levels pre-market'];
  let warning = '';

  if (nfp) {
    dayBias = 'HIGH-RISK';
    behaviorLabel = 'Extreme Volatility · News-Driven';
    killzones = ['Post-NFP window: 08:45–09:30 NY ONLY if clear displacement'];
    warning = 'NEVER trade the 08:30 release. First move is almost always manipulation. Wait 15–30 min for true displacement to confirm.';
    execNotes = ['Pre-release: stay flat, no positions', 'Watch for HRLR (High Resistance Liquidity Run) at release', 'After 11:00 AM — market is dead, do not trade'];
    sessions = {
      London:    { rating: 'AVOID',   reason: 'NFP day — pre-release phase. London is accumulation disguised as price delivery. Do not trust direction.', notes: ['Institutions positioning ahead of 08:30', 'Any London move can be fully reversed at release'] },
      PreMarket: { rating: 'AVOID',   reason: '07:00–08:30 is the most dangerous window. Market is hunting stops ahead of NFP.', notes: ['Avoid all entries', 'Watch price but stay flat'] },
      NYAM:      { rating: 'CAUTION', reason: 'Post-NFP: wait 15–30 min after 08:30. Only enter if TRUE displacement is clear — not the initial spike.', notes: ['First move = manipulation', 'Entry valid only after structure confirms direction', 'If no clear displacement by 10:00 — step away'] },
      Lunch:     { rating: 'CAUTION', reason: 'If a clear directional move formed post-NFP, lunch can offer continuation. Otherwise avoid.', notes: ['Only trade if morning structure is clean', 'Do not force setups'] },
      NYPM:      { rating: 'AVOID',   reason: 'NFP market is dead after 11:00 AM. Institutions have positioned. Price drifts with no edge.', notes: ['No institutional participation in PM', 'Avoid entirely'] },
    };
  } else if (isNFPEve) {
    dayBias = 'CAUTION';
    behaviorLabel = 'Distorted · Pre-Positioning';
    killzones = ['London if structure is clean only'];
    warning = 'Price is distorted ahead of NFP. Institutions are positioning. Most moves lack follow-through. Reduce size or sit out.';
    execNotes = ['This is the lowest-quality day of NFP week', 'If you must trade — London only, small size, tight stops'];
    sessions = {
      London:    { rating: 'CAUTION', reason: 'Some opportunity in London but expect erratic behavior as positioning builds for Friday.', notes: ['Small size if trading', 'Do not hold through NY open'] },
      PreMarket: { rating: 'CAUTION', reason: 'Pre-market distorted by NFP positioning. Setups may form but follow-through is unreliable.', notes: ['Treat any setup as lower conviction'] },
      NYAM:      { rating: 'AVOID',   reason: 'NY AM is heavily manipulated the day before NFP. Price runs liquidity in both directions.', notes: ['HRLR environment — fake breakouts common', 'Stay flat'] },
      Lunch:     { rating: 'AVOID',   reason: 'No clean continuation expected. Positioning continues into close.', notes: ['Avoid'] },
      NYPM:      { rating: 'AVOID',   reason: 'Pre-NFP PM is dead for directional trading.', notes: ['No edge'] },
    };
  } else if (isNFPWeekClean) {
    dayBias = 'IDEAL';
    behaviorLabel = 'Clean Delivery · NFP Week Early Days';
    killzones = ['London Kill Zone', 'NY AM Kill Zone'];
    execNotes = ['These are the highest-probability days of NFP week', 'Treat like a normal day — full size, standard execution'];
    sessions.Lunch.rating = 'CAUTION';
    sessions.Lunch.notes = ['NFP week — Friday approaching, some early caution creeping in by lunch'];
  } else if (dayOfWeek === 2 && allDays.some(d => d.nfp)) {
    dayBias = 'CAUTION';
    behaviorLabel = 'Early Positioning · Transitioning';
    killzones = ['London Kill Zone (watch for accumulation)'];
    warning = 'Wednesday of NFP week — institutions start positioning. Quality degrades from Monday. Reduce exposure.';
    execNotes = ['London is still usable but watch for reversals', 'NYAM is higher risk than Mon/Tue', 'Reduce position size'];
    sessions.NYAM.rating = 'CAUTION';
    sessions.NYAM.reason = 'NFP week Wednesday — early positioning distorts NY AM. Setups exist but need confirmation.';
    sessions.NYAM.notes = ['Wait for clear displacement', 'Do not force trades'];
    sessions.NYPM.rating = 'AVOID';
  }

  if (cpi) {
    dayBias = 'HIGH-RISK';
    behaviorLabel = 'News-Driven · Volatile Expansion';
    killzones = ['Pre-Market 07:00–08:30 (before release)', 'Lunch 11:30–13:30 (post-stabilization)'];
    warning = 'CPI first move is ALWAYS suspect. Do not trade the spike. Wait for price to retrace and confirm displacement. The real move comes 30–60 min after release.';
    execNotes = ['Pre-release setups are valid — London and Pre-Market', 'At 08:30: stand aside completely', 'After 09:00: look for structure to form on lower timeframe', 'Lunch is the best session on CPI day — continuation with less noise'];
    sessions = {
      London:    { rating: 'CAUTION', reason: 'CPI day London is accumulation — institutions building positions ahead of 08:30. Watch for manipulation of recent range.', notes: ['Do not trust London direction as final bias', 'Mark London H/L — these become targets after release'] },
      PreMarket: { rating: 'IDEAL',   reason: 'Best window on CPI day. Pre-release setups align with institutional positioning. Enter before 08:15 or stay flat for release.', notes: ['Hard stop before 08:30 — do not hold through release', 'Look for displacement from overnight range'] },
      NYAM:      { rating: 'CAUTION', reason: 'Post-CPI NY AM is a whipsaw zone. First 15–30 min after 08:30 is manipulation. Only enter after TRUE displacement confirms.', notes: ['Wait for candle close confirmation after 09:00', 'HRLR environment — first move reverses frequently', 'If no structure by 10:30 — skip NYAM entirely'] },
      Lunch:     { rating: 'IDEAL',   reason: 'Lunch is the highest-quality session on CPI day. Price has digested the news, structure is clear, continuation setups are clean.', notes: ['Best R:R of the day here', 'Look for retest of displacement level from morning'] },
      NYPM:      { rating: 'AVOID',   reason: 'Post-CPI PM is exhaustion. The move has happened. Price action becomes choppy with no directional edge.', notes: ['Institutions done for the day', 'No new setups — manage existing positions only'] },
    };
  }

  if (isPreCPI) {
    dayBias = 'CAUTION';
    behaviorLabel = 'Accumulation · Pre-Event Manipulation';
    killzones = ['London Kill Zone', 'Pre-Market (before NY open)', 'Lunch (hidden expansion)'];
    warning = 'Day before CPI: expect accumulation disguised as normal price action. Institutions building positions. NYAM is a trap — HRLR (High Resistance Liquidity Run) environment.';
    execNotes = ['London and Pre-Market are usable — price moves with intent', 'NYAM is the danger zone — avoid', 'Lunch often offers a hidden expansion as final positioning occurs', 'Do NOT hold trades overnight into CPI'];
    sessions = {
      London:    { rating: 'IDEAL',   reason: 'Pre-CPI London often delivers clean displacement as institutions begin accumulation. Good entry window.', notes: ['Mark range established in London — it becomes the manipulation zone at NY open'] },
      PreMarket: { rating: 'IDEAL',   reason: 'Pre-market is clean before the pre-CPI noise kicks in at NY open. Look for directional setups.', notes: ['Enter with confirmation', 'Size down slightly — next day is high risk'] },
      NYAM:      { rating: 'AVOID',   reason: 'Pre-CPI NYAM is HRLR territory. Price runs highs and lows without committing. Choppy, fake moves, stop hunts.', notes: ['This is the highest-manipulation window of the pre-CPI day', 'Staying flat here protects capital for tomorrow'] },
      Lunch:     { rating: 'IDEAL',   reason: 'Lunch on pre-CPI day often sees hidden expansion as final positioning occurs before the event.', notes: ['Watch for clean directional move', 'Lower size — this is late in the day'] },
      NYPM:      { rating: 'AVOID',   reason: 'Pre-event PM — no edge. Institutions done moving, price drifts.', notes: ['Close any open trades', 'Go flat into CPI tomorrow'] },
    };
  }

  if (fomc) {
    dayBias = 'EVENT';
    behaviorLabel = 'Pre-Event Clean → PM Extreme Volatility';
    killzones = ['London Kill Zone', 'NY AM Kill Zone', 'Lunch (last clean window)', 'Post-FOMC: second move only'];
    warning = 'FOMC 2-phase move: first move after announcement is almost always fake. Wait for the second move (confirmation phase) before entering. Trading the first move is gambling.';
    execNotes = ['Morning sessions are clean — trade normally pre-event', 'Go flat before FOMC announcement', 'Post-FOMC: wait for first move to complete, then trade the reversal/continuation', 'Never hold positions through the announcement'];
    sessions = {
      London:    { rating: 'IDEAL',   reason: 'Pre-FOMC London is clean. Institutional delivery before the event. Standard Kill Zone protocol applies.', notes: ['Trade normally', 'Mark key levels — these will be targeted post-FOMC'] },
      PreMarket: { rating: 'IDEAL',   reason: 'Strong pre-market window before FOMC compression begins. Best entry quality of the day.', notes: ['Enter with confirmation', 'Be flat before PM event'] },
      NYAM:      { rating: 'IDEAL',   reason: 'NY AM is clean on FOMC day — market trading normally before the afternoon event.', notes: ['Standard execution', 'Close or reduce size before 13:00'] },
      Lunch:     { rating: 'IDEAL',   reason: 'Last clean window before FOMC. Institutions quiet, price stable. Last chance for clean setups.', notes: ['Be flat before announcement', 'Do not start new trades after 13:00'] },
      NYPM:      { rating: 'CAUTION', reason: 'FOMC announcement window. EXTREME volatility. 2-phase move almost certain. Only trade the second move after confirmation.', notes: ['Phase 1: fake move — do NOT trade', 'Phase 2: real move — enter with confirmation only', 'If unsure — avoid entirely', 'Risk is 3–5x normal'] },
    };
  }

  if (isPreFOMC) {
    dayBias = 'CAUTION';
    behaviorLabel = 'Choppy · Disrespectful · Pre-Event';
    killzones = ['None with high confidence'];
    warning = 'Day before FOMC: price action is random and disrespectful. Institutions are not committing. Any setup can reverse without reason. Best day to sit out entirely.';
    execNotes = ['This is a protection day — preserve capital', 'If you must trade: London only, smallest size, tight stops', 'Expect fake breakouts and stop hunts all day', 'No session has an edge today'];
    sessions = {
      London:    { rating: 'CAUTION', reason: 'Pre-FOMC London has some structure but reversals are common. If trading, treat every setup as lower conviction.', notes: ['Reduce size significantly', 'Tight stops — price will not respect levels normally'] },
      PreMarket: { rating: 'CAUTION', reason: 'Pre-FOMC pre-market is positioning noise. Setups may look clean but follow-through is unreliable.', notes: ['Lower probability than usual'] },
      NYAM:      { rating: 'CAUTION', reason: 'Pre-FOMC NYAM is erratic. No clear delivery. Market is waiting — not moving with intent.', notes: ['Fake breakouts common', 'Only enter if structure is extremely clear'] },
      Lunch:     { rating: 'CAUTION', reason: 'Pre-FOMC lunch has no institutional backing. Avoid unless structure is unusually clean.', notes: ['Very low probability session today'] },
      NYPM:      { rating: 'AVOID',   reason: 'Pre-FOMC PM — completely avoid. No edge whatsoever. Market is flat/choppy awaiting tomorrow.', notes: ['Do not trade'] },
    };
  }

  if ((type === 'STACKED' || type === 'DOUBLE EVENT') && !cpi && !fomc && !nfp) {
    dayBias = 'CAUTION';
    behaviorLabel = 'Multiple Catalysts · Cluster Risk';
    if (!warning) warning = 'Multiple high-impact events clustered today. Each release can reverse the previous move. Wait for the FINAL event to pass before committing to direction.';
    if (!execNotes.length) execNotes = ['Trade between events if structure allows', 'Avoid holding through any 08:30 or 10:00 release', 'Wait for post-cluster stabilization'];
    sessions.NYAM.rating = sessions.NYAM.rating === 'IDEAL' ? 'CAUTION' : sessions.NYAM.rating;
    if (!sessions.NYAM.notes.length) sessions.NYAM.notes = ['Multiple events in this window — wait for clear structure post-release'];
    if (has10am) {
      sessions.NYAM.rating = 'CAUTION';
      sessions.NYAM.reason = '10:00 AM event cluster detected (ISM/Confidence). NY AM becomes choppy. Look for delayed move or reversal, not immediate entry.';
      sessions.NYAM.notes = ['Avoid entries right at 10:00', 'Wait 15 min post-release for structure to form', 'Reversal setups often better than continuation here'];
    }
  }

  if (hasPPI && !cpi) {
    sessions.NYAM.notes.push('PPI present — may continue or trap CPI direction. Only trade if structure aligns with prior CPI bias');
  }

  if (dayOfWeek === 4 && !nfp) {
    sessions.NYPM.rating = 'AVOID';
    sessions.NYPM.reason = 'Friday PM — institutional participation drops sharply. Price action is noise-driven with no directional edge.';
    sessions.NYPM.notes = ['Market thins out after 13:00 on Fridays', 'Position management only — no new entries'];
    if (!warning) warning = 'Friday: avoid PM entirely. Even if morning was clean, afternoon has no edge.';
  }

  return {
    s: { London: sessions.London.rating, PreMarket: sessions.PreMarket.rating, NYAM: sessions.NYAM.rating, Lunch: sessions.Lunch.rating, NYPM: sessions.NYPM.rating },
    reasons: { London: sessions.London.reason, PreMarket: sessions.PreMarket.reason, NYAM: sessions.NYAM.reason, Lunch: sessions.Lunch.reason, NYPM: sessions.NYPM.reason },
    notes: { London: sessions.London.notes, PreMarket: sessions.PreMarket.notes, NYAM: sessions.NYAM.notes, Lunch: sessions.Lunch.notes, NYPM: sessions.NYPM.notes },
    dayBias, behaviorLabel, killzones, execNotes, warning,
  };
}

function _nyDateStr(d) {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/New_York' }).formatToParts(d);
  const p = {}; parts.forEach(x => { p[x.type] = x.value; });
  return `${p.year}-${p.month}-${p.day}`;
}

function buildEnvEngineWeek(allEvents) {
  const dayMs = 86400000;

  // Derive Monday from the events themselves — works regardless of what day it's called
  let monMid;
  const eventDates = allEvents.map(e => e.date ? e.date.split('T')[0] : '').filter(Boolean).sort();
  if (eventDates.length) {
    // Find the Monday of the week containing the earliest event
    const firstEvent = new Date(eventDates[0] + 'T12:00:00');
    const jsDay = firstEvent.getDay();
    const daysToMon = jsDay === 0 ? 1 : jsDay === 6 ? 2 : -(jsDay - 1);
    monMid = new Date(firstEvent.getTime() + daysToMon * dayMs);
  } else {
    // No events — fall back to calendar week
    const todayStr = _nyDateStr(new Date());
    const todayMid = new Date(todayStr + 'T12:00:00');
    const jsDay = todayMid.getDay();
    const daysToMon = jsDay === 0 ? 1 : jsDay === 6 ? 2 : -(jsDay - 1);
    monMid = new Date(todayMid.getTime() + daysToMon * dayMs);
  }

  const weekDays = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monMid.getTime() + i * dayMs);
    weekDays.push({ date: _nyDateStr(d), dow: i });
  }

  const byDay = weekDays.map(wd => ({
    ...wd,
    events: allEvents.filter(e => {
      const eDate = e.date ? e.date.split('T')[0] : '';
      return eDate === wd.date;
    }),
  }));

  const dayTypes = byDay.map(d => _envDayType(d.events));
  const sessionData = dayTypes.map((dt, i) => _envSessions(dt, i, dayTypes, i));

  return { weekDays, byDay, dayTypes, sessionData };
}

async function buildEnvEngineCard(allEvents) {
  const { weekDays, dayTypes, sessionData } = buildEnvEngineWeek(allEvents);

  const DOW_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const SESSIONS = ['London', 'PreMarket', 'NYAM', 'Lunch', 'NYPM'];
  const SESSION_LABELS = { London: 'London', PreMarket: 'Pre-Market', NYAM: 'NY AM', Lunch: 'Lunch', NYPM: 'NY PM' };
  const SESSION_TIMES = { London: '02:00–05:00', PreMarket: '07:00–08:30', NYAM: '09:30–11:00', Lunch: '11:30–13:30', NYPM: '13:30–16:00' };

  const BIAS_COLORS = {
    'IDEAL':      { dot: '#22d3ee', label: '#22d3ee' },
    'CAUTION':    { dot: '#fbbf24', label: '#fbbf24' },
    'HIGH-RISK':  { dot: '#f87171', label: '#f87171' },
    'AVOID':      { dot: '#f87171', label: '#f87171' },
    'EVENT':      { dot: '#a78bfa', label: '#a78bfa' },
  };

  const SESSION_RATING_COLORS = {
    'IDEAL':   { bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.35)',  text: '#22d3ee' },
    'CAUTION': { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)',  text: '#fbbf24' },
    'AVOID':   { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.30)', text: '#f87171' },
  };

  const TYPE_LABELS = { 'NORMAL': 'Normal', 'NORMAL+': 'Normal+', 'STACKED': 'Stacked', 'EVENT': 'Event', 'DOUBLE EVENT': 'Double Event' };

  // Layout
  const W = 1100;
  const PAD = 44;
  const HEADER_H = 170;
  const DAY_W = (W - PAD * 2 - 16 * 4) / 5; // 5 days with 4 gaps
  const SESSION_ROW_H = 38;
  const DAY_HEADER_H = 80;
  const FOOTER_H = 60;
  const SESSIONS_BLOCK_H = SESSIONS.length * SESSION_ROW_H + 16;
  const DAY_CARD_H = DAY_HEADER_H + SESSIONS_BLOCK_H + 70;
  const H = HEADER_H + DAY_CARD_H + FOOTER_H;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // BG
  ctx.fillStyle = '#0b0d10';
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, 'rgba(255,255,255,0)');
  topBar.addColorStop(0.35, 'rgba(255,255,255,0.18)');
  topBar.addColorStop(0.65, 'rgba(255,255,255,0.18)');
  topBar.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = topBar; ctx.fillRect(0, 0, W, 2);

  // Left accent bar
  const leftBar = ctx.createLinearGradient(0, 60, 0, H - 60);
  leftBar.addColorStop(0, 'rgba(255,255,255,0)');
  leftBar.addColorStop(0.2, 'rgba(255,255,255,0.12)');
  leftBar.addColorStop(0.8, 'rgba(255,255,255,0.12)');
  leftBar.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = leftBar; ctx.fillRect(0, 0, 2, H);

  // Header
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '10px Jakarta400';
  ctx.fillText('T H E   S M A R T   M O N E Y   P A R A D I G M', PAD, 44);

  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.35)'; ctx.shadowBlur = 28;
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px Jakarta700';
  ctx.fillText('Environment Engine', PAD, 92);
  ctx.restore();

  const eventDatesEnv = allEvents.map(e => e.date ? e.date.slice(0,10) : '').filter(Boolean).sort();
  const weekStartEnv = eventDatesEnv.length ? new Date(eventDatesEnv[0] + 'T12:00:00Z') : new Date();
  const weekLabel = 'Session-by-Session Trading Protocol  ·  Week of ' + weekStartEnv.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) + '  ·  All times ET';
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '12px Jakarta400';
  ctx.fillText(weekLabel, PAD, 118);

  // Legend
  const legY = 142;
  const legendItems = [
    { color: '#22d3ee', label: 'IDEAL — Trade it' },
    { color: '#fbbf24', label: 'CAUTION — Reduce size' },
    { color: '#f87171', label: 'AVOID — Stay flat' },
  ];
  let legX = PAD;
  for (const li of legendItems) {
    ctx.save();
    ctx.shadowColor = li.color + 'cc'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(legX + 5, legY, 4, 0, Math.PI * 2);
    ctx.fillStyle = li.color; ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '11px Jakarta400';
    ctx.fillText(li.label, legX + 14, legY + 4);
    legX += ctx.measureText(li.label).width + 36;
  }

  // Header divider
  const ruleG = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  ruleG.addColorStop(0, 'rgba(255,255,255,0.18)');
  ruleG.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  ruleG.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = ruleG; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, 158); ctx.lineTo(W - PAD, 158); ctx.stroke();

  // Day cards
  const cardY = HEADER_H;
  for (let i = 0; i < 5; i++) {
    const dt = dayTypes[i];
    const sd = sessionData[i];
    const cx = PAD + i * (DAY_W + 16);

    const biasC = BIAS_COLORS[sd.dayBias] || BIAS_COLORS['IDEAL'];

    // Card BG
    ctx.fillStyle = 'rgba(255,255,255,0.022)';
    ctx.beginPath();
    ctx.roundRect(cx, cardY, DAY_W, DAY_CARD_H, 8);
    ctx.fill();

    // Card border
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx, cardY, DAY_W, DAY_CARD_H, 8);
    ctx.stroke();

    // Day name
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.2)'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 15px Jakarta700';
    ctx.fillText(DOW_LABELS[i].toUpperCase(), cx + 14, cardY + 28);
    ctx.restore();

    // Day type badge
    const typeLabel = TYPE_LABELS[dt.type] || dt.type;
    ctx.font = '9px Jakarta400';
    const badgeW = ctx.measureText(typeLabel).width + 16;
    ctx.fillStyle = 'rgba(255,255,255,0.055)';
    ctx.beginPath(); ctx.roundRect(cx + 14, cardY + 36, badgeW, 17, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(typeLabel, cx + 22, cardY + 48);

    // Day bias dot + label
    ctx.save();
    ctx.shadowColor = biasC.dot + 'cc'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(cx + DAY_W - 18, cardY + 22, 5, 0, Math.PI * 2);
    ctx.fillStyle = biasC.dot; ctx.fill();
    ctx.restore();
    ctx.fillStyle = biasC.label; ctx.font = 'bold 9px Jakarta400';
    ctx.textAlign = 'right';
    ctx.fillText(sd.dayBias, cx + DAY_W - 26, cardY + 26);
    ctx.textAlign = 'left';

    // Divider under day header
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + 1, cardY + DAY_HEADER_H - 2); ctx.lineTo(cx + DAY_W - 1, cardY + DAY_HEADER_H - 2); ctx.stroke();

    // Sessions
    let sY = cardY + DAY_HEADER_H + 8;
    for (const sess of SESSIONS) {
      const rating = sd.s[sess];
      const rc = SESSION_RATING_COLORS[rating] || SESSION_RATING_COLORS['AVOID'];

      // Session row bg pill
      ctx.fillStyle = rc.bg;
      ctx.beginPath(); ctx.roundRect(cx + 8, sY, DAY_W - 16, SESSION_ROW_H - 4, 5); ctx.fill();
      ctx.strokeStyle = rc.border; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.roundRect(cx + 8, sY, DAY_W - 16, SESSION_ROW_H - 4, 5); ctx.stroke();

      // Session name
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '10px Jakarta400';
      ctx.fillText(SESSION_LABELS[sess], cx + 16, sY + 13);

      // Time
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '8px Jakarta400';
      ctx.fillText(SESSION_TIMES[sess], cx + 16, sY + 25);

      // Rating label right-aligned
      ctx.fillStyle = rc.text; ctx.font = 'bold 9px Jakarta700';
      ctx.textAlign = 'right';
      ctx.fillText(rating, cx + DAY_W - 16, sY + 20);
      ctx.textAlign = 'left';

      sY += SESSION_ROW_H;
    }

    // Warning strip at bottom of card (if any)
    if (sd.warning) {
      const warnY = sY + 6;
      const warnFont = '8.5px Jakarta400';
      ctx.font = warnFont;
      const maxW = DAY_W - 28;
      // Word-wrap warning text
      const words = ('⚠ ' + sd.warning).split(' ');
      const lines = [];
      let cur = '';
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
        else cur = test;
      }
      if (cur) lines.push(cur);
      const lineH = 13;
      const stripH = lines.length * lineH + 10;
      ctx.fillStyle = 'rgba(248,113,113,0.07)';
      ctx.beginPath(); ctx.roundRect(cx + 8, warnY, DAY_W - 16, stripH, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(248,113,113,0.25)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.roundRect(cx + 8, warnY, DAY_W - 16, stripH, 4); ctx.stroke();
      ctx.fillStyle = '#f87171'; ctx.font = warnFont;
      lines.forEach((ln, li) => ctx.fillText(ln, cx + 14, warnY + 6 + lineH * (li + 1) - 2));
    }
  }

  // Footer
  const footY = cardY + DAY_CARD_H + 16;
  ctx.strokeStyle = ruleG; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, footY); ctx.lineTo(W - PAD, footY); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.font = 'italic 11px Jakarta300i';
  ctx.fillText('Source: TradingView  ·  USD events only  ·  Based on TSMP news protocols  ·  The Smart Money Paradigm', PAD, footY + 20);

  return canvas.toBuffer('image/png');
}

function _weekDateRange(week) {
  const now = new Date();
  const nyNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dow = nyNow.getDay();
  let monday = new Date(nyNow);
  if (week === 'nextweek') {
    // Days until next Monday: Sun=8, Mon=7, Tue=6... Sat=2
    const d = dow === 0 ? 8 : (8 - dow);
    monday.setDate(nyNow.getDate() + d);
  } else {
    // Days back to this Monday: Sun→+1 (next day), Mon→0, Tue→-1...
    const d = dow === 0 ? 1 : -(dow - 1);
    monday.setDate(nyNow.getDate() + d);
  }
  const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
  // Use getFullYear/Month/Date (local time of nyNow-derived object) to avoid UTC shift
  const fmtLocal = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return { from: fmtLocal(monday), to: fmtLocal(friday) };
}

function _parseInvestingHTML(html) {
  const events = [];
  // Extract day headers for date context
  const dayMap = {};
  const dayHeaders = [...html.matchAll(/id="theDay(\d+)"[^>]*>([^<]+)</g)];
  for (const m of dayHeaders) {
    const ts = parseInt(m[1]) * 1000;
    const d = new Date(ts);
    const iso = d.toISOString().slice(0, 10);
    dayMap[m[1]] = iso;
  }

  const rowRe = /<tr[^>]+id="eventRowId_(\d+)"[^>]*data-event-datetime="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    const body = m[3];
    const datetime = m[2]; // "2026/06/02 08:30:00"
    const dateStr = datetime.slice(0, 10).replace(/\//g, '-');
    const timeStr = datetime.slice(11, 16);

    // Currency
    const currMatch = body.match(/class="ceFlags[^"]*"[^>]*>\s*<\/span>\s*([A-Z]{3})/);
    const currency = currMatch ? currMatch[1].trim() : '';

    // Impact — bull3=High, bull2=Medium, bull1=Low
    const bullMatch = body.match(/data-img_key="bull(\d)"/);
    const bull = bullMatch ? parseInt(bullMatch[1]) : 0;
    const impact = bull === 3 ? 'High' : bull === 2 ? 'Medium' : 'Low';

    // Title
    const titleMatch = body.match(/class="left event"[^>]*>[^<]*<a[^>]*>\s*([^<]+)/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Forecast / Previous
    const forecastMatch = body.match(/id="eventForecast_\d+"[^>]*>([^<]*)</);
    const previousMatch = body.match(/id="eventPrevious_\d+"[^>]*>(?:<span[^>]*>)?([^<]*)/);
    const forecast = forecastMatch ? forecastMatch[1].replace(/&nbsp;/g, '').trim() : '';
    const previous = previousMatch ? previousMatch[1].replace(/&nbsp;/g, '').trim() : '';

    if (!title || !currency) continue;

    // Build date in FF-compatible format (ET offset -04:00 approximate)
    events.push({
      title,
      country: currency,
      currency,
      date: `${dateStr}T${timeStr}:00-04:00`,
      impact,
      forecast,
      previous,
    });
  }
  return events;
}

async function _fetchInvesting(week) {
  const { from, to } = _weekDateRange(week);
  const https = require('https');
  const body = `country%5B%5D=5&importance%5B%5D=3&importance%5B%5D=2&importance%5B%5D=1&dateFrom=${from}&dateTo=${to}&timeZone=8&timeFilter=timeRemain&currentTab=custom&submitFilters=1`;

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.investing.com',
      path: '/economic-calendar/Service/getCalendarFilteredData',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.investing.com/economic-calendar/',
        'Origin': 'https://www.investing.com',
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          const events = _parseInvestingHTML(j.data || '');
          resolve(events);
        } catch (e) { reject(new Error('investing parse fail: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

function _ffNormalize(e) {
  // FF date field: "2026-06-25T08:30:00-04:00" — ET offset already applied
  // Extract date (YYYY-MM-DD) and time (HH:MM) from the ISO string directly
  const dateStr = (e.date || '').slice(0, 10);
  const timeMatch = (e.date || '').match(/T(\d{2}:\d{2})/);
  const time = timeMatch ? timeMatch[1] : '';
  return {
    title:    e.title,
    name:     e.title,
    date:     dateStr,
    time:     time,
    impact:   e.impact || 'Medium',
    forecast: e.forecast || '',
    previous: e.previous || '',
    actual:   e.actual   || '',
    country:  'US',
    currency: 'USD',
  };
}

async function _fetchFFCalendar(week) {
  const url = `${YF_PROXY_URL}/ff-calendar?week=${week === 'nextweek' ? 'nextweek' : 'thisweek'}`;
  const j = await httpsGet(url);
  if (!Array.isArray(j) || !j.length) throw new Error('empty FF response');
  const { from, to } = _weekDateRange(week);
  return j
    .filter(e => e.currency === 'USD' && e.date && e.date.slice(0, 10) >= from && e.date.slice(0, 10) <= to)
    .map(_ffNormalize);
}

async function _fetchTVCalendar(week) {
  const tvWeek = week === 'nextweek' ? 'next' : 'this';
  const url = `${YF_PROXY_URL}/econ-calendar?week=${tvWeek}`;
  const j = await httpsGet(url);
  if (!Array.isArray(j) || !j.length) throw new Error('empty TV response');
  const { from, to } = _weekDateRange(week);
  return j
    .filter(e => (e.currency === 'USD' || e.country === 'US') && e.date >= from && e.date <= to)
    .map(e => ({
      title:    e.title,
      name:     e.title,
      date:     e.date,
      time:     e.time || '',
      impact:   e.impact,
      forecast: e.forecast || '',
      previous: e.previous || '',
      actual:   e.actual   || '',
      country:  e.country  || 'US',
      currency: e.currency || 'USD',
    }));
}

async function fetchAllUSDEvents(week = 'thisweek') {
  const timeout = ms => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));

  // 1. ForexFactory via Cloudflare worker — correct dates, correct impact
  try {
    const result = await Promise.race([_fetchFFCalendar(week), timeout(12000)]);
    if (Array.isArray(result) && result.length) {
      console.log(`FF calendar (${week}): ${result.length} USD events`);
      try { fs.writeFileSync(path.join(__dirname, 'data', `ff_${week}.json`), JSON.stringify(result)); } catch {}
      return result;
    }
  } catch (e) { console.warn(`FF calendar failed (${week}): ${e.message}`); }

  // 2. File cache fallback — only if dates match current week
  try {
    const filePath = path.join(__dirname, 'data', `ff_${week}.json`);
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (raw && raw !== '[]') {
      const j = JSON.parse(raw);
      if (Array.isArray(j) && j.length > 0) {
        const { from, to } = _weekDateRange(week);
        const hasMatchingDate = j.some(e => {
          const d = (e.date || '').slice(0, 10);
          return d >= from && d <= to;
        });
        if (hasMatchingDate) {
          console.log(`Calendar loaded from file cache (${week}): ${j.length} events`);
          // Normalize FF format (full ISO date) same as live fetch
          return j.filter(e => e.currency === 'USD').map(_ffNormalize);
        }
        console.warn(`File cache (${week}) stale — dates don't match ${from}–${to}`);
      }
    }
  } catch {}

  // 3. TradingView fallback
  try {
    console.warn(`Falling back to TradingView (${week})...`);
    const result = await Promise.race([_fetchTVCalendar(week), timeout(12000)]);
    if (Array.isArray(result) && result.length) {
      console.log(`TV calendar fallback (${week}): ${result.length} USD events`);
      return result;
    }
  } catch (e) { console.warn(`TV fallback failed (${week}): ${e.message}`); }

  console.error(`All fetch attempts failed for ${week}`);
  return [];
}

const DOW_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DOW_SHORT  = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const SESSION_LABELS = { London: 'London Open', PreMarket: 'Pre-Market', NYAM: 'NY Morning', Lunch: 'Lunch / Dead Zone', NYPM: 'NY Afternoon' };
const SESSION_TIMES  = { London: '02:00–05:00 NY', PreMarket: '07:00–08:30 NY', NYAM: '09:30–11:00 NY', Lunch: '11:30–13:30 NY', NYPM: '13:30–16:00 NY' };
const SESSION_ICONS  = { London: '🌐', PreMarket: '🌤', NYAM: '⚡', Lunch: '🕐', NYPM: '📉' };
const SESSIONS = ['London', 'PreMarket', 'NYAM', 'Lunch', 'NYPM'];
const BIAS_EMOJI   = { 'IDEAL': '🟢', 'CAUTION': '🟡', 'HIGH-RISK': '🔴', 'AVOID': '🔴', 'EVENT': '🟣' };
const RATING_EMOJI = { 'IDEAL': '✅', 'CAUTION': '⚠️', 'AVOID': '🚫' };
const BIAS_COLOR   = { 'IDEAL': 0x22d3ee, 'CAUTION': 0xfbbf24, 'HIGH-RISK': 0xf87171, 'AVOID': 0xf87171, 'EVENT': 0xa78bfa };
const TYPE_ICON    = { 'NORMAL': '◈', 'NORMAL+': '◈', 'STACKED': '⚡', 'EVENT': '◉', 'DOUBLE EVENT': '◉' };

// Cache week data so button clicks don't re-fetch
let _envWeekCache = null; // { ts, allEvents, weekData }

async function getEnvWeekData() {
  const now = Date.now();
  if (_envWeekCache && (now - _envWeekCache.ts) < 12 * 60 * 60 * 1000) return _envWeekCache.weekData;

  // On Sunday buildEnvEngineWeek shows NEXT week dates — must fetch nextweek events
  // If nextweek not published yet, fall back to thisweek but buildEnvEngineWeek
  // will show next week dates with no matches — so force thisweek dates via allEvents
  const dow = new Date().getDay(); // 0=Sun, 6=Sat
  let allEvents;
  if (dow === 0 || dow === 6) {
    // Weekend — markets closed, show next week
    allEvents = await fetchUSDEvents('nextweek');
    if (!allEvents.length) allEvents = await fetchUSDEvents('thisweek');
  } else {
    allEvents = await fetchUSDEvents('thisweek');
  }

  const weekData = buildEnvEngineWeek(allEvents);
  _envWeekCache = { ts: now, allEvents, weekData };
  return weekData;
}

function buildDayEmbed(weekData, i) {
  const { weekDays, byDay, dayTypes, sessionData } = weekData;
  const wd = byDay[i];
  const dt = dayTypes[i];

  // Deep clone sd so overrides don't mutate cached data
  const sd = JSON.parse(JSON.stringify(sessionData[i]));
  applyEnvOverrides(DOW_LABELS[i], sd);

  const dayOverridden = !!_envOverrides[DOW_LABELS[i]];
  const color = BIAS_COLOR[sd.dayBias] || 0x22d3ee;

  let desc = '';

  // Warning banner
  if (sd.warning) {
    desc += `> ⚠️ **${sd.warning}**\n\n`;
  }

  // Kill zones
  const killzoneStr = sd.killzones.map(k => `\`${k}\``).join('  ·  ') || 'None with high confidence';
  desc += `**Kill Zones**\n${killzoneStr}\n\n`;

  // USD Events
  const highMed = wd.events.filter(e => {
    const n = (e.title || e.name || '').toLowerCase();
    if (ENV_EXCLUDE.some(x => n.includes(x))) return false;
    return e.impact === 'High' || e.impact === 'Medium' || e.impact === 'H' || e.impact === 'M';
  });

  if (highMed.length) {
    desc += `**USD Events**\n`;
    for (const e of highMed) {
      const tier = _envTier(e.title || e.name || '');
      const tierLabel = tier === 1 ? '`T1`' : tier === 2 ? '`T2`' : '`T3`';
      const impactDot = (e.impact === 'High' || e.impact === 'H') ? '🔴' : '🟡';
      const time = e.time || (e.date ? fmtEventTime(e.date) : 'TBD');
      const name = e.title || e.name || 'Unknown';
      const forecast = e.forecast ? ` · F: ${e.forecast}` : '';
      const prev = (e.previous || e.prev) ? ` · P: ${e.previous || e.prev}` : '';
      desc += `${impactDot} ${tierLabel} \`${time} ET\` **${name}**${forecast}${prev}\n`;
    }
    desc += '\n';
  } else {
    desc += `**USD Events**\n*No high/medium impact events scheduled.*\n\n`;
  }

  // Execution Notes
  if (sd.execNotes.length) {
    desc += `**Execution Notes**\n`;
    desc += sd.execNotes.map(n => `› ${n}`).join('\n');
    desc += '\n\n';
  }

  // Session Breakdown
  desc += `**Session Breakdown**${dayOverridden ? '  `MANUAL OVERRIDE`' : ''}\n`;
  for (const sess of SESSIONS) {
    const rating = sd.s[sess];
    const rEmoji = RATING_EMOJI[rating] || '🚫';
    const sIcon = SESSION_ICONS[sess];
    const reason = sd.reasons[sess] || '';
    const sNotes = sd.notes[sess] || [];
    const isManual = sd._sessionManual && sd._sessionManual[sess];
    desc += `\n${sIcon} **${SESSION_LABELS[sess]}** \`${SESSION_TIMES[sess]}\` — ${rEmoji} **${rating}**${isManual ? ' `MANUAL`' : ''}\n`;
    desc += `${reason}\n`;
    if (sNotes.length) {
      desc += sNotes.map(n => `  › *${n}*`).join('\n') + '\n';
    }
  }

  if (desc.length > 4096) desc = desc.slice(0, 4090) + '…';

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`${BIAS_EMOJI[sd.dayBias] || '⚪'} ${DOW_LABELS[i]}  ·  ${TYPE_ICON[dt.type]} ${dt.type}  ·  ${sd.dayBias}`)
    .setDescription(desc)
    .setFooter({ text: `${wd.date}  ·  ${sd.behaviorLabel}  ·  The Smart Money Paradigm` });
}

function buildDayButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('envday_0').setLabel('MON').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('envday_1').setLabel('TUE').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('envday_2').setLabel('WED').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('envday_3').setLabel('THU').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('envday_4').setLabel('FRI').setStyle(ButtonStyle.Secondary),
  );
}

function fmtEventDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

function fmtEventTime(iso) {
  const d = new Date(iso);
  const t = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
  return t === 'Invalid Date' ? 'All Day' : t;
}

async function buildEnvCalendarCard(events) {
  // Group by Mon–Fri using ISO date key, sort High first within each day
  const DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const byDay = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };
  for (const e of events) {
    const dateStr = (e.date || '').slice(0, 10);
    const d = new Date(dateStr + 'T12:00:00Z'); // noon UTC avoids ET midnight boundary shift
    const dow = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' });
    if (byDay[dow]) byDay[dow].push(e);
  }
  for (const k of DAY_KEYS) byDay[k].sort((a, b) => (a.impact === 'High' ? 0 : 1) - (b.impact === 'High' ? 0 : 1));

  // Fixed landscape dimensions — matches env engine aspect ratio
  const W = 1200, H = 640, PAD = 44;
  const HEADER_H = 140, FOOTER_H = 44;
  const CARD_Y = HEADER_H + 10;
  const CARD_H = H - HEADER_H - FOOTER_H - 10;
  const GAP = 12;
  const DAY_W = (W - PAD * 2 - GAP * 4) / 5;
  const DAY_INNER_PAD = 12;
  const ROW_H = 44;
  const DAY_HEADER_H = 44;
  // Max events per column that fit
  const MAX_PER_DAY = Math.floor((CARD_H - DAY_HEADER_H - 10) / ROW_H);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0b0d10';
  ctx.fillRect(0, 0, W, H);

  // Top accent
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, 'rgba(255,255,255,0)');
  topBar.addColorStop(0.35, 'rgba(255,255,255,0.18)');
  topBar.addColorStop(0.65, 'rgba(255,255,255,0.18)');
  topBar.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = topBar; ctx.fillRect(0, 0, W, 2);

  // Left accent
  const leftBar = ctx.createLinearGradient(0, 60, 0, H - 60);
  leftBar.addColorStop(0, 'rgba(255,255,255,0)');
  leftBar.addColorStop(0.2, 'rgba(255,255,255,0.12)');
  leftBar.addColorStop(0.8, 'rgba(255,255,255,0.12)');
  leftBar.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = leftBar; ctx.fillRect(0, 0, 2, H);

  // Header text
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '9px Jakarta400';
  ctx.fillText('T H E   S M A R T   M O N E Y   P A R A D I G M', PAD, 36);

  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.35)'; ctx.shadowBlur = 28;
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px Jakarta700';
  ctx.fillText('Economic Calendar', PAD, 84);
  ctx.restore();

  const eventDatesEco = events.map(e => e.date ? e.date.slice(0,10) : '').filter(Boolean).sort();
  const weekStartEco = eventDatesEco.length ? new Date(eventDatesEco[0] + 'T12:00:00Z') : new Date();
  const weekLabel = 'USD High & Medium Impact Events  ·  Week of ' + weekStartEco.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) + '  ·  All times ET';
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '12px Jakarta400';
  ctx.fillText(weekLabel, PAD, 108);

  // Legend — top right, fully inside canvas
  ctx.font = '11px Jakarta400';
  const legY2 = 86;
  const leg2X = W - PAD - 160; // anchor so both items fit within W
  ctx.save(); ctx.shadowColor = 'rgba(239,68,68,0.9)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(leg2X, legY2 - 3, 5, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillText('High Impact', leg2X + 10, legY2 + 1);
  ctx.save(); ctx.shadowColor = 'rgba(234,179,8,0.9)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(leg2X + 100, legY2 - 3, 5, 0, Math.PI * 2); ctx.fillStyle = '#eab308'; ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillText('Medium Impact', leg2X + 110, legY2 + 1);

  // Header rule
  const ruleG = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  ruleG.addColorStop(0, 'rgba(255,255,255,0.18)');
  ruleG.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  ruleG.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = ruleG; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, HEADER_H - 4); ctx.lineTo(W - PAD, HEADER_H - 4); ctx.stroke();

  // Day columns
  for (let di = 0; di < 5; di++) {
    const dayName = DAY_KEYS[di];
    const cx = PAD + di * (DAY_W + GAP);
    const evts = byDay[dayName];

    // Card background
    ctx.fillStyle = 'rgba(255,255,255,0.022)';
    ctx.beginPath(); ctx.roundRect(cx, CARD_Y, DAY_W, CARD_H, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.roundRect(cx, CARD_Y, DAY_W, CARD_H, 6); ctx.stroke();

    // Day header
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.roundRect(cx, CARD_Y, DAY_W, DAY_HEADER_H, [6, 6, 0, 0]); ctx.fill();

    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.2)'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Jakarta700';
    ctx.fillText(dayName.toUpperCase(), cx + DAY_INNER_PAD, CARD_Y + 20);
    ctx.restore();

    // Event count badge
    const badgeText = evts.length ? `${evts.length} event${evts.length > 1 ? 's' : ''}` : 'No events';
    ctx.font = '9px Jakarta400';
    const bw = ctx.measureText(badgeText).width + 12;
    ctx.fillStyle = evts.length ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
    ctx.beginPath(); ctx.roundRect(cx + DAY_INNER_PAD, CARD_Y + 26, bw, 14, 3); ctx.fill();
    ctx.fillStyle = evts.length ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)';
    ctx.fillText(badgeText, cx + DAY_INNER_PAD + 6, CARD_Y + 37);

    if (evts.length === 0) continue;

    const shown = evts.slice(0, MAX_PER_DAY);
    const overflow = evts.length - shown.length;

    let ey = CARD_Y + DAY_HEADER_H + 4;
    for (const e of shown) {
      const isHigh = e.impact === 'High';

      // Impact dot
      ctx.save();
      ctx.shadowColor = isHigh ? 'rgba(239,68,68,0.9)' : 'rgba(234,179,8,0.9)'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(cx + DAY_INNER_PAD + 4, ey + 13, 4, 0, Math.PI * 2);
      ctx.fillStyle = isHigh ? '#ef4444' : '#eab308'; ctx.fill();
      ctx.restore();

      // Time
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px Jakarta400';
      ctx.fillText(e.time || fmtEventTime(e.date), cx + DAY_INNER_PAD + 14, ey + 11);

      // Title — truncate to fit column width
      ctx.font = (isHigh ? 'bold ' : '') + '11px Jakarta' + (isHigh ? '700' : '400');
      ctx.fillStyle = isHigh ? '#ffffff' : 'rgba(255,255,255,0.72)';
      const maxTitleW = DAY_W - DAY_INNER_PAD * 2 - 12;
      let title = e.title;
      while (ctx.measureText(title).width > maxTitleW && title.length > 4) title = title.slice(0, -2);
      if (title.length < e.title.length) title = title.slice(0, -1) + '…';
      ctx.fillText(title, cx + DAY_INNER_PAD + 12, ey + 25);

      // Forecast / Previous — small line
      if (e.forecast || e.previous) {
        ctx.font = '9px Jakarta400';
        const fStr = e.forecast ? `F: ${e.forecast}` : '';
        const pStr = e.previous ? `P: ${e.previous}` : '';
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText([fStr, pStr].filter(Boolean).join('  '), cx + DAY_INNER_PAD + 12, ey + 38);
      }

      // Row divider
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(cx + 8, ey + ROW_H - 1); ctx.lineTo(cx + DAY_W - 8, ey + ROW_H - 1); ctx.stroke();

      ey += ROW_H;
    }

    // Overflow note
    if (overflow > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = 'italic 9px Jakarta400';
      ctx.fillText(`+${overflow} more`, cx + DAY_INNER_PAD + 12, ey + 12);
    }
  }

  // Footer
  const footY = H - FOOTER_H + 14;
  ctx.strokeStyle = ruleG; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(PAD, footY); ctx.lineTo(W - PAD, footY); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.font = 'italic 10px Jakarta300i';
  ctx.fillText('Source: TradingView  ·  USD events only  ·  Based on TSMP news protocols  ·  The Smart Money Paradigm', PAD, footY + 18);

  return canvas.toBuffer('image/png');
}

async function postEnvCalendar(guild, week = 'thisweek') {
  if (!ENV_CH_ID) return;
  const ch = guild.channels.cache.get(ENV_CH_ID);
  if (!ch) return;

  const events = await fetchUSDEvents(week);
  const cardBuffer = await buildEnvCalendarCard(events);
  const attachment = new AttachmentBuilder(cardBuffer, { name: 'env-calendar.png' });

  const weekLabel = week === 'nextweek' ? 'Next Week' : 'This Week';
  const embed = new EmbedBuilder()
    .setColor(0x0a0a0a)
    .setDescription(
      `**⌬ Economic Calendar — ${weekLabel} USD Events**\n\n` +
      `**Know your environment before you trade it.**\n` +
      `These are the high and medium impact USD events scheduled for the week. ` +
      `Each release has the potential to shift price violently — plan around them, not through them.\n\n` +
      `High impact events require full awareness. Medium impact can act as a catalyst or confirmation. ` +
      `Review this at the start of the week and mark your levels accordingly.`
    )
    .setImage('attachment://env-calendar.png')
    .setFooter({ text: 'The Smart Money Paradigm  ·  USD events only  ·  All times ET' });

  await ch.send({ content: `@everyone`, embeds: [embed], files: [attachment] });
}

async function postEnvEngine(guild, { ping = true, week = 'thisweek' } = {}) {
  if (!ENV_ENGINE_CH_ID) return;
  const ch = guild.channels.cache.get(ENV_ENGINE_CH_ID);
  if (!ch) return;

  const allEvents = await fetchUSDEvents(week);
  if (allEvents.length === 0) return;

  // Cache for button clicks
  const weekData = buildEnvEngineWeek(allEvents);
  _envWeekCache = { ts: Date.now(), allEvents, weekData };

  const cardBuffer = await buildEnvEngineCard(allEvents);
  const attachment = new AttachmentBuilder(cardBuffer, { name: 'env-engine.png' });

  const envWeekLabel = week === 'nextweek' ? 'Next Week' : 'This Week';
  const headerEmbed = new EmbedBuilder()
    .setColor(0x0b0d10)
    .setDescription(
      `**⌬ Environment Selection — ${envWeekLabel} Session Protocol**\n\n` +
      `**Not every session is worth trading. This tells you which ones are.**\n` +
      `Each day is rated based on USD news events, market structure context, and session timing. ` +
      `IDEAL means full size, clean execution. CAUTION means reduce exposure. AVOID means stay flat — no exceptions.\n\n` +
      `Click a day below for the full breakdown — session ratings, execution notes, and what to watch for.`
    )
    .setImage('attachment://env-engine.png')
    .setFooter({ text: 'The Smart Money Paradigm  ·  Session-by-Session Protocol  ·  All times ET' });

  await ch.send({
    content: ping ? `@everyone` : undefined,
    embeds: [headerEmbed],
    files: [attachment],
    components: [buildDayButtons()],
  });
}

// ── Env Overrides (persisted to disk) ──
const ENV_OVERRIDES_PATH = path.join(__dirname, 'env_overrides.json');

function loadEnvOverrides() {
  try { return JSON.parse(fs.readFileSync(ENV_OVERRIDES_PATH, 'utf8')); } catch { return {}; }
}
function saveEnvOverrides(data) {
  fs.writeFileSync(ENV_OVERRIDES_PATH, JSON.stringify(data, null, 2));
}

let _envOverrides = loadEnvOverrides();
// shape: { 'Monday': { warning, execNotes, killzones }, 'Monday_NYAM': { rating, reason, notes } }

function applyEnvOverrides(dowLabel, sd) {
  const dayKey = dowLabel;
  const day = _envOverrides[dayKey];
  if (day) {
    if (day.warning   !== undefined) sd.warning   = day.warning;
    if (day.execNotes !== undefined) sd.execNotes = day.execNotes.split('\n').filter(l => l.trim());
    if (day.killzones !== undefined) sd.killzones = day.killzones.split('\n').filter(l => l.trim());
  }
  for (const sess of SESSIONS) {
    const sessKey = `${dayKey}_${sess}`;
    const so = _envOverrides[sessKey];
    if (so) {
      if (so.rating !== undefined && so.rating) sd.s[sess] = so.rating;
      if (so.reason !== undefined) sd.reasons[sess] = so.reason;
      if (so.notes  !== undefined) sd.notes[sess]   = so.notes.split('\n').filter(l => l.trim());
      if (so.rating) sd._sessionManual = sd._sessionManual || {};
      if (so.rating) sd._sessionManual[sess] = true;
    }
  }
  return sd;
}

// ── IDs ──
const PENDING_ROLE_ID  = '1510297038234058804';
const MENTEE_ROLE_ID   = '1469222481247211685';
const WELCOME_CH_ID    = '1510297375506436348';
const ROLES_CH_ID      = '1528332521429925980';
const TICKETS_CH_ID    = '1510299210371567709';
const FREE_CHAT_CH_ID  = '1510297377779748994';
const GENERAL_CH_ID    = '1469213842390253602';
const STREAM_ANNOUNCE_CH_ID = '1513619561570898064'; // where /host-stream posts its Join VC announcement
const PREMIUM_SIGNAL_ROLE_ID = '1538203144868208680';

// ── Daily opening-range poll (Mon-Fri, 9:15 AM ET post, 9:29 AM ET reveal) ──
// discord.js on this version predates native Poll support, so it's built as
// a plain embed + 3 buttons with an in-memory vote tally, same pattern as
// every other button-driven feature in this file.
const OR_POLL_OPTIONS = [
  { key: 'pump',  label: 'Pump',  emoji: '📈' },
  { key: 'dump',  label: 'Dump',  emoji: '📉' },
  { key: 'judas', label: 'Judas Swing', emoji: '🔀' },
];
let orPollState = null; // { messageId, votes: Map<userId, key> }

function _buildFreeChatEmbed() {
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('👋  welcome to free chat')
    .setDescription(
      'feel free to introduce yourself or ask questions here.\n\n' +
      '**want to join the mentorship?**\n' +
      'head over to <#1528332521429925980> and hit **Request Access** — fill out the short form and our team will review your ticket.\n\n' +
      '-# this channel is open to everyone · mentorship access is reviewed manually'
    )
    .setFooter({ text: 'TSMP · Smart Money Paradigm' });
}

async function _saveTicketTranscript(thread, closedBy) {
  try {
    const ticketsCh = thread.guild?.channels.cache.get(TICKETS_CH_ID);
    if (!ticketsCh) return;

    // Fetch all messages (Discord returns 100 at a time, paginate)
    let allMsgs = [];
    let before = null;
    while (true) {
      const opts = { limit: 100 };
      if (before) opts.before = before;
      const batch = await thread.messages.fetch(opts);
      if (!batch.size) break;
      allMsgs = allMsgs.concat([...batch.values()]);
      before = batch.last().id;
      if (batch.size < 100) break;
    }
    allMsgs.reverse(); // chronological order

    const lines = [
      `TICKET TRANSCRIPT — ${thread.name}`,
      `Closed by: ${closedBy}`,
      `Closed at: ${new Date().toUTCString()}`,
      `Messages: ${allMsgs.length}`,
      '═'.repeat(60),
      '',
    ];
    for (const m of allMsgs) {
      const ts = new Date(m.createdTimestamp).toUTCString();
      const author = `${m.author.tag} (${m.author.id})`;
      if (m.content) lines.push(`[${ts}] ${author}\n  ${m.content}`);
      if (m.embeds.length) {
        for (const emb of m.embeds) {
          const t = emb.title ? `[EMBED: ${emb.title}]` : '[EMBED]';
          const desc = emb.description ? `\n  ${emb.description.slice(0, 300)}` : '';
          const fields = emb.fields.map(f => `\n    ${f.name}: ${f.value}`).join('');
          lines.push(`[${ts}] ${author}\n  ${t}${desc}${fields}`);
        }
      }
      if (m.attachments.size) {
        for (const att of m.attachments.values()) lines.push(`[${ts}] ${author}\n  [ATTACHMENT: ${att.url}]`);
      }
    }

    const text = lines.join('\n');
    const buf = Buffer.from(text, 'utf8');
    const filename = `${thread.name}-${Date.now()}.txt`;
    const attachment = new AttachmentBuilder(buf, { name: filename });

    const embed = new EmbedBuilder()
      .setColor(0x374151)
      .setTitle(`📄 Ticket Closed — ${thread.name}`)
      .addFields(
        { name: 'Closed By', value: closedBy, inline: true },
        { name: 'Messages', value: String(allMsgs.length), inline: true },
        { name: 'Closed At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      )
      .setFooter({ text: 'Full transcript attached as .txt file' });

    await ticketsCh.send({ embeds: [embed], files: [attachment] });
  } catch (e) {
    console.warn('[ticket transcript] failed:', e.message);
  }
}

const VOLUME_ROLES = {
  'Vol I':   { id: '1508205135099068606', style: ButtonStyle.Success },   // green
  'Vol II':  { id: '1508205224878411786', style: ButtonStyle.Primary },   // yellow/gold — closest is Primary (blurple), override below
  'Vol III': { id: '1508205421385748740', style: ButtonStyle.Danger },    // red
  'Vol IV':  { id: '1538202902294823024', style: ButtonStyle.Secondary },
};

const STAFF_ROLE_IDS = [
  '1469222592312377374', // ⌬ Founder
  '1510299206990958865', // ⬡ Moderator
];

const ASSISTANT_COACH_ROLE_ID = '1508394582952509490';
const SIGNALS_CH_ID = '1534128320612925500'; // /dropsignal always posts here, regardless of which channel the command was run in

// /dropsignal eligibility: any Volume tier, staff, or Assistant Coach.
function _canDropSignal(member) {
  const hasVolume = Object.values(VOLUME_ROLES).some(v => member.roles.cache.has(v.id));
  const isStaff = STAFF_ROLE_IDS.some(id => member.roles.cache.has(id));
  const isAssistantCoach = member.roles.cache.has(ASSISTANT_COACH_ROLE_ID);
  return hasVolume || isStaff || isAssistantCoach;
}

// In-progress "Signal" path drafts (asset/direction picked via buttons, then
// stop/TP via modal), keyed by userId — the multi-step button/modal chain has
// no other way to carry state between separate Discord interactions. Cleared
// once sent, cancelled, or naturally stale after a while (best-effort sweep
// isn't needed given how short-lived these are in practice).
const signalDrafts = new Map(); // userId -> { asset, direction, stop, tp }

// Posts a finished signal to SIGNALS_CH_ID with W/L/Criteria buttons, saves it
// to the website via the Worker, and returns the posted message (or null if
// the channel/post failed). Shared by both the "Level" and "Signal" paths so
// the outcome-button wiring and web-save call only exist in one place.
async function _postSignal(guild, user, { level, note, extraFields, asset, direction, stop, addStopTpButton }) {
  const ch = guild.channels.cache.get(SIGNALS_CH_ID);
  if (!ch) return null;

  const signalId = `sig_${Date.now()}_${user.id}`;

  const embed = new EmbedBuilder()
    .setColor(0x38bdf8)
    .setAuthor({ name: `${user.username} dropped a signal`, iconURL: user.displayAvatarURL() })
    .setTitle(asset ? `🔔 ${asset}` : '🔔 Signal')
    .setTimestamp();
  if (extraFields) embed.addFields(...extraFields);
  embed.addFields(
    { name: direction ? 'Take Profit' : 'Level', value: String(level), inline: true },
    { name: 'Outcome', value: 'Pending', inline: true },
  );
  if (note) embed.addFields({ name: 'Note', value: note });

  const msg = await ch.send({ embeds: [embed] }).catch(() => null);
  if (!msg) return null;

  const rowButtons = [
    new ButtonBuilder().setCustomId(`signal_outcome|${signalId}|W`).setLabel('W').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`signal_outcome|${signalId}|L`).setLabel('L').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`signal_outcome|${signalId}|criteria_not_met`).setLabel('Criteria Not Met').setStyle(ButtonStyle.Secondary),
  ];
  const rows = [new ActionRowBuilder().addComponents(...rowButtons)];
  if (addStopTpButton) {
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`dropsignal_addstoptp_${signalId}`).setLabel('Add Stop & TP').setStyle(ButtonStyle.Primary),
    ));
  }
  await msg.edit({ embeds: [embed], components: rows }).catch(() => {});

  try {
    await fetch('https://smp-join.poshop608.workers.dev/bot/signals', {
      method: 'POST',
      headers: { 'Authorization': `Bot ${process.env.TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: signalId,
        discordId: user.id,
        username: user.username,
        level: String(level),
        note: note || null,
        asset: asset || null,
        direction: direction || null,
        stop: stop || null,
        messageId: msg.id,
      }),
    });
  } catch (e) {
    console.error('[dropsignal] web save failed:', e.message);
  }

  return msg;
}

const NEWS_PROTOCOLS_CH_ID = '1476978704243495003';
const ENV_CATEGORY_ID = '1469241557118095391';
let ENV_CH_ID = null;

// ── Sweep Alerts ──
const SWEEP_WEBHOOK_SECRET = process.env.SWEEP_SECRET || 'tsmp_sweep_secret';
let SWEEP_TC_ROLE_ID   = null;  // 📡 Sweep Alerts role
let SWEEP_QT_ROLE_ID   = null;  // 📐 QT Theory Alerts role
let SWEEP_ALERT_CH_ID  = null;  // #📡〢sweep-alerts channel
let SWEEP_ROLES_CH_ID  = null;  // #🔔〢alert-roles channel
let MOD_LOG_CH_ID      = '1537544874063171645';  // #mod-log channel — hardcoded so it survives process restarts (was reset to null on every Railway redeploy since /setup-modlog only set it in memory, never persisted)

// ── VC Countdown ──
let VC_ALERT_ROLE_ID   = null;  // 📅 VC Alerts role
let VC_SCHED_CH_ID     = null;  // #📅〢vc-schedule channel

// ── Live-stream Join quota (opt-in via /host-stream) ──
// Old system auto-tracked VC time; replaced with an explicit gate: a Founder
// runs /host-stream picking the VC, which posts a "Join VC" button. Nobody
// enters that VC without clicking it first (live-enforced — anyone who slips
// in without clicking gets kicked immediately, checked on every join). A
// click both grants VC access AND locks in one weekly Join-quota use for
// that member — no undo, no switching. Vol I is capped at 3/5 per week;
// Vol II/III/IV, 1-on-1, and staff are unlimited but still must click to
// enter (the click is the single gate for everyone, only the quota differs).
const ONE_ON_ONE_ROLE_ID = '1539004461299539978';
// Base weekly stream limit by volume tier. Staff and 1-on-1 role holders are
// fully unlimited (no cap at all) — everyone else gets their tier's number.
const STREAM_TIER_LIMITS = { 'Vol I': 2, 'Vol II': 3, 'Vol III': 5, 'Vol IV': 5 };
const streamWeeklyJoins = new Map(); // userId -> { weekKey: string, count: number }
const streamBonus = new Map();       // userId -> { weekKey: string, bonus: number } — staff-granted extra sessions
let activeStream = null; // { vcId, vcName, messageId, hostId, startedAt, clickedUserIds: Set<string>, vcTimes: Map<userId, { joinedAt, totalMs }> } — null when no stream is live
const streamHistory = []; // completed (ended, not cancelled) streams: { vcName, hostId, startedAt, endedAt, attendance: [{ userId, ms }] }

function _fmtEt(date) {
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }) + ' ET';
}

function _fmtMins(ms) {
  return `${Math.round(ms / 60000)}m`;
}

function _streamEmbed({ hostId, vcName, startedAt, joined }) {
  return new EmbedBuilder()
    .setColor(0x38bdf8)
    .setTitle('🔴 Live Stream Starting')
    .setDescription(
      `<@${hostId}> is live in **${vcName}**.\n\n` +
      `Click **Join VC** to lock in this stream — no undo once clicked.`
    )
    .addFields(
      { name: 'Weekly limit', value: 'Vol I: 2 · Vol II: 3 · Vol III/IV: 5', inline: false },
      { name: 'Joined', value: `${joined}`, inline: true },
      { name: 'Started', value: _fmtEt(startedAt), inline: true },
    );
}

function _getEtWeekKey(date = new Date()) {
  // Week "key" = the most recent Sunday 00:00 ET, as an ISO date string.
  const et = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dow = et.getDay(); // 0 = Sunday
  const sunday = new Date(et);
  sunday.setDate(et.getDate() - dow);
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().slice(0, 10);
}

function _streamJoinCount(userId) {
  const key = _getEtWeekKey();
  const entry = streamWeeklyJoins.get(userId);
  if (!entry || entry.weekKey !== key) return 0;
  return entry.count;
}

function _streamRecordJoin(userId) {
  const key = _getEtWeekKey();
  const entry = streamWeeklyJoins.get(userId);
  if (!entry || entry.weekKey !== key) {
    streamWeeklyJoins.set(userId, { weekKey: key, count: 1 });
  } else {
    entry.count += 1;
  }
}

function _streamBonus(userId) {
  const key = _getEtWeekKey();
  const entry = streamBonus.get(userId);
  if (!entry || entry.weekKey !== key) return 0;
  return entry.bonus;
}

function _streamSetBonus(userId, bonus) {
  const key = _getEtWeekKey();
  streamBonus.set(userId, { weekKey: key, bonus });
}

function _streamResetQuota(userId) {
  streamWeeklyJoins.delete(userId);
}

function _streamResetAllQuotas() {
  streamWeeklyJoins.clear();
}

// Closes out anyone still sitting in the VC when the stream ends (they never
// got a "leave" VoiceStateUpdate), then archives the whole session to history.
function _streamFinalizeAndLog(stream) {
  const now = Date.now();
  for (const [userId, rec] of stream.vcTimes) {
    if (rec.joinedAt) {
      rec.totalMs += now - rec.joinedAt;
      rec.joinedAt = null;
    }
  }
  const entry = {
    vcName: stream.vcName,
    hostId: stream.hostId,
    startedAt: stream.startedAt,
    endedAt: new Date(now),
    attendance: [...stream.vcTimes.entries()].map(([userId, rec]) => ({ userId, ms: rec.totalMs })),
  };
  streamHistory.push(entry);

  // Persist to the Worker/R2 too — streamHistory alone is in-memory and gets
  // wiped on every Railway restart, which was silently losing all past
  // stream logs. Best-effort: a failed save here shouldn't break End Stream.
  fetch('https://smp-join.poshop608.workers.dev/bot/stream-history', {
    method: 'POST',
    headers: { 'Authorization': `Bot ${process.env.TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(e => console.error('[stream history] web save failed:', e.message));

  return entry;
}

// Builds the same single-stream summary embed /stream-history uses, for one
// already-finalized entry — shared so End Stream's auto-post and the manual
// /stream-history command render identically.
async function _streamHistoryEmbed(guild, entry) {
  let lines = '*No one logged VC time.*';
  if (entry.attendance.length) {
    const rows = [];
    for (const a of entry.attendance.sort((x, y) => y.ms - x.ms)) {
      const member = await guild.members.fetch(a.userId).catch(() => null);
      let quotaTxt = '';
      if (member) {
        if (_streamIsUnlimited(member)) {
          quotaTxt = ' — unlimited';
        } else {
          const limit = _streamBaseLimit(member) + _streamBonus(a.userId);
          const used = _streamJoinCount(a.userId);
          quotaTxt = ` — ${used}/${limit} this week`;
        }
      }
      rows.push(`<@${a.userId}> — ${_fmtMins(a.ms)}${quotaTxt}`);
    }
    lines = rows.join('\n');
  }

  return new EmbedBuilder()
    .setColor(0x38bdf8)
    .setTitle(`🔊 ${entry.vcName}`)
    .setDescription(
      `Host: <@${entry.hostId}>\n` +
      `${_fmtEt(new Date(entry.startedAt))} → ${_fmtEt(new Date(entry.endedAt))}\n\n` +
      `**Attendance:**\n${lines}`
    );
}

function _streamIsUnlimited(member) {
  const isStaff = STAFF_ROLE_IDS.some(id => member.roles.cache.has(id));
  const isOneOnOne = member.roles.cache.has(ONE_ON_ONE_ROLE_ID);
  const isVol4 = member.roles.cache.has(VOLUME_ROLES['Vol IV'].id);
  const isAssistantCoach = member.roles.cache.has(ASSISTANT_COACH_ROLE_ID);
  return isStaff || isOneOnOne || isVol4 || isAssistantCoach;
}

// Highest volume tier the member holds wins (Vol I < II < III < IV), so
// someone with both Vol I and Vol III gets Vol III's limit, not Vol I's.
function _streamBaseLimit(member) {
  const order = ['Vol IV', 'Vol III', 'Vol II', 'Vol I'];
  for (const tier of order) {
    if (member.roles.cache.has(VOLUME_ROLES[tier].id)) return STREAM_TIER_LIMITS[tier];
  }
  return STREAM_TIER_LIMITS['Vol I']; // no volume role at all — fall back to the lowest tier's cap
}

// active countdown: { messageId, vcChannelName, sessionNote, host, startEpoch, intervalId, warned15 }
let _vcCountdown = null;

const VC_STATE_FILE = path.join(__dirname, 'data', 'vc_countdown.json');

function _vcSave() {
  if (!_vcCountdown) {
    try { fs.unlinkSync(VC_STATE_FILE); } catch (_) {}
    return;
  }
  const { messageId, vcChannelName, sessionNote, host, startEpoch, warned4h, warned1h, warned15 } = _vcCountdown;
  fs.writeFileSync(VC_STATE_FILE, JSON.stringify({ messageId, vcChannelName, sessionNote, host, startEpoch, warned4h, warned1h, warned15 }));
}

function _vcLoad() {
  try {
    const raw = fs.readFileSync(VC_STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (_) { return null; }
}

const VC_CHANNELS = [
  { label: '🔊  Live Trading',   name: 'Live Trading'   },
  { label: '🔊  Market Review',  name: 'Market Review'  },
  { label: '🔊  Study Session',  name: 'Study Session'  },
  { label: '🔊  Beginner Only',  name: 'Beginner Only'  },
  { label: '🔊  1-on-1',         name: '1-on-1'         },
];

const VC_PRESET_TIMES = [
  { label: '8:40 AM ET',  value: '08:40' },
  { label: '9:00 AM ET',  value: '09:00' },
  { label: '9:30 AM ET',  value: '09:30' },
  { label: '10:00 AM ET', value: '10:00' },
  { label: '11:00 AM ET', value: '11:00' },
  { label: '2:00 PM ET',  value: '14:00' },
  { label: '3:00 PM ET',  value: '15:00' },
  { label: '3:30 AM ET (London)', value: '03:30' },
];

function _buildVcEmbed(startEpoch, vcChannelName, sessionNote, live, host) {
  const now = Math.floor(Date.now() / 1000);
  const secsLeft = startEpoch - now;
  const color = live ? 0x22c55e : secsLeft <= 900 ? 0xfbbf24 : 0x22d3ee;
  const title = live ? '🟢  Session Is Live' : '⏳  Upcoming VC Session';

  // Hardcoded ET display (UTC-4)
  const etDate = new Date((startEpoch - 4 * 3600) * 1000);
  const etH = etDate.getUTCHours();
  const etM = etDate.getUTCMinutes();
  const etAmPm = etH >= 12 ? 'PM' : 'AM';
  const etH12 = etH % 12 || 12;
  const etMStr = String(etM).padStart(2, '0');
  const etTimeStr = `${etH12}:${etMStr} ${etAmPm} ET`;

  let countdownStr;
  if (live) {
    countdownStr = '**NOW LIVE** — jump in!';
  } else {
    const totalMin = Math.max(0, Math.ceil(secsLeft / 60));
    const hrs  = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    const parts = [];
    if (hrs > 0)  parts.push(`**${hrs}h**`);
    parts.push(`**${mins}m**`);
    countdownStr = `${parts.join(' ')} · <t:${startEpoch}:R>`;
  }
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .addFields(
      { name: 'Channel',         value: `🔊 ${vcChannelName}`, inline: true },
      { name: 'Start Time',      value: `**${etTimeStr}**`, inline: true },
      { name: 'In Your Timezone', value: `<t:${startEpoch}:t> on <t:${startEpoch}:D>`, inline: true },
      { name: live ? 'Status' : 'Starting In', value: countdownStr, inline: false },
    );
  if (host) embed.addFields({ name: 'Hosted By', value: `👤 @${host}`, inline: true });
  if (sessionNote) embed.addFields({ name: 'Note', value: sessionNote, inline: false });
  embed.setFooter({ text: 'The Smart Money Paradigm  ·  VC Schedule  ·  ET = UTC−4' }).setTimestamp();
  return embed;
}

async function _tickVcCountdown() {
  if (!_vcCountdown) return;
  const { messageId, vcChannelName, sessionNote, host, startEpoch, warned15 } = _vcCountdown;
  const guild = client.guilds.cache.first();
  if (!guild || !VC_SCHED_CH_ID) return;
  const ch = guild.channels.cache.get(VC_SCHED_CH_ID);
  if (!ch) return;
  const now = Math.floor(Date.now() / 1000);
  const secsLeft = startEpoch - now;
  const live = secsLeft <= 0;

  // 4-hour warning
  if (!_vcCountdown.warned4h && secsLeft > 0 && secsLeft <= 4 * 3600 && VC_ALERT_ROLE_ID) {
    _vcCountdown.warned4h = true;
    _vcSave();
    await ch.send({ content: `<@&${VC_ALERT_ROLE_ID}> 📅 **${vcChannelName}** session in ~4 hours. <t:${startEpoch}:R>` });
  }
  // 1-hour warning
  if (!_vcCountdown.warned1h && secsLeft > 0 && secsLeft <= 3600 && VC_ALERT_ROLE_ID) {
    _vcCountdown.warned1h = true;
    _vcSave();
    await ch.send({ content: `<@&${VC_ALERT_ROLE_ID}> ⏰ **${vcChannelName}** starts in ~1 hour. <t:${startEpoch}:R>` });
  }
  // 15-min warning
  if (!_vcCountdown.warned15 && secsLeft > 0 && secsLeft <= 900 && VC_ALERT_ROLE_ID) {
    _vcCountdown.warned15 = true;
    _vcSave();
    await ch.send({ content: `<@&${VC_ALERT_ROLE_ID}> 🔔 **${vcChannelName}** starts in ~15 minutes! <t:${startEpoch}:R>` });
  }

  // update embed
  try {
    const msg = await ch.messages.fetch(messageId);
    await msg.edit({ embeds: [_buildVcEmbed(startEpoch, vcChannelName, sessionNote, live, host)] });
  } catch (_) {}

  // stop after live + 30 min
  if (secsLeft < -(30 * 60)) {
    clearInterval(_vcCountdown.intervalId);
    _vcCountdown = null;
    _vcSave();
  }
}

// ── NQ Sweep Monitor ──
const SWEEP_POLL_MS = 30 * 1000;
const NQ_SYMBOL = 'NQ=F';
const YF_PROXY_URL = 'https://yf-proxy.poshop608.workers.dev';

// Static levels refreshed daily/weekly/monthly from YF
let _nqLevels = {
  pdh: null, pdl: null,
  pwh: null, pwl: null,
  pmh: null, pml: null,
  premh: null, preml: null,
};

// Session H/L — keys: asia, london, nyam, nypm
let _tcSessions = {};

// Universal levels from Pine heartbeat (TV webhook, overrides YF if available)
let _pineLevels = {};

// One-shot fired flags
let _swept = {};
let _lastSweepDay  = null;
let _lastSweepWeek = null;
let _lastSweepMonth = null;

// ── Giveaway ──
const _giveaways = new Map();
const GW_WHEEL_FRAMES = 70;
const GW_WHEEL_FRAME_MS = 40; // messageId → { channelId, title, prize, hostId, entrants: Set }

async function _buildWheelGif(names, winnerIndex) {
  const GIFEncoder = require('gif-encoder-2');
  const { createCanvas } = require('@napi-rs/canvas');
  const SIZE = 520, cx = SIZE/2, cy = SIZE/2, radius = 218;
  const totalFrames = GW_WHEEL_FRAMES;
  const n = names.length;
  const sliceAngle = (2*Math.PI)/n;
  const winnerAngle = -(winnerIndex*sliceAngle+sliceAngle/2);
  const totalRotation = Math.PI*2*7 + (Math.PI*2-((-winnerAngle)%(Math.PI*2)));
  function easeInOut(t){ return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }

  const COLORS = [
    ['#a78bfa','#6d28d9'],['#FFD700','#b45309'],['#34d399','#065f46'],
    ['#f472b6','#9d174d'],['#60a5fa','#1e3a8a'],['#fb923c','#7c2d12'],
    ['#e879f9','#701a75'],['#4ade80','#14532d'],['#f87171','#7f1d1d'],['#38bdf8','#0c4a6e'],
  ];

  const encoder = new GIFEncoder(SIZE, SIZE, 'neuquant', true, totalFrames);
  encoder.setDelay(40);
  encoder.setRepeat(-1);
  encoder.start();

  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  for (let f = 0; f < totalFrames; f++) {
    const t = easeInOut(f/(totalFrames-1));
    const rotation = t * totalRotation;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Deep dark bg
    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Purple/indigo radial glow
    const bgGlow = ctx.createRadialGradient(cx,cy,0,cx,cy,SIZE*0.7);
    bgGlow.addColorStop(0,'rgba(100,50,255,0.15)');
    bgGlow.addColorStop(0.5,'rgba(60,20,160,0.08)');
    bgGlow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = bgGlow; ctx.fillRect(0, 0, SIZE, SIZE);

    // Multi-layer outer glow rings
    for (let r = 0; r < 3; r++) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,200,0,0.4)'; ctx.shadowBlur = 20-r*5;
      ctx.beginPath(); ctx.arc(cx, cy, radius+10+r*6, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(255,200,0,${0.25-r*0.07})`;
      ctx.lineWidth = 2-r*0.4; ctx.stroke();
      ctx.restore();
    }

    // Segments
    for (let i = 0; i < n; i++) {
      const sa = rotation+i*sliceAngle-Math.PI/2;
      const ea = sa+sliceAngle;
      const ma = sa+sliceAngle/2;
      const [c1,c2] = COLORS[i%COLORS.length];
      const grad = ctx.createLinearGradient(cx+(radius*0.15)*Math.cos(ma),cy+(radius*0.15)*Math.sin(ma),cx+radius*Math.cos(ma),cy+radius*Math.sin(ma));
      grad.addColorStop(0, c1+'cc');
      grad.addColorStop(1, c2);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,radius,sa,ea); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();

      // Segment edge glow
      ctx.save();
      ctx.shadowColor = c1; ctx.shadowBlur = 8;
      ctx.strokeStyle = c1+'44'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,radius,sa,ea); ctx.closePath();
      ctx.stroke(); ctx.restore();

      // Name
      const textR = radius*0.64;
      const tx = cx+textR*Math.cos(ma), ty = cy+textR*Math.sin(ma);
      ctx.save(); ctx.translate(tx,ty); ctx.rotate(ma+Math.PI/2);
      ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 6;
      const fontSize = Math.max(10, Math.min(16, Math.floor(190/n)));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(names[i].length>10?names[i].slice(0,9)+'…':names[i], 0, 0);
      ctx.restore();
    }

    // Glowing rim
    ctx.save();
    ctx.shadowColor = 'rgba(255,200,0,0.6)'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(cx,cy,radius,0,Math.PI*2);
    ctx.strokeStyle = 'rgba(255,200,0,0.35)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    // Center hub
    const hub = ctx.createRadialGradient(cx-6,cy-6,0,cx,cy,24);
    hub.addColorStop(0,'#fff5c0'); hub.addColorStop(0.4,'#FFD700'); hub.addColorStop(1,'#7c2d12');
    ctx.save();
    ctx.shadowColor = 'rgba(255,200,0,0.8)'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(cx,cy,22,0,Math.PI*2);
    ctx.fillStyle = hub; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    // Glowing diamond pointer
    ctx.save(); ctx.translate(cx, cy-radius-1);
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.moveTo(0,-20); ctx.lineTo(13,2); ctx.lineTo(0,14); ctx.lineTo(-13,2); ctx.closePath();
    const pg = ctx.createLinearGradient(0,-20,0,14);
    pg.addColorStop(0,'#fff9c4'); pg.addColorStop(1,'#FFD700');
    ctx.fillStyle = pg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

async function _spinGiveaway(interaction, messageId) {
  const gw = _giveaways.get(messageId);
  if (!gw) return interaction.reply({ content: 'Giveaway not found.', ephemeral: true });

  let entrantIds = [...gw.entrants];
  if (entrantIds.length === 0) return interaction.reply({ content: 'No one entered!', ephemeral: true });

  await interaction.deferUpdate();

  const ch = interaction.channel;
  const msg = await ch.messages.fetch(messageId);

  // Disable buttons immediately
  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('gw_enter').setLabel(`🎟️ Enter (${entrantIds.length})`).setStyle(ButtonStyle.Primary).setDisabled(true),
    new ButtonBuilder().setCustomId(`gw_spin_${messageId}`).setLabel('🎰 Spinning...').setStyle(ButtonStyle.Danger).setDisabled(true),
  );
  const spinningEmbed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('🎰 Spinning the wheel...')
    .setDescription(`*${entrantIds.length} entrants — generating wheel...*`)
    .setFooter({ text: gw.title });
  await msg.edit({ embeds: [spinningEmbed], components: [disabledRow] });

  // Resolve display names
  let names = await Promise.all(entrantIds.map(async id => {
    try {
      const member = await interaction.guild.members.fetch(id);
      return member.displayName;
    } catch { return 'User'; }
  }));

  // Pick winner before padding
  const winnerIndex = Math.floor(Math.random() * names.length);
  const winnerId = entrantIds[winnerIndex];

  // Pad to min 3 visual segments so wheel looks good with few entrants
  const displayNames = [...names];
  while (displayNames.length < 3) displayNames.push('...');

  // Generate GIF with padded names
  const gifBuf = await _buildWheelGif(displayNames, winnerIndex);
  const attachment = new AttachmentBuilder(gifBuf, { name: 'wheel.gif' });

  // Fetch winner info + build card in parallel with GIF send
  const winnerMember = await interaction.guild.members.fetch(winnerId).catch(() => null);
  const winnerName = winnerMember?.displayName || 'Winner';
  const avatarURL = winnerMember?.user?.displayAvatarURL({ extension: 'png', size: 256 }) || null;

  // Build card while GIF uploads — start timer the moment GIF message is sent
  const GIF_DURATION_MS = GW_WHEEL_FRAMES * GW_WHEEL_FRAME_MS;
  const cardBufPromise = _buildWinnerCard(winnerName, avatarURL, gw.prize, gw.title, entrantIds.length).catch(e => {
    console.error('Winner card build failed:', e?.message || String(e)); return null;
  });

  const gifSentAt = Date.now();
  await ch.send({ content: `🎰 **${gw.title}** — The wheel is spinning!`, files: [attachment] });
  const elapsed = Date.now() - gifSentAt;

  // Wait exactly long enough so card posts when GIF finishes
  const remaining = Math.max(0, GIF_DURATION_MS - elapsed + 1200);
  const [cardBuf] = await Promise.all([
    cardBufPromise,
    new Promise(r => setTimeout(r, remaining)),
  ]);

  await msg.edit({ embeds: [], components: [] }).catch(() => {});

  if (cardBuf) {
    const cardAttachment = new AttachmentBuilder(cardBuf, { name: 'winner.png' });
    await ch.send({ content: `🎉 <@${winnerId}> won **${gw.prize}**! 🎁`, files: [cardAttachment] });
  } else {
    await ch.send({ content: `🎉 Congratulations <@${winnerId}>! You won **${gw.prize}**! 🎁` });
  }

  _giveaways.delete(messageId);
}

async function _buildWinnerCard(winnerName, avatarURL, prize, title, totalEntrants) {
  const { createCanvas, loadImage } = require('@napi-rs/canvas');
  const W = 960, H = 420;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const rng = (() => { let s=77; return()=>{ s=(s*1664525+1013904223)&0xffffffff; return(s>>>0)/0xffffffff; }; })();

  // Deep dark bg
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, W, H);

  // Cinematic center glow — purple/indigo
  const center = ctx.createRadialGradient(W*0.5,H*0.5,0,W*0.5,H*0.5,W*0.7);
  center.addColorStop(0,'rgba(120,60,255,0.12)');
  center.addColorStop(0.4,'rgba(60,30,180,0.08)');
  center.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=center; ctx.fillRect(0,0,W,H);

  // Left warm gold glow behind avatar
  const avatarX=195, avatarY=H/2, avatarR=82;
  const aura=ctx.createRadialGradient(avatarX,avatarY,0,avatarX,avatarY,220);
  aura.addColorStop(0,'rgba(255,200,0,0.18)');
  aura.addColorStop(0.5,'rgba(255,150,0,0.08)');
  aura.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=aura; ctx.fillRect(0,0,W,H);

  // Star field
  for(let i=0;i<80;i++){
    ctx.beginPath(); ctx.arc(rng()*W,rng()*H,rng()*1.5+0.2,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,'+(rng()*0.5+0.08)+')'; ctx.fill();
  }

  // Confetti
  const cc=['#FFD700','#ff6b6b','#a78bfa','#34d399','#60a5fa','#f472b6'];
  for(let i=0;i<50;i++){
    ctx.save(); ctx.translate(rng()*W,rng()*H); ctx.rotate(rng()*Math.PI*2);
    ctx.globalAlpha=rng()*0.5+0.15;
    ctx.fillStyle=cc[Math.floor(rng()*cc.length)];
    ctx.fillRect(-(rng()*6+2)/2,-(rng()*2+1)/2,rng()*10+4,rng()*4+2);
    ctx.restore();
  }
  ctx.globalAlpha=1;

  // Top gold shimmer bar
  const topBar=ctx.createLinearGradient(0,0,W,0);
  topBar.addColorStop(0,'rgba(255,200,0,0)');
  topBar.addColorStop(0.3,'rgba(255,200,0,0.6)');
  topBar.addColorStop(0.7,'rgba(255,200,0,0.6)');
  topBar.addColorStop(1,'rgba(255,200,0,0)');
  ctx.fillStyle=topBar; ctx.fillRect(0,0,W,2);

  // Bottom purple shimmer bar
  const botBar=ctx.createLinearGradient(0,0,W,0);
  botBar.addColorStop(0,'rgba(180,100,255,0)');
  botBar.addColorStop(0.3,'rgba(180,100,255,0.4)');
  botBar.addColorStop(0.7,'rgba(180,100,255,0.4)');
  botBar.addColorStop(1,'rgba(180,100,255,0)');
  ctx.fillStyle=botBar; ctx.fillRect(0,H-2,W,2);

  // Avatar glow rings
  for(let r=0;r<3;r++){
    ctx.save();
    ctx.shadowColor='rgba(255,200,0,0.5)'; ctx.shadowBlur=28-r*6;
    ctx.beginPath(); ctx.arc(avatarX,avatarY,avatarR+5+r*4,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,200,0,'+(0.45-r*0.12)+')';
    ctx.lineWidth=1.8-r*0.3; ctx.stroke(); ctx.restore();
  }

  // Avatar circle
  ctx.save();
  ctx.beginPath(); ctx.arc(avatarX,avatarY,avatarR,0,Math.PI*2); ctx.clip();
  const avBg=ctx.createRadialGradient(avatarX-20,avatarY-20,0,avatarX,avatarY,avatarR);
  avBg.addColorStop(0,'#1e1830'); avBg.addColorStop(1,'#0d0b18');
  ctx.fillStyle=avBg; ctx.fillRect(avatarX-avatarR,avatarY-avatarR,avatarR*2,avatarR*2);
  if (avatarURL) {
    try {
      const img = await Promise.race([
        loadImage(avatarURL),
        new Promise((_, rej) => setTimeout(() => rej(new Error('avatar timeout')), 5000)),
      ]);
      ctx.drawImage(img, avatarX-avatarR, avatarY-avatarR, avatarR*2, avatarR*2);
    } catch { _drawAvatarInitial(ctx, winnerName, avatarX, avatarY); }
  } else { _drawAvatarInitial(ctx, winnerName, avatarX, avatarY); }
  ctx.restore();

  // Vertical divider with glow
  const divX=330, PAD=48;
  ctx.save();
  ctx.shadowColor='rgba(255,200,0,0.3)'; ctx.shadowBlur=10;
  const divG=ctx.createLinearGradient(0,40,0,H-40);
  divG.addColorStop(0,'rgba(255,200,0,0)');
  divG.addColorStop(0.2,'rgba(255,200,0,0.3)');
  divG.addColorStop(0.8,'rgba(255,200,0,0.3)');
  divG.addColorStop(1,'rgba(255,200,0,0)');
  ctx.strokeStyle=divG; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(divX,40); ctx.lineTo(divX,H-40); ctx.stroke(); ctx.restore();

  ctx.save(); ctx.translate(divX,H/2); ctx.rotate(Math.PI/4);
  ctx.shadowColor='rgba(255,200,0,0.7)'; ctx.shadowBlur=14;
  ctx.strokeStyle='rgba(255,200,0,0.8)'; ctx.lineWidth=1.2;
  ctx.strokeRect(-4,-4,8,8); ctx.restore();

  const tx=divX+38;

  // Brand
  ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.font='10px Jakarta400';
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  ctx.fillText('T H E   S M A R T   M O N E Y   P A R A D I G M', tx, 68);

  const ruleG=ctx.createLinearGradient(tx,0,W-PAD,0);
  ruleG.addColorStop(0,'rgba(255,200,0,0.5)');
  ruleG.addColorStop(0.4,'rgba(255,200,0,0.12)');
  ruleG.addColorStop(1,'rgba(255,200,0,0)');
  ctx.strokeStyle=ruleG; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(tx,78); ctx.lineTo(W-PAD,78); ctx.stroke();

  // WINNER
  ctx.save();
  ctx.shadowColor='rgba(255,200,0,0.9)'; ctx.shadowBlur=16;
  ctx.fillStyle='#FFD700'; ctx.font='bold 13px Jakarta700';
  ctx.fillText('🏆  W I N N E R', tx, 112); ctx.restore();

  // Name
  const nfs=winnerName.length>18?34:winnerName.length>12?42:50;
  ctx.save();
  ctx.shadowColor='rgba(255,255,255,0.55)'; ctx.shadowBlur=30;
  ctx.fillStyle='#ffffff'; ctx.font='bold '+nfs+'px Jakarta700';
  ctx.fillText(winnerName.length>22?winnerName.slice(0,21)+'...':winnerName, tx, 178); ctx.restore();

  // Mid divider
  const midG=ctx.createLinearGradient(tx,0,tx+480,0);
  midG.addColorStop(0,'rgba(255,255,255,0.18)'); midG.addColorStop(1,'rgba(255,255,255,0)');
  ctx.strokeStyle=midG; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(tx,200); ctx.lineTo(tx+480,200); ctx.stroke();

  // PRIZE label
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='10px Jakarta400';
  ctx.fillText('P R I Z E', tx, 228);

  // Prize — purple glow
  const pfs=prize.length>30?20:prize.length>20?24:28;
  ctx.save();
  ctx.shadowColor='rgba(180,100,255,0.8)'; ctx.shadowBlur=18;
  ctx.fillStyle='#c4b5fd'; ctx.font='bold '+pfs+'px Jakarta700';
  ctx.fillText(prize.length>38?prize.slice(0,37)+'...':prize, tx, 264); ctx.restore();

  // Footer
  ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.font='12px Jakarta400';
  ctx.fillText(title+'   ·   '+totalEntrants+' entrant'+(totalEntrants!==1?'s':''), tx, 318);

  // CONGRATULATIONS
  ctx.save();
  ctx.shadowColor='rgba(255,200,0,0.5)'; ctx.shadowBlur=10;
  ctx.fillStyle='rgba(255,200,0,0.4)'; ctx.font='10px Jakarta400';
  ctx.textAlign='right';
  ctx.fillText('C O N G R A T U L A T I O N S', W-PAD, H-PAD); ctx.restore();

  return canvas.toBuffer('image/png');
}

function _drawAvatarInitial(ctx, name, x, y) {
  ctx.save();
  ctx.shadowColor='rgba(255,200,0,0.9)'; ctx.shadowBlur=22;
  ctx.font='bold 58px Jakarta700'; ctx.fillStyle='#FFD700';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(name[0].toUpperCase(), x, y);
  ctx.restore();
}

// ── Sweep state persistence ──
const SWEEP_STATE_FILE = path.join(__dirname, 'data', 'sweep_state.json');

function _sweepStateSave() {
  try {
    fs.writeFileSync(SWEEP_STATE_FILE, JSON.stringify({
      _tcSessions,
      _swept,
      _lastSweepDay,
      _lastSweepWeek,
      _lastSweepMonth,
    }));
  } catch (e) { console.warn('sweep state save failed:', e.message); }
}

function _sweepStateLoad() {
  try {
    const raw = fs.readFileSync(SWEEP_STATE_FILE, 'utf8');
    const s = JSON.parse(raw);
    // Only restore if saved for today — stale data from yesterday is useless
    const nyToday = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })).toDateString();
    if (s._lastSweepDay !== nyToday) {
      console.log('Sweep state stale (different day) — starting fresh');
      return;
    }
    if (s._tcSessions)    _tcSessions    = s._tcSessions;
    if (s._swept)         _swept         = s._swept;
    if (s._lastSweepDay)  _lastSweepDay  = s._lastSweepDay;
    if (s._lastSweepWeek) _lastSweepWeek = s._lastSweepWeek;
    if (s._lastSweepMonth) _lastSweepMonth = s._lastSweepMonth;
    console.log('Sweep state restored for', nyToday, '| swept keys:', Object.keys(_swept).length);
  } catch (_) { /* no file yet, fine */ }
}

function _nyTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

function _nyHM() {
  const t = _nyTime();
  return t.getHours() * 60 + t.getMinutes();
}

// Restore sweep state from file on startup
_sweepStateLoad();


async function _fetchNQCandles(range, interval) {
  const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(NQ_SYMBOL)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;
  const url = `${YF_PROXY_URL}?url=${encodeURIComponent(yfUrl)}`;
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const json = await httpsGet(url);
      if (json.error) throw new Error('proxy error: ' + json.error);
      const result = json?.chart?.result?.[0];
      if (!result) throw new Error('no chart result: ' + JSON.stringify(json).slice(0, 120));
      return result;
    } catch (e) {
      lastErr = e;
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastErr;
}

async function _refreshNQLevels() {
  try {
    const daily = await _fetchNQCandles('5d', '1d');
    const dhClean = daily.indicators.quote[0].high.filter(v => v != null);
    const dlClean = daily.indicators.quote[0].low.filter(v => v != null);
    if (dhClean.length >= 2) { _nqLevels.pdh = dhClean[dhClean.length - 2]; _nqLevels.pdl = dlClean[dlClean.length - 2]; }
    else if (dhClean.length === 1) { _nqLevels.pdh = dhClean[0]; _nqLevels.pdl = dlClean[0]; }

    const weekly = await _fetchNQCandles('3mo', '1wk');
    const whRaw = weekly.indicators.quote[0].high;
    const wlRaw = weekly.indicators.quote[0].low;
    const wts   = weekly.timestamp;
    // Skip the current (incomplete) week — its candle timestamp is this week's Monday
    const nowMs = Date.now();
    const msPerWeek = 7 * 24 * 3600 * 1000;
    // Find last fully-closed week (timestamp + 7 days < now)
    let pwIdx = -1;
    for (let i = whRaw.length - 1; i >= 0; i--) {
      if (whRaw[i] != null && (wts[i] * 1000 + msPerWeek) < nowMs) { pwIdx = i; break; }
    }
    if (pwIdx >= 0) { _nqLevels.pwh = whRaw[pwIdx]; _nqLevels.pwl = wlRaw[pwIdx]; }

    const monthly = await _fetchNQCandles('2y', '1mo');
    const mhClean = monthly.indicators.quote[0].high.filter(v => v != null);
    const mlClean = monthly.indicators.quote[0].low.filter(v => v != null);
    if (mhClean.length >= 2) { _nqLevels.pmh = mhClean[mhClean.length - 2]; _nqLevels.pml = mlClean[mlClean.length - 2]; }
    else if (mhClean.length === 1) { _nqLevels.pmh = mhClean[0]; _nqLevels.pml = mlClean[0]; }

    // Seed today's session H/L from 1m candles (2d to catch Asia 18:00 ET from yesterday evening)
    const intraday = await _fetchNQCandles('2d', '1m');
    const ih = intraday.indicators.quote[0].high;
    const il = intraday.indicators.quote[0].low;
    const its = intraday.timestamp;
    const ET_OFF = -4 * 60; // ET = UTC-4 (DST)
    // Today's Asia cycle starts at yesterday 18:00 ET = yesterday 22:00 UTC
    // Asia opens 18:00 ET = 22:00 UTC (DST). Compute today's Asia open in UTC.
    const etNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const etToday = new Date(etNow); etToday.setHours(0, 0, 0, 0);
    // Yesterday 18:00 ET in UTC = yesterday 22:00 UTC (ET+4h)
    const asiaOpenUtcSec = Math.floor((etToday.getTime() - 6 * 3600 * 1000) / 1000) + 4 * 3600;
    its.forEach((t, i) => {
      if (!ih[i] || !il[i]) return;
      if (t < asiaOpenUtcSec) return; // skip candles before today's Asia open (18:00 ET yesterday)
      const hm = (Math.floor(t / 60) + ET_OFF + 1440) % 1440;
      const inAsia   = hm >= 1080;
      const inLondon = hm < 420;
      const inNyam   = hm >= 420  && hm < 690;
      const inNypm   = hm >= 690  && hm < 960;
      const inPre    = hm >= 420  && hm < 570;
      if (inAsia)   { if (!_tcSessions.asia)   _tcSessions.asia   = { h: null, l: null }; _tcSessions.asia.h   = _tcSessions.asia.h   === null ? ih[i] : Math.max(_tcSessions.asia.h,   ih[i]); _tcSessions.asia.l   = _tcSessions.asia.l   === null ? il[i] : Math.min(_tcSessions.asia.l,   il[i]); }
      if (inLondon) { if (!_tcSessions.london) _tcSessions.london = { h: null, l: null }; _tcSessions.london.h = _tcSessions.london.h === null ? ih[i] : Math.max(_tcSessions.london.h, ih[i]); _tcSessions.london.l = _tcSessions.london.l === null ? il[i] : Math.min(_tcSessions.london.l, il[i]); }
      if (inNyam)   { if (!_tcSessions.nyam)   _tcSessions.nyam   = { h: null, l: null }; _tcSessions.nyam.h   = _tcSessions.nyam.h   === null ? ih[i] : Math.max(_tcSessions.nyam.h,   ih[i]); _tcSessions.nyam.l   = _tcSessions.nyam.l   === null ? il[i] : Math.min(_tcSessions.nyam.l,   il[i]); }
      if (inNypm)   { if (!_tcSessions.nypm)   _tcSessions.nypm   = { h: null, l: null }; _tcSessions.nypm.h   = _tcSessions.nypm.h   === null ? ih[i] : Math.max(_tcSessions.nypm.h,   ih[i]); _tcSessions.nypm.l   = _tcSessions.nypm.l   === null ? il[i] : Math.min(_tcSessions.nypm.l,   il[i]); }
      if (inPre)    { _nqLevels.premh = _nqLevels.premh === null ? ih[i] : Math.max(_nqLevels.premh, ih[i]); _nqLevels.preml = _nqLevels.preml === null ? il[i] : Math.min(_nqLevels.preml, il[i]); }
    });
    console.log('NQ levels refreshed:', JSON.stringify(_nqLevels), '| sessions:', JSON.stringify(_tcSessions));
  } catch (e) { console.warn('NQ level refresh failed:', e.message); }
}

// Seed _swept locks from current price on startup — prevents re-fire after process restart.
// If price is already past a level, lock it immediately so we don't re-alert.
async function _seedSweptFromCurrentPrice() {
  try {
    const result = await _fetchNQCandles('1d', '1m');
    const quotes = result.indicators.quote[0];
    const ts = result.timestamp;
    if (!ts || !ts.length) return;
    const idx = ts.length - 1;
    const high  = quotes.high[idx];
    const low   = quotes.low[idx];
    if (!high || !low) return;

    const hm = _nyHM();

    // Seed universal level locks
    const lvl = {
      pdh:   _pineLevels.pdh   || _nqLevels.pdh,
      pdl:   _pineLevels.pdl   || _nqLevels.pdl,
      pwh:   _pineLevels.pwh   || _nqLevels.pwh,
      pwl:   _pineLevels.pwl   || _nqLevels.pwl,
      pmh:   _pineLevels.pmh   || _nqLevels.pmh,
      pml:   _pineLevels.pml   || _nqLevels.pml,
      premh: _pineLevels.premh || _nqLevels.premh,
      preml: _pineLevels.preml || _nqLevels.preml,
    };
    if (lvl.pdh   && high > lvl.pdh   && !_swept.pdh)   { _swept.pdh   = true; }
    if (lvl.pdl   && low  < lvl.pdl   && !_swept.pdl)   { _swept.pdl   = true; }
    if (lvl.pwh   && high > lvl.pwh   && !_swept.pwh)   { _swept.pwh   = true; }
    if (lvl.pwl   && low  < lvl.pwl   && !_swept.pwl)   { _swept.pwl   = true; }
    if (lvl.pmh   && high > lvl.pmh   && !_swept.pmh)   { _swept.pmh   = true; }
    if (lvl.pml   && low  < lvl.pml   && !_swept.pml)   { _swept.pml   = true; }
    if (lvl.premh && high > lvl.premh && hm >= 570 && !_swept.premh) { _swept.premh = true; }
    if (lvl.preml && low  < lvl.preml && hm >= 570 && !_swept.preml) { _swept.preml = true; }

    // Seed session level locks — only for closed sessions
    const SESS_SEED = [
      { key: 'asia',   end: 0,   labelH: 'ASH',  labelL: 'ASL'  },
      { key: 'london', end: 420, labelH: 'LOH',  labelL: 'LOL'  },
      { key: 'nyam',   end: 690, labelH: 'NYAH', labelL: 'NYAL' },
      { key: 'nypm',   end: 960, labelH: 'NYPH', labelL: 'NYPL' },
    ];
    for (const s of SESS_SEED) {
      const sd = _tcSessions[s.key];
      if (!sd) continue;
      const sH = _pineLevels[s.labelH.toLowerCase()] || sd.h;
      const sL = _pineLevels[s.labelL.toLowerCase()] || sd.l;
      if (sH && high > sH && !_swept[`sess_${s.key}_h`]) _swept[`sess_${s.key}_h`] = true;
      if (sL && low  < sL && !_swept[`sess_${s.key}_l`]) _swept[`sess_${s.key}_l`] = true;
    }

    const seeded = Object.keys(_swept).length;
    if (seeded > 0) {
      console.log(`[sweep seed] Pre-locked ${seeded} already-swept levels at startup:`, Object.keys(_swept).join(', '));
      _sweepStateSave();
    }
  } catch (e) { console.warn('[sweep seed] failed:', e.message); }
}

async function _pollNQSweeps() {
  if (!SWEEP_ALERT_CH_ID) return;
  if (!SWEEP_TC_ROLE_ID) return;
  // Futures close Friday ~5PM ET, reopen Sunday ~6PM ET — skip Sat + Sun before 6PM ET
  const nyNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dow = nyNow.getDay(); // 0=Sun, 6=Sat
  const hm  = nyNow.getHours() * 60 + nyNow.getMinutes();
  if (dow === 6) return; // all day Saturday
  if (dow === 0 && hm < 18 * 60) return; // Sunday before 6PM ET

  if (!_nqLevels.pdh || !_nqLevels.pdl) {
    await _refreshNQLevels().catch(e => console.warn('level retry failed:', e?.message));
  }

  try {
    const result = await _fetchNQCandles('1d', '1m');
    const quotes = result.indicators.quote[0];
    const timestamps = result.timestamp;
    if (!timestamps || !timestamps.length) return;

    const lastIdx = timestamps.length - 1;
    const high  = quotes.high[lastIdx];
    const low   = quotes.low[lastIdx];
    const price = quotes.close[lastIdx] || high;
    if (!high || !low) return;

    const ny     = _nyTime();
    const hm     = _nyHM();
    const today  = ny.toDateString();
    const weekN  = `${ny.getFullYear()}-W${Math.ceil((ny.getDate() - ny.getDay() + 1) / 7)}`;
    const monthN = `${ny.getFullYear()}-${ny.getMonth()}`;

    // Daily reset
    if (_lastSweepDay !== today) {
      _lastSweepDay = today;
      Object.keys(_swept).filter(k =>
        ['pdh','pdl','prem','sess_'].some(p => k.startsWith(p))
      ).forEach(k => delete _swept[k]);
      _tcSessions = {};
      _nqLevels.premh = null;
      _nqLevels.preml = null;
      await _refreshNQLevels();
      _sweepStateSave();
    }

    if (_lastSweepWeek !== weekN) {
      _lastSweepWeek = weekN;
      ['pwh','pwl'].forEach(k => delete _swept[k]);
      await _refreshNQLevels();
    }

    if (_lastSweepMonth !== monthN) {
      _lastSweepMonth = monthN;
      ['pmh','pml'].forEach(k => delete _swept[k]);
      await _refreshNQLevels();
    }

    const guild = client.guilds.cache.first();
    if (!guild) return;
    const ch = guild.channels.cache.get(SWEEP_ALERT_CH_ID);
    if (!ch) return;

    const pendingAlerts = [];

    function collectAlert(key, label, direction, lvlPrice) {
      if (_swept[key]) return;
      // Extra guard: don't re-fire within 2 hours even after restarts
      const tsKey = `_ts_${key}`;
      if (_swept[tsKey] && (Date.now() - _swept[tsKey]) < 2 * 60 * 60 * 1000) return;
      _swept[key] = true;
      _swept[tsKey] = Date.now();
      pendingAlerts.push({ key, label, direction, lvlPrice });
    }

    async function flushAlerts() {
      if (!pendingAlerts.length) return;
      const rolePings = SWEEP_TC_ROLE_ID ? [`<@&${SWEEP_TC_ROLE_ID}>`] : [];

      const dominant = pendingAlerts.filter(a => a.direction === 'above').length >= pendingAlerts.filter(a => a.direction === 'below').length ? 'above' : 'below';
      const color    = dominant === 'above' ? 0x22d3ee : 0xf87171;
      const arrow    = dominant === 'above' ? '🔺' : '🔻';

      // Use same aesthetic format as TV webhook embeds
      const SESSION_LABELS_MAP = { asia: 'Asia', london: 'London', nyam: 'NY Morning', nypm: 'NY Afternoon' };
      const curSessKey2 = hm >= 1080 ? 'asia' : hm < 420 ? 'london' : hm < 690 ? 'nyam' : hm < 960 ? 'nypm' : null;
      const sessLabel2  = SESSION_LABELS_MAP[curSessKey2] || '—';
      const nyTime2 = ny.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const descLines = pendingAlerts.map(a => {
        const ar = a.direction === 'above' ? '🔺' : '🔻';
        const dw = a.direction === 'above' ? 'swept **above**' : 'swept **below**';
        return `${ar} **${LEVEL_LABELS[a.label] || a.label}** — ${dw} at \`${a.lvlPrice.toFixed(2)}\``;
      });

      descLines.push('');
      descLines.push(`> 💰 **Current Price** — \`${price.toFixed(2)}\``);
      descLines.push(`> 🕐 **Session** — ${sessLabel2}`);
      descLines.push(`> 🗓️ **Time** — ${nyTime2} ET`);

      const title = pendingAlerts.length === 1
        ? `${arrow}  NQ — **${LEVEL_LABELS[pendingAlerts[0].label] || pendingAlerts[0].label}** ${dominant === 'above' ? 'Swept **Above**' : 'Swept **Below**'}`
        : `${arrow}  NQ — **${pendingAlerts.length} Levels Swept**`;

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(descLines.join('\n'))
        .setTimestamp()
        .setFooter({ text: 'The Smart Money Paradigm  ·  NQ Sweep Alert  ·  ⚠️ ~10 min delay' });

      await ch.send({ content: rolePings.join(' ') || undefined, embeds: [embed] });
    }

    // Use Pine levels if available (TV webhook), fall back to YF
    const lvl = {
      pdh:   _pineLevels.pdh   || _nqLevels.pdh,
      pdl:   _pineLevels.pdl   || _nqLevels.pdl,
      pwh:   _pineLevels.pwh   || _nqLevels.pwh,
      pwl:   _pineLevels.pwl   || _nqLevels.pwl,
      pmh:   _pineLevels.pmh   || _nqLevels.pmh,
      pml:   _pineLevels.pml   || _nqLevels.pml,
      premh: _pineLevels.premh || _nqLevels.premh,
      preml: _pineLevels.preml || _nqLevels.preml,
    };

    if (lvl.pdh   && high > lvl.pdh)   collectAlert('pdh',   'PDH', 'above', lvl.pdh);
    if (lvl.pdl   && low  < lvl.pdl)   collectAlert('pdl',   'PDL', 'below', lvl.pdl);
    if (lvl.pwh   && high > lvl.pwh)   collectAlert('pwh',   'PWH', 'above', lvl.pwh);
    if (lvl.pwl   && low  < lvl.pwl)   collectAlert('pwl',   'PWL', 'below', lvl.pwl);
    if (lvl.pmh   && high > lvl.pmh)   collectAlert('pmh',   'PMH', 'above', lvl.pmh);
    if (lvl.pml   && low  < lvl.pml)   collectAlert('pml',   'PML', 'below', lvl.pml);
    // Only alert PreMH/PreML after 9:30 ET AND pre-market window was actually observed today
    if (lvl.premh && high > lvl.premh && hm >= 570 && _nqLevels.premh !== null) collectAlert('premh', 'PreMH', 'above', lvl.premh);
    if (lvl.preml && low  < lvl.preml && hm >= 570 && _nqLevels.preml !== null) collectAlert('preml', 'PreML', 'below', lvl.preml);

    // Build pre-market H/L
    if (hm >= 420 && hm < 570) {
      _nqLevels.premh = _nqLevels.premh === null ? high : Math.max(_nqLevels.premh, high);
      _nqLevels.preml = _nqLevels.preml === null ? low  : Math.min(_nqLevels.preml, low);
    }

    // Session H/L
    // Asia wraps midnight: start=1080 (18:00), end=0 (00:00). inSess uses wrap logic.
    const SESS_DEF = [
      { key: 'asia',   start: 1080, end: 0,   labelH: 'ASH',  labelL: 'ASL'  },
      { key: 'london', start: 0,    end: 420,  labelH: 'LOH',  labelL: 'LOL'  },
      { key: 'nyam',   start: 420,  end: 690,  labelH: 'NYAH', labelL: 'NYAL' },
      { key: 'nypm',   start: 690,  end: 960,  labelH: 'NYPH', labelL: 'NYPL' },
    ];

    for (const sess of SESS_DEF) {
      // Asia: hm >= 1080 (18:00–23:59). end=0 means exact midnight boundary.
      const inSess = sess.end === 0
        ? (hm >= sess.start)
        : (sess.start > sess.end
            ? (hm >= sess.start || hm < sess.end)
            : (hm >= sess.start && hm < sess.end));

      if (inSess) {
        if (!_tcSessions[sess.key]) _tcSessions[sess.key] = { h: null, l: null };
        const sd = _tcSessions[sess.key];
        sd.h = sd.h === null ? high : Math.max(sd.h, high);
        sd.l = sd.l === null ? low  : Math.min(sd.l, low);
      }

      // Only alert when session has ended (not currently active)
      if (!inSess && _tcSessions[sess.key]) {
        const sd = _tcSessions[sess.key];
        // Prefer Pine session levels if available
        const sH = _pineLevels[sess.labelH.toLowerCase()] || sd.h;
        const sL = _pineLevels[sess.labelL.toLowerCase()] || sd.l;
        if (sH && high > sH) collectAlert(`sess_${sess.key}_h`, sess.labelH, 'above', sH);
        if (sL && low  < sL) collectAlert(`sess_${sess.key}_l`, sess.labelL, 'below', sL);
      }
    }

    await flushAlerts();
    _sweepStateSave();

  } catch (e) { console.warn('NQ sweep poll error:', e.message); }
}

async function _postCombinedAlertRoles(rolesAlertCh, sweepAlertChId, vcSchedChId) {
  // Delete existing bot messages in alert-roles to avoid duplicates
  try {
    const msgs = await rolesAlertCh.messages.fetch({ limit: 20 });
    const botMsgs = msgs.filter(m => m.author.id === client.user.id);
    for (const m of botMsgs.values()) await m.delete().catch(() => {});
  } catch (_) {}

  const sweepMention = sweepAlertChId ? `<#${sweepAlertChId}>` : '#sweep-alerts';
  const vcMention    = vcSchedChId    ? `<#${vcSchedChId}>`    : '#vc-schedule';

  const embed = new EmbedBuilder()
    .setColor(0x22d3ee)
    .setTitle('🔔  Alert Roles')
    .setDescription('Select the alerts you want. Click any button to **toggle your role on or off**.')
    .addFields(
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📡  SWEEP ALERTS',
        value:
          `Alerts fire in ${sweepMention} · real-time via TradingView webhook\n\n` +
          '**Universal Levels** — always active, lock once swept\n' +
          '`PDH / PDL` — Previous Day High / Low\n' +
          '`PWH / PWL` — Previous Week High / Low\n' +
          '`PMH / PML` — Previous Month High / Low\n' +
          '`PreMH / PreML` — Pre-Market High / Low *(built 07:00–09:30 ET)*\n\n' +
          '**Session Levels** — each fires once then locks, resets midnight ET\n' +
          '`ASH / ASL` — Asia High / Low *(18:00–00:00)* → alerted during London\n' +
          '`LOH / LOL` — London High / Low *(00:00–07:00)* → alerted during NY AM\n' +
          '`NYAH / NYAL` — NY Morning High / Low *(07:00–11:30)* → alerted during NY PM\n' +
          '`NYPH / NYPL` — NY Afternoon High / Low *(11:30–16:00)* → alerted during Asia',
        inline: false,
      },
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📅  VC SESSION ALERTS',
        value:
          `Pings in ${vcMention} when a session is scheduled.\n` +
          'Countdown updates live · reminders at **4h · 1h · 15min** before start.',
        inline: false,
      },
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: 'You can hold **multiple roles**. Tap again to remove.',
        inline: false,
      }
    )
    .setFooter({ text: 'The Smart Money Paradigm  ·  Toggle roles below' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('sweep_tc_toggle').setLabel('📡  Sweep Alerts').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('vc_alert_toggle').setLabel('📅  VC Alerts').setStyle(ButtonStyle.Success),
  );

  await rolesAlertCh.send({ embeds: [embed], components: [row] });
}

// Session H/L tracking — called every minute to build session ranges
// Levels are pushed via TV webhook; this only tracks H/L for ASH/ASL etc
function _tickSessionHL(high, low) {
  const hm = _nyHM();
  const ny = _nyTime();
  const today = ny.toDateString();

  // Daily reset at midnight ET
  if (_lastSweepDay !== today) {
    _lastSweepDay = today;
    Object.keys(_swept).filter(k =>
      ['pdh','pdl','pwh','pwl','pmh','pml','prem','sess_'].some(p => k.startsWith(p))
    ).forEach(k => delete _swept[k]);
    _tcSessions = {};
    _sweepStateSave();
  }

  const SESS_DEF = [
    { key: 'asia',   start: 1080, end: 0   },
    { key: 'london', start: 0,    end: 420 },
    { key: 'nyam',   start: 420,  end: 690 },
    { key: 'nypm',   start: 690,  end: 960 },
  ];

  for (const sess of SESS_DEF) {
    const inSess = sess.end === 0
      ? (hm >= sess.start)
      : (sess.start > sess.end
          ? (hm >= sess.start || hm < sess.end)
          : (hm >= sess.start && hm < sess.end));
    if (inSess) {
      if (!_tcSessions[sess.key]) _tcSessions[sess.key] = { h: null, l: null };
      const sd = _tcSessions[sess.key];
      sd.h = sd.h === null ? high : Math.max(sd.h, high);
      sd.l = sd.l === null ? low  : Math.min(sd.l, low);
    }
  }
}

// ── Macro News Feed ──
const MACRO_NEWS_CH_ID = '1518008500679082055'; // #macro-news
const FJ_BOT_ID        = '1517994617583308900'; // FJ NewsBot V2
const FJ_NEWSFEED_ID   = '1518179483612483725'; // #newsfeed — FJ posts here, hidden from members
const MACRO_POLL_MS = 5 * 60 * 1000; // every 5 min
const seenGuids = new Set();
let _newsBootTime = null; // set on first poll — skip articles older than 30min at startup

const MACRO_FEEDS = [
  { name: 'MarketWatch',     url: 'https://feeds.marketwatch.com/marketwatch/topstories' },
  { name: 'BBC Business',    url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { name: 'CNBC Economy',    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258' },
  { name: 'CNBC Markets',    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839069' },
  { name: 'Investing.com',   url: 'https://www.investing.com/rss/news.rss' },
  { name: 'FXStreet',        url: 'https://www.fxstreet.com/rss/news' },
];

// HIGH impact — major market movers, must be title-only match
const MACRO_HIGH = [
  'federal reserve','fomc','rate decision','rate hike','rate cut','interest rate',
  'nonfarm payroll','jobs report','cpi','inflation report','pce','gdp report',
  'recession','bank failure','banking crisis','debt ceiling','default',
  'powell','yellen','treasury secretary',
  'war declared','nuclear','invasion','airstrike on','attacked','strike on',
  'opec cut','opec hike','oil embargo','sanctions on',
  'market crash','circuit breaker','trading halt','black monday','stock crash',
  'fed chair','emergency rate','quantitative easing','quantitative tightening',
];

// MEDIUM impact — geopolitical/macro context, title OR desc match
const MACRO_MEDIUM = [
  'white house','pentagon','nato','g7','g20','imf','world bank',
  'tariff','trade war','trade deal','sanctions','export ban',
  'china economy','china gdp','china trade','taiwan strait','south china sea',
  'iran nuclear','iran sanctions','russia ukraine','ukraine war',
  'israel','gaza','middle east tension','north korea',
  'oil price','crude oil','energy crisis','natural gas price',
  'dollar index','dxy','yen','euro zone','ecb','bank of england','boj',
  'selloff','market rally','dow jones','s&p 500','nasdaq','wall street',
  'unemployment rate','jobless claims','retail sales','manufacturing pmi',
  'debt crisis','credit downgrade','sovereign debt','bond yield','10-year',
  'silicon valley bank','svb','credit suisse','lehman',
  'crypto crash','bitcoin','ethereum','stablecoin',
];

// EXCLUDE — blocks unrelated articles even if a keyword matches
const MACRO_EXCLUDE = [
  'sports','football','soccer','basketball','tennis','golf','olympic',
  'celebrity','oscar','grammy','emmy','awards','music','film','movie','album',
  'recipe','food','travel','fashion','lifestyle','health tips','diet','workout',
  'weather','hurricane','earthquake','flood','wildfire',// natural disasters ok only if market relevant
  'obituary','funeral','wedding','birth','death of','passed away',
  'real estate listing','home for sale','mortgage rate tips',
];

function classifyNews(title, desc) {
  const titleL = title.toLowerCase();
  const fullL  = (title + ' ' + (desc || '')).toLowerCase();

  // Hard exclude first
  if (MACRO_EXCLUDE.some(k => fullL.includes(k))) return null;

  // High — title match only (stricter)
  if (MACRO_HIGH.some(k => titleL.includes(k))) return 'HIGH';

  // Medium — title or desc match
  if (MACRO_MEDIUM.some(k => fullL.includes(k))) return 'MEDIUM';

  return null; // not relevant
}

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

async function fetchRSSFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TsmpBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    return (Array.isArray(items) ? items : [items]).map(item => ({
      title:   item.title?.['#text'] || item.title || '',
      link:    item.link?.['@_href'] || item.link || item.guid?.['#text'] || item.guid || '',
      desc:    item.description || item.summary?.['#text'] || item.summary || '',
      pubDate: item.pubDate || item.published || item.updated || '',
      guid:    item.guid?.['#text'] || item.guid || item.id || item.link || '',
      source:  feed.name,
    }));
  } catch { return []; }
}

const SOURCE_COLORS = {
  'Reuters Business': 0xff8000,
  'Reuters World':    0xff6600,
  'AP News Economy':  0x0066cc,
  'MarketWatch':      0x00a651,
  'BBC Business':     0xbb1919,
  'CNBC Economy':     0x005594,
};

async function pollMacroNews() {
  const guild = client.guilds.cache.first();
  if (!guild) return;
  const ch = guild.channels.cache.get(MACRO_NEWS_CH_ID);
  if (!ch) return;

  const now = Date.now();
  const isFirstRun = _newsBootTime === null;
  if (isFirstRun) _newsBootTime = now;
  // On first run skip anything older than 30 min — prevents startup flood
  const cutoff = isFirstRun ? now - 30 * 60 * 1000 : now - 24 * 60 * 60 * 1000;

  for (const feed of MACRO_FEEDS) {
    const items = await fetchRSSFeed(feed);
    for (const item of items) {
      if (!item.guid) continue;

      // Age filter — skip old articles
      if (item.pubDate) {
        const age = new Date(item.pubDate).getTime();
        if (!age || age < cutoff) {
          seenGuids.add(item.guid); // mark seen so they don't post later
          continue;
        }
      }

      if (seenGuids.has(item.guid)) continue;
      seenGuids.add(item.guid);

      const impact = classifyNews(item.title, item.desc);
      if (!impact) continue;

      const isHigh = impact === 'HIGH';
      const impactBadge = isHigh ? '🔴 HIGH IMPACT' : '🟡 MEDIUM IMPACT';
      const embedColor = isHigh ? 0xef4444 : 0xfbbf24;

      const cleanDesc = item.desc
        ? item.desc.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim().slice(0, 280)
        : '';

      const pubMs = item.pubDate ? new Date(item.pubDate).getTime() : null;
      const timeStr = pubMs
        ? `<t:${Math.floor(pubMs / 1000)}:R> · ` + new Date(pubMs).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' ET'
        : 'Just now';

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setAuthor({ name: `${impactBadge}  ·  ${item.source}` })
        .setTitle(item.title.slice(0, 256))
        .setURL(item.link || null)
        .setDescription(cleanDesc ? cleanDesc + (item.desc?.length > 280 ? '…' : '') : null)
        .setFooter({ text: `${timeStr}  ·  The Smart Money Paradigm` });

      await ch.send({ embeds: [embed] }).catch(() => {});
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

const LEVEL_LABELS = {
  PDH: 'Previous Day High', PDL: 'Previous Day Low',
  PWH: 'Previous Week High', PWL: 'Previous Week Low',
  WO: 'Weekly Open', MO: 'Midnight Open',
  PMH: 'Pre-Market High', PML: 'Pre-Market Low',
  LDN_H: 'London High', LDN_L: 'London Low',
  NYAM_H: 'NY AM High', NYAM_L: 'NY AM Low',
  LUNCH_H: 'Lunch High', LUNCH_L: 'Lunch Low',
  NYPM_H: 'NY PM High', NYPM_L: 'NY PM Low',
  ASIA_H: 'Asia High', ASIA_L: 'Asia Low',
  EQH: 'Equal Highs', EQL: 'Equal Lows',
  IBH: 'Initial Balance High', IBL: 'Initial Balance Low',
};
let ENV_ENGINE_CH_ID = null;

const FF_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

const NEWS_PROTOCOLS = [
  {
    file: 'image.png',
    context: '**NFP Protocol** — Non-Farm Payrolls. One of the highest-impact news events. Expect engineered liquidity sweeps and volatile displacement. Sit on hands or be positioned before the release.',
  },
  {
    file: 'image2.png',
    context: '**CPI & PPI — Day Before** — The session before inflation data drops. Smart money pre-positions. Watch for late-session liquidity raids and tight consolidation building the range for the move.',
  },
  {
    file: 'image3.png',
    context: '**CPI Day** — Consumer Price Index release. Market-moving inflation data. High probability of sharp displacement at the open. Bias is set by the draw on liquidity going into the print.',
  },
  {
    file: 'image4.png',
    context: '**PPI Day** — Producer Price Index. Signals upstream inflation before it hits consumers. Traded similarly to CPI — look for the same engineered setups around the release time.',
  },
  {
    file: 'image5.png',
    context: '**08:30 Red Folder — PMI / Core Retail Sales / Unemployment Claims** — Multiple tier-1 events stacking at 08:30. Each has its own draw profile. Do not trade blind — know the bias before the bell.',
  },
  {
    file: 'image6.png',
    context: '**Fed Chair Powell — Day Before** — The session preceding a Powell speech. Institutions load positions ahead of the statement. Expect engineered consolidation and building imbalances.',
  },
  {
    file: 'image7.png',
    context: '**Fed Chair Powell Day** — Live Fed commentary. Market interprets hawkish/dovish tone in real time. Extreme volatility possible mid-session. Institutional displacement is common post-speech.',
  },
  {
    file: 'image8.png',
    context: '**PM Session — FOMC Day Before** — The afternoon before a Federal Reserve decision. Liquidity is thin, range is often tight. Smart money sets the trap before the announcement.',
  },
  {
    file: 'image9.png',
    context: '**PM Session — FOMC Day** — Rate decision day. The most impactful Fed event on the calendar. Expect engineered moves in both directions before the true displacement reveals itself.',
  },
  {
    file: 'image10.png',
    context: '**PM Session — FOMC Day After** — The follow-through session. Reaction to yesterday\'s decision continues. Often where the confirmed trend resumes or a reversal is engineered post-hype.',
  },
];

// ── Post Request Access button in roles channel ──
async function postAccessButton(channel) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel('Request Access')
      .setStyle(ButtonStyle.Secondary),
  );

  const embed = new EmbedBuilder()
    .setColor(0x0d0d0d)
    .setTitle('⌬  THE SMART MONEY PARADIGM')
    .setDescription(
      `*Not everyone who enters leaves the same.*\n\n` +
      `This server operates on a private access model.\n` +
      `Entry is reviewed — not automatic.\n\n` +
      `**If you understand the market is engineered —\nand you're here to learn how — request access below.**\n\n` +
      `A staff member will open your session privately.\n` +
      `Come prepared.`
    )
    .setFooter({ text: 'The Smart Money Paradigm  ·  Access is earned' });

  await channel.send({ embeds: [embed], components: [row] });
}

// ── Handle interactions ──
client.on(Events.InteractionCreate, async interaction => {
  try {

    // ── Autocomplete ──
    if (interaction.isAutocomplete()) {
      if (interaction.commandName === 'stream-history') {
        const focused = interaction.options.getFocused();
        let choices = [];
        try {
          const r = await fetch('https://smp-join.poshop608.workers.dev/bot/stream-history', {
            headers: { 'Authorization': `Bot ${process.env.TOKEN}` },
          });
          const d = await r.json();
          if (d.ok) {
            // Distinct ET dates that actually had a stream, newest first.
            const dates = [...new Set(
              d.history.map(s => new Date(s.startedAt).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }))
            )].sort().reverse();
            choices = dates
              .filter(date => date.includes(focused))
              .slice(0, 25) // Discord caps autocomplete at 25 choices
              .map(date => ({ name: date, value: date }));
          }
        } catch (e) {
          console.error('[stream-history autocomplete] failed:', e.message);
        }
        return interaction.respond(choices).catch(() => {});
      }
      return interaction.respond([]).catch(() => {});
    }

    // ── Slash commands ──
    if (interaction.isChatInputCommand()) {
      const { commandName, guild } = interaction;

      if (commandName === 'ping') {
        return interaction.reply({ content: `Pong! Latency: ${client.ws.ping}ms`, ephemeral: true });
      }

      if (commandName === 'record') {
        if (isRecording()) {
          return interaction.reply({ content: 'Already recording. Run `/stop` first.', ephemeral: true });
        }
        const channel = interaction.options.getChannel('channel');
        if (!channel?.isVoiceBased?.()) {
          return interaction.reply({ content: 'Pick a voice channel.', ephemeral: true });
        }
        await interaction.reply({ content: `Starting recording of **${channel.name}**... give it a few seconds to join.` });
        try {
          await startRecording({ token: process.env.TOKEN, channelId: channel.id, startedByTag: interaction.user.tag });
          await interaction.followUp(`Recording started in **${channel.name}**. Run \`/stop\` when done.`);
        } catch (err) {
          console.error('[record] start failed:', err);
          const msg = `Could not start recording: ${err.message}`;
          await interaction.followUp(msg.length > 1900 ? msg.slice(0, 1900) + '… (see Railway logs for full error)' : msg);
        }
        return;
      }

      if (commandName === 'stop') {
        if (!isRecording()) {
          return interaction.reply({ content: 'Nothing is currently recording.', ephemeral: true });
        }
        await interaction.reply('Stopping and uploading — this can take a minute for longer sessions...');
        try {
          const { filePath, fileName, durationMs } = await stopRecording();
          const url = await uploadRecording(filePath, fileName);
          const mins = Math.round(durationMs / 60000);
          await interaction.followUp(`Recording saved (~${mins} min):\n${url}`);
        } catch (err) {
          console.error('[record] stop failed:', err);
          const msg = `Recording failed: ${err.message}`;
          await interaction.followUp(msg.length > 1900 ? msg.slice(0, 1900) + '… (see Railway logs for full error)' : msg);
        }
        return;
      }

      if (commandName === 'roadmap') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.reply({ content: 'Posting roadmap...', ephemeral: true });

        const ROADMAP_CH_ID = '1510155588686970900';
        const ch = guild.channels.cache.get(ROADMAP_CH_ID);
        if (!ch) return interaction.editReply({ content: 'roadmap channel not found.' });

        const content = buildRoadmapContent();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('roadmap_question')
            .setLabel('💬 Ask a Question')
            .setStyle(ButtonStyle.Secondary),
        );

        const msg = await ch.send({ content, components: [row] });
        roadmapMessageId = msg.id;
        return interaction.editReply({ content: 'Done.' });
      }

      if (commandName === 'roadmap-edit') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        const vol = interaction.options.getString('volume');
        const currentItems = ROADMAP_SECTIONS[vol].items
          .map((item, i) => `${String(i + 1).padStart(2, '0')}. ${item}`)
          .join('\n');

        const modal = new ModalBuilder()
          .setCustomId(`roadmap_modal_${vol}`)
          .setTitle(`Edit ${vol === 'vol1' ? 'Volume I' : vol === 'vol2' ? 'Volume II' : 'Volume III'}`);

        const input = new TextInputBuilder()
          .setCustomId('roadmap_items')
          .setLabel('Items (one per line, numbering optional)')
          .setStyle(TextInputStyle.Paragraph)
          .setValue(currentItems)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
      }

      if (commandName === 'journal') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.reply({ content: 'Posting journal embed...', ephemeral: true });

        const JOURNAL_CH_ID = '1484660247900717056';
        const ch = guild.channels.cache.get(JOURNAL_CH_ID);
        if (!ch) return interaction.editReply({ content: 'journal-app channel not found.' });

        const embed = new EmbedBuilder()
          .setColor(0x0d0d0d)
          .setTitle('The Smart Money Paradigm  ·  Trading Journal')
          .setDescription(
            `*A structured space for traders who approach the craft with intention.*\n\n` +
            `Track every trade. Review every decision.\n` +
            `The journal is where discipline compounds.\n\n` +
            `**Log it. Review it. Improve.**`
          )
          .setFooter({ text: 'The Smart Money Paradigm  ·  Signal over noise' });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Open Journal')
            .setURL('https://discord.gg/vqtKjsyN3z')
            .setStyle(ButtonStyle.Link),
        );

        await ch.send({ embeds: [embed], components: [row] });
        return interaction.editReply({ content: 'Done.' });
      }

      if (commandName === 'setup') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });
        await interaction.reply({ content: 'Posting access button...', ephemeral: true });
        const ch = guild.channels.cache.get(ROLES_CH_ID);
        if (ch) await postAccessButton(ch);
        return interaction.editReply({ content: 'Done.' });
      }

      if (commandName === 'setup-economic-calendar') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        // Check if already exists
        const existing = guild.channels.cache.find(c => c.name === '📅〢economic-calendar' && c.parentId === ENV_CATEGORY_ID);
        if (existing) {
          ENV_CH_ID = existing.id;
          return interaction.editReply({ content: `Channel already exists: <#${existing.id}>` });
        }

        const everyoneRole = guild.roles.everyone;
        const ch = await guild.channels.create({
          name: '📅〢economic-calendar',
          type: 0, // GUILD_TEXT
          parent: ENV_CATEGORY_ID,
          permissionOverwrites: [
            { id: everyoneRole.id, allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
            { id: STAFF_ROLE_IDS[0], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
            { id: STAFF_ROLE_IDS[1], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
          ],
        });

        ENV_CH_ID = ch.id;
        return interaction.editReply({ content: `Created <#${ch.id}>. Bot will post every Sunday 00:00 ET automatically.` });
      }

      if (commandName === 'setup-env-engine') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const existing = guild.channels.cache.find(c => c.name === '🧠〢environment-selection' && c.parentId === ENV_CATEGORY_ID);
        if (existing) {
          ENV_ENGINE_CH_ID = existing.id;
          return interaction.editReply({ content: `Channel already exists: <#${existing.id}>` });
        }

        const everyoneRole = guild.roles.everyone;
        const ch = await guild.channels.create({
          name: '🧠〢environment-selection',
          type: 0,
          parent: ENV_CATEGORY_ID,
          permissionOverwrites: [
            { id: everyoneRole.id, allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
            { id: STAFF_ROLE_IDS[0], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
            { id: STAFF_ROLE_IDS[1], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
          ],
        });

        ENV_ENGINE_CH_ID = ch.id;
        return interaction.editReply({ content: `Created <#${ch.id}>. Bot will post every Sunday automatically.` });
      }

      if (commandName === 'economic-calendar') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        if (!ENV_CH_ID) return interaction.editReply({ content: 'Run `/setup-economic-calendar` first to create the channel.' });

        const week = interaction.options.getString('week') || 'thisweek';
        await postEnvCalendar(guild, week);
        return interaction.editReply({ content: `Economic calendar posted (${week}).` });
      }

      if (commandName === 'test-economic-calendar') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const week = interaction.options.getString('week') || 'nextweek';
        const events = await fetchUSDEvents(week);

        if (events.length === 0) {
          return interaction.editReply({ content: `No USD high/medium events found for **${week}** — TradingView may not have data yet — try again in a moment.` });
        }

        const cardBuffer = await buildEnvCalendarCard(events);
        const attachment = new AttachmentBuilder(cardBuffer, { name: 'eco-calendar-test.png' });
        await interaction.editReply({
          content: `**Economic Calendar preview — ${week}** · ${events.length} USD high/medium events\n*High impact shown first. Use \`/economic-calendar week:${week}\` to post publicly.*`,
          files: [attachment],
        });
      }

      if (commandName === 'env-engine') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        if (!ENV_CH_ID) return interaction.editReply({ content: 'Run `/setup-economic-calendar` first to create the channel.' });

        const _dow2 = new Date().getDay();
        const _defWeek = (_dow2 === 0 || _dow2 === 6) ? 'nextweek' : 'thisweek';
        const week = interaction.options.getString('week') || _defWeek;
        await postEnvEngine(guild, { week });
        return interaction.editReply({ content: 'Environment Engine posted.' });
      }

      if (commandName === 'env-edit-day') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        const day = interaction.options.getString('day');
        const existing = _envOverrides[day] || {};

        const modal = new ModalBuilder()
          .setCustomId(`env_edit_day_${day}`)
          .setTitle(`Edit ${day} — Day Level`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('warning')
              .setLabel('Warning (leave blank to clear)')
              .setStyle(TextInputStyle.Paragraph)
              .setValue(existing.warning || '')
              .setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('execNotes')
              .setLabel('Execution Notes (one per line)')
              .setStyle(TextInputStyle.Paragraph)
              .setValue(existing.execNotes || '')
              .setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('killzones')
              .setLabel('Kill Zones (one per line)')
              .setStyle(TextInputStyle.Short)
              .setValue(existing.killzones || '')
              .setRequired(false)
          ),
        );

        await interaction.showModal(modal);
      }

      if (commandName === 'env-edit-session') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        const day = interaction.options.getString('day');
        const sess = interaction.options.getString('session');
        const key = `${day}_${sess}`;
        const existing = _envOverrides[key] || {};

        const modal = new ModalBuilder()
          .setCustomId(`env_edit_sess_${day}_${sess}`)
          .setTitle(`Edit ${day} — ${sess}`);

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('rating')
              .setLabel('Rating: IDEAL / CAUTION / AVOID (blank = auto)')
              .setStyle(TextInputStyle.Short)
              .setValue(existing.rating || '')
              .setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Reason text (blank = auto)')
              .setStyle(TextInputStyle.Paragraph)
              .setValue(existing.reason || '')
              .setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('notes')
              .setLabel('Notes (one per line, blank = auto)')
              .setStyle(TextInputStyle.Paragraph)
              .setValue(existing.notes || '')
              .setRequired(false)
          ),
        );

        await interaction.showModal(modal);
      }

      if (commandName === 'env-overrides-clear') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        const day = interaction.options.getString('day');
        if (day === 'ALL') {
          _envOverrides = {};
        } else {
          Object.keys(_envOverrides).filter(k => k === day || k.startsWith(day + '_')).forEach(k => delete _envOverrides[k]);
        }
        saveEnvOverrides(_envOverrides);
        return interaction.reply({ content: `Overrides cleared for **${day}**.`, ephemeral: true });
      }

      if (commandName === 'test-env-engine') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const _dow = new Date().getDay();
        const _defaultWeek = (_dow === 0 || _dow === 6) ? 'nextweek' : 'thisweek';
        const week = interaction.options.getString('week') || _defaultWeek;
        const allEvents = await fetchUSDEvents(week);

        if (allEvents.length === 0) {
          return interaction.editReply({ content: `No events found for **${week}** — TradingView may not have data yet — try again in a moment.` });
        }

        const weekData = buildEnvEngineWeek(allEvents);
        _envWeekCache = { ts: Date.now(), allEvents, weekData };

        const cardBuffer = await buildEnvEngineCard(allEvents);
        const attachment = new AttachmentBuilder(cardBuffer, { name: 'env-engine-test.png' });

        await interaction.editReply({
          content: `**Environment Selection preview — ${week}**\nSession ratings based on USD events and market context. Click a day for the full breakdown.`,
          files: [attachment],
          components: [buildDayButtons()],
        });
      }

      if (commandName === 'test-sweep') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        // Force a fresh YF fetch — bypass internal catch to surface errors
        // Direct fetch — fully transparent, shows raw result always
        let yfStatus = '⏳ fetching...';
        try {
          const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(NQ_SYMBOL)}?interval=1d&range=5d`;
          const proxyUrl = `${YF_PROXY_URL}?url=${encodeURIComponent(yfUrl)}`;
          const json = await httpsGet(proxyUrl);
          if (json.error) throw new Error('proxy error: ' + JSON.stringify(json.error));
          const result = json?.chart?.result?.[0];
          if (!result) throw new Error('no result — raw: ' + JSON.stringify(json).slice(0, 300));
          const dhRaw = result.indicators?.quote?.[0]?.high;
          const dlRaw = result.indicators?.quote?.[0]?.low;
          if (!dhRaw) throw new Error('no quote data in result');
          const dhClean = dhRaw.filter(v => v != null);
          const dlClean = dlRaw.filter(v => v != null);
          if (dhClean.length >= 2) {
            _nqLevels.pdh = dhClean[dhClean.length - 2];
            _nqLevels.pdl = dlClean[dlClean.length - 2];
          } else if (dhClean.length === 1) {
            _nqLevels.pdh = dhClean[0];
            _nqLevels.pdl = dlClean[0];
          }
          yfStatus = `✅ daily ok — highs: ${JSON.stringify(dhClean)}`;
          // Weekly — find last fully-closed week
          const weekly = await _fetchNQCandles('3mo', '1wk');
          const whRaw2 = weekly.indicators.quote[0].high;
          const wlRaw2 = weekly.indicators.quote[0].low;
          const wts2   = weekly.timestamp;
          const msPerWeek2 = 7 * 24 * 3600 * 1000;
          let pwIdx2 = -1;
          for (let i = whRaw2.length - 1; i >= 0; i--) {
            if (whRaw2[i] != null && (wts2[i] * 1000 + msPerWeek2) < Date.now()) { pwIdx2 = i; break; }
          }
          if (pwIdx2 >= 0) { _nqLevels.pwh = whRaw2[pwIdx2]; _nqLevels.pwl = wlRaw2[pwIdx2]; }
          // Monthly
          const monthly = await _fetchNQCandles('2y', '1mo');
          const mhClean = monthly.indicators.quote[0].high.filter(v => v != null);
          const mlClean = monthly.indicators.quote[0].low.filter(v => v != null);
          if (mhClean.length >= 2) { _nqLevels.pmh = mhClean[mhClean.length - 2]; _nqLevels.pml = mlClean[mlClean.length - 2]; }
          yfStatus += ` | pwh=${_nqLevels.pwh} pmh=${_nqLevels.pmh}`;
        } catch (e) {
          yfStatus = `❌ ${e.message}`;
        }
        // Always show debug line so we can see what happened
        console.log('[test-sweep YF]', yfStatus, '| nqLevels:', JSON.stringify(_nqLevels));

        const fmt = v => v != null && !isNaN(v) ? `\`${parseFloat(v).toFixed(2)}\`` : '`—`';
        // YF only for now — Pine/_pineLevels wired in later when friend gets Plus
        const n = _nqLevels;

        const nyTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true });
        const hm = _nyHM();
        const SESSION_LABELS = { asia: 'Asia (18:00–00:00)', london: 'London (00:00–07:00)', nyam: 'NY Morning (07:00–11:30)', nypm: 'NY Afternoon (11:30–16:00)' };
        const curSessKey = hm >= 1080 ? 'asia' : hm < 420 ? 'london' : hm < 690 ? 'nyam' : hm < 960 ? 'nypm' : null;
        const curSessLabel = SESSION_LABELS[curSessKey] || '—';

        // Only show session H/L for completed sessions (not the active one)
        const sessDisplay = [
          { key: 'asia',   lH: 'ASH',  lL: 'ASL'  },
          { key: 'london', lH: 'LOH',  lL: 'LOL'  },
          { key: 'nyam',   lH: 'NYAH', lL: 'NYAL' },
          { key: 'nypm',   lH: 'NYPH', lL: 'NYPL' },
        ].map(s => {
          const sd = _tcSessions[s.key] || {};
          const isActive = s.key === curSessKey;
          const label = SESSION_LABELS[s.key] || s.key;
          if (isActive) {
            return `\`${s.lH}\` *in progress*   \`${s.lL}\` *in progress*  *(${label})*`;
          }
          return `\`${s.lH}\` ${fmt(sd.h)}   \`${s.lL}\` ${fmt(sd.l)}`;
        });

        const lines = [
          `**Current Session** — ${curSessLabel}  ·  ${nyTime} ET`,
          yfStatus.startsWith('❌') ? `⚠️ YF: \`${yfStatus.slice(0, 100)}\`` : '',
          ``,
          `**━━ Universal Levels ━━**`,
          `\`PDH\` ${fmt(n.pdh)}   \`PDL\` ${fmt(n.pdl)}`,
          `\`PWH\` ${fmt(n.pwh)}   \`PWL\` ${fmt(n.pwl)}`,
          `\`PMH\` ${fmt(n.pmh)}   \`PML\` ${fmt(n.pml)}`,
          `\`PreMH\` ${fmt(n.premh)}   \`PreML\` ${fmt(n.preml)}`,
          ``,
          `**━━ Session Levels ━━**`,
          ...sessDisplay,
          ``,
          `**━━ Fired Today ━━**`,
          Object.keys(_swept).length ? Object.keys(_swept).map(k => `\`${k}\``).join('  ') : '*none yet*',
        ].filter(l => l !== '').join('\n');

        const embed = new EmbedBuilder()
          .setColor(0x22d3ee)
          .setTitle('📡  Sweep Alerts — Live State')
          .setDescription(lines)
          .setTimestamp()
          .setFooter({ text: '⚠️ Visible to staff only · The Smart Money Paradigm' });

        return interaction.editReply({ embeds: [embed] });
      }

      if (commandName === 'setup-sweep-alerts') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const everyoneRole = guild.roles.everyone;

        // Delete old TC/QT roles if they exist
        const oldTcRole = guild.roles.cache.find(r => r.name === '📈 Time Cycle Alerts');
        if (oldTcRole) await oldTcRole.delete('Renamed to Sweep Alerts').catch(() => {});
        const oldQtRole = guild.roles.cache.find(r => r.name === '📐 QT Theory Alerts');
        if (oldQtRole) await oldQtRole.delete('QT Theory removed').catch(() => {});

        // Create single sweep alerts role
        let tcRole = guild.roles.cache.find(r => r.name === '📡 Sweep Alerts');
        if (!tcRole) tcRole = await guild.roles.create({ name: '📡 Sweep Alerts', color: 0x22d3ee, mentionable: true, reason: 'Sweep Alerts system' });
        SWEEP_TC_ROLE_ID = tcRole.id;

        // Create ALERTS category
        let alertCat = guild.channels.cache.find(c => c.type === 4 && c.name === '〢 ALERTS');
        if (!alertCat) {
          alertCat = await guild.channels.create({
            name: '〢 ALERTS', type: 4,
            permissionOverwrites: [{ id: everyoneRole.id, deny: ['ViewChannel'] }],
          });
        }

        // #🔔〢alert-roles — everyone sees, for self-assign buttons
        let rolesAlertCh = guild.channels.cache.find(c => c.name === '🔔〢alert-roles');
        if (!rolesAlertCh) {
          rolesAlertCh = await guild.channels.create({
            name: '🔔〢alert-roles', type: 0, parent: alertCat.id,
            permissionOverwrites: [
              { id: everyoneRole.id, allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
              { id: STAFF_ROLE_IDS[0], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
              { id: STAFF_ROLE_IDS[1], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
            ],
          });
        }
        SWEEP_ROLES_CH_ID = rolesAlertCh.id;

        // #📡〢sweep-alerts — only Sweep Alerts role holders can see
        const sweepPerms = [
          { id: everyoneRole.id, deny: ['ViewChannel'] },
          { id: tcRole.id, allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
          { id: STAFF_ROLE_IDS[0], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
          { id: STAFF_ROLE_IDS[1], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
        ];
        let alertCh = guild.channels.cache.find(c => c.name === '📡〢sweep-alerts');
        if (!alertCh) {
          alertCh = await guild.channels.create({
            name: '📡〢sweep-alerts', type: 0, parent: alertCat.id,
            permissionOverwrites: sweepPerms,
          });
        } else {
          await alertCh.permissionOverwrites.set(sweepPerms);
        }
        SWEEP_ALERT_CH_ID = alertCh.id;

        const existingVcCh = guild.channels.cache.find(c => c.name === '📅〢vc-schedule');
        await _postCombinedAlertRoles(rolesAlertCh, alertCh.id, existingVcCh?.id);

        return interaction.editReply({
          content: `✅ Done!\n\n**Role:** <@&${tcRole.id}>\n**Alert channel:** <#${alertCh.id}>\n**Self-assign:** <#${rolesAlertCh.id}>`,
        });
      }

      // ── /setup-freechat ──
      if (commandName === 'setup-freechat') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });
        const ch = guild.channels.cache.get(FREE_CHAT_CH_ID);
        if (!ch) return interaction.editReply({ content: 'Cannot find free chat channel.' });
        await ch.send({ embeds: [_buildFreeChatEmbed()] });
        return interaction.editReply({ content: 'Guide embed posted in free chat.' });
      }

      // ── /test-freechat ──
      if (commandName === 'test-freechat') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });
        return interaction.reply({ embeds: [_buildFreeChatEmbed()], ephemeral: true });
      }

      // ── /test-joincard ──
      if (commandName === 'test-joincard') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });
        const card = await _generateJoinCard(interaction.member);
        const file = new AttachmentBuilder(card, { name: 'welcome.png' });
        const embed = new EmbedBuilder()
          .setColor(0x111114)
          .setDescription(`hey <@${interaction.user.id}> 👋 head to <#${ROLES_CH_ID}> and hit **Request Access** to join the mentorship.`)
          .setImage('attachment://welcome.png')
          .setFooter({ text: 'TSMP · Smart Money Paradigm' });
        return interaction.editReply({ embeds: [embed], files: [file] });
      }

      // ── /purge-channel ──
      // Wipes every message in the channel it's run in (or a named channel).
      // Bulk-deletes in batches of 100 for anything under 14 days old; anything
      // older than that Discord's bulk endpoint rejects, so those fall back to
      // one-by-one deletes with a small delay to respect the per-message rate limit.
      if (commandName === 'purge-channel') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });

        const targetCh = interaction.options.getChannel('channel') || interaction.channel;
        let totalDeleted = 0;

        try {
          while (true) {
            const batch = await targetCh.messages.fetch({ limit: 100 });
            if (batch.size === 0) break;

            const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const bulkable = batch.filter(m => m.createdTimestamp > fourteenDaysAgo);
            const old = batch.filter(m => m.createdTimestamp <= fourteenDaysAgo);

            if (bulkable.size > 1) {
              await targetCh.bulkDelete(bulkable, true);
              totalDeleted += bulkable.size;
            } else if (bulkable.size === 1) {
              await bulkable.first().delete().catch(() => {});
              totalDeleted += 1;
            }

            for (const msg of old.values()) {
              await msg.delete().catch(() => {});
              totalDeleted += 1;
              await new Promise(r => setTimeout(r, 350));
            }

            if (old.size > 0 && bulkable.size === 0) break; // avoid infinite loop if only old msgs remain and none deletable
            if (batch.size < 100) break;
          }
        } catch (e) {
          console.error('[purge-channel] error:', e.message);
          return interaction.editReply({ content: `Stopped after deleting ${totalDeleted} messages — hit an error: ${e.message}` });
        }

        return interaction.editReply({ content: `✅ Purged ${totalDeleted} messages from <#${targetCh.id}>.` });
      }

      // ── /vol-override ──
      // Grants a specific member extra live sessions for the current week
      // only, on top of whatever their volume tier's base limit is. Resets
      // along with everyone else's count at the next Sunday 00:00 ET rollover.
      if (commandName === 'vol-override') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        const targetUser = interaction.options.getUser('member');
        const extra = interaction.options.getInteger('extra_sessions');

        if (!targetUser) {
          await interaction.deferReply({ ephemeral: true });
          const allMembers = await interaction.guild.members.fetch();
          const volMembers = allMembers.filter(m => Object.values(VOLUME_ROLES).some(v => m.roles.cache.has(v.id)));
          for (const m of volMembers.values()) _streamSetBonus(m.id, extra);
          return interaction.editReply({
            content: `✅ Granted +${extra} bonus streams this week to all ${volMembers.size} Volume member(s). Resets Sunday 00:00 ET.`,
          });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        _streamSetBonus(targetUser.id, extra);

        const baseLimit = targetMember ? _streamBaseLimit(targetMember) : STREAM_TIER_LIMITS['Vol I'];
        const newLimit = baseLimit + extra;
        return interaction.reply({
          content: `✅ <@${targetUser.id}> can now attend ${newLimit}/5 streams this week (base ${baseLimit} + ${extra} bonus). Resets Sunday 00:00 ET.`,
          ephemeral: true,
        });
      }

      // ── /reset-stream-quota ──
      if (commandName === 'reset-stream-quota') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        const targetUser = interaction.options.getUser('member');
        if (targetUser) {
          _streamResetQuota(targetUser.id);
          return interaction.reply({ content: `✅ Reset <@${targetUser.id}>'s stream quota to 0 for this week.`, ephemeral: true });
        }

        _streamResetAllQuotas();
        return interaction.reply({ content: `✅ Reset stream quota to 0 for everyone this week.`, ephemeral: true });
      }

      // ── /stream-history ──
      // Shows every past /host-stream session that was ended via End Stream
      // (cancelled streams are discarded, never logged here) — start/end
      // time in ET, host, and each attendee's total minutes in that specific
      // VC while the stream was active. Fetches from the Worker/R2, not the
      // local streamHistory array, since that array is wiped on every
      // Railway restart — the Worker copy is the durable source of truth.
      if (commandName === 'stream-history') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        const historyCh = interaction.guild.channels.cache.get(STREAM_ANNOUNCE_CH_ID);
        if (!historyCh) return interaction.reply({ content: 'Stream announcement channel not found.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const dateFilter = interaction.options.getString('date'); // YYYY-MM-DD, ET

        let allHistory = [];
        try {
          const r = await fetch('https://smp-join.poshop608.workers.dev/bot/stream-history', {
            headers: { 'Authorization': `Bot ${process.env.TOKEN}` },
          });
          const d = await r.json();
          if (d.ok) allHistory = d.history;
        } catch (e) {
          console.error('[stream-history] fetch failed:', e.message);
        }

        let list = allHistory;
        if (dateFilter) {
          list = list.filter(s => new Date(s.startedAt).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) === dateFilter);
        }

        if (!list.length) {
          const msg = dateFilter ? `No streams logged on ${dateFilter}.` : 'No completed streams logged yet.';
          await historyCh.send({ content: msg });
          return interaction.editReply({ content: 'Posted.' });
        }

        const chunk = [...list].reverse().slice(0, 10); // most recent first, Discord caps 10 embeds/msg
        const embeds = [];
        for (const s of chunk) embeds.push(await _streamHistoryEmbed(interaction.guild, s));

        await historyCh.send({
          content: dateFilter
            ? `Streams from ${dateFilter}:`
            : `Showing ${chunk.length} of ${list.length} logged stream(s), most recent first:`,
          embeds,
        });

        return interaction.editReply({ content: 'Posted.' });
      }

      // ── /stream-leaderboard ──
      // Ranks every Volume I-IV member by total streams attended + total VC
      // minutes (both shown, per the "attending the most" spec covering
      // either read), and separately flags every Volume member with zero
      // appearances across all logged history.
      if (commandName === 'stream-leaderboard') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        const historyCh = interaction.guild.channels.cache.get(STREAM_ANNOUNCE_CH_ID);
        if (!historyCh) return interaction.reply({ content: 'Stream announcement channel not found.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        let allHistory = [];
        try {
          const r = await fetch('https://smp-join.poshop608.workers.dev/bot/stream-history', {
            headers: { 'Authorization': `Bot ${process.env.TOKEN}` },
          });
          const d = await r.json();
          if (d.ok) allHistory = d.history;
        } catch (e) {
          console.error('[stream-leaderboard] fetch failed:', e.message);
        }

        const stats = new Map(); // userId -> { streams: Set<index>, ms: number }
        allHistory.forEach((s, i) => {
          for (const a of s.attendance) {
            if (!stats.has(a.userId)) stats.set(a.userId, { streams: new Set(), ms: 0 });
            const st = stats.get(a.userId);
            st.streams.add(i);
            st.ms += a.ms;
          }
        });

        const allVolMembers = await interaction.guild.members.fetch();
        const volMemberIds = new Set();
        for (const [, member] of allVolMembers) {
          if (Object.values(VOLUME_ROLES).some(v => member.roles.cache.has(v.id))) {
            volMemberIds.add(member.id);
          }
        }

        const ranked = [...volMemberIds]
          .map(id => ({ id, streams: stats.get(id)?.streams.size || 0, ms: stats.get(id)?.ms || 0 }))
          .filter(u => u.streams > 0)
          .sort((a, b) => b.streams - a.streams || b.ms - a.ms);

        const inactive = [...volMemberIds].filter(id => !stats.has(id));

        const leaderboardEmbed = new EmbedBuilder()
          .setColor(0x38bdf8)
          .setTitle('📊 Stream Attendance Leaderboard')
          .setDescription(
            ranked.length
              ? ranked.slice(0, 20).map((u, i) => `**${i + 1}.** <@${u.id}> — ${u.streams} stream${u.streams === 1 ? '' : 's'}, ${_fmtMins(u.ms)}`).join('\n')
              : '*No attendance logged yet.*'
          );

        const inactiveEmbed = new EmbedBuilder()
          .setColor(0xf87171)
          .setTitle('🚫 Never Attended')
          .setDescription(
            inactive.length
              ? inactive.map(id => `<@${id}>`).join('\n').slice(0, 4000)
              : '*Everyone with a Volume role has attended at least one stream.*'
          );

        await historyCh.send({ embeds: [leaderboardEmbed, inactiveEmbed] });
        return interaction.editReply({ content: 'Posted.' });
      }

      // ── /host-stream ──
      if (commandName === 'host-stream') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        if (activeStream) {
          const vcOpt = interaction.options.getChannel('channel');
          const cancelRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`stream_force_cancel_${vcOpt.id}`)
              .setLabel('Cancel Active & Start New')
              .setEmoji('🛑')
              .setStyle(ButtonStyle.Danger)
          );
          return interaction.reply({
            content: `A stream is already active in <#${activeStream.vcId}> (it should auto-end when that VC empties, but can get stuck if the announcement message was deleted). ` +
              `Cancel it and start the new one in <#${vcOpt.id}>?`,
            components: [cancelRow],
            ephemeral: true,
          });
        }

        const vc = interaction.options.getChannel('channel');
        await interaction.deferReply({ ephemeral: true });

        const ch = interaction.guild.channels.cache.get(STREAM_ANNOUNCE_CH_ID);
        if (!ch) return interaction.editReply({ content: 'Stream announcement channel not found.' });

        const embed = _streamEmbed({ hostId: interaction.user.id, vcName: vc.name, startedAt: new Date(), joined: 0 });

        // Everyone sees Join VC. Only the button ROW differs for staff, who
        // also get Cancel Stream and End Stream — regular members never see
        // those two.
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('stream_join_click').setLabel('Join VC').setEmoji('🔊').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`stream_cancel_${interaction.user.id}`).setLabel('Cancel Stream').setEmoji('🛑').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`stream_end_${interaction.user.id}`).setLabel('End Stream').setEmoji('⏹️').setStyle(ButtonStyle.Secondary)
        );

        const msg = await ch.send({ embeds: [embed], components: [row] }).catch(() => null);
        if (!msg) return interaction.editReply({ content: 'Could not post the stream announcement.' });

        activeStream = { vcId: vc.id, vcName: vc.name, messageId: msg.id, hostId: interaction.user.id, startedAt: new Date(), clickedUserIds: new Set(), vcTimes: new Map() };
        return interaction.editReply({ content: `✅ Stream announcement posted in <#${STREAM_ANNOUNCE_CH_ID}>, tracking joins for <#${vc.id}>.` });
      }

      // ── /cancel-stream ──
      // Fallback for when the announcement message was deleted before the
      // Cancel button could be clicked, or before the bot had it cached
      // (MessageDelete doesn't fire for messages discord.js never cached,
      // so a manual delete doesn't always clear activeStream on its own).
      if (commandName === 'cancel-stream') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        if (!activeStream) {
          return interaction.reply({ content: 'No stream is currently active.', ephemeral: true });
        }

        // Defer before any awaited work — the message fetch/edit below can
        // take longer than Discord's 3s ACK window, which was silently
        // expiring the interaction token and causing "didn't respond".
        await interaction.deferReply({ ephemeral: true });

        const ended = activeStream;
        activeStream = null;

        // Best-effort: if the message still exists, edit it to show cancelled.
        const ch = interaction.guild.channels.cache.get(STREAM_ANNOUNCE_CH_ID);
        const msg = ch ? await ch.messages.fetch(ended.messageId).catch(() => null) : null;
        if (msg) {
          const cancelledEmbed = EmbedBuilder.from(msg.embeds[0])
            .setColor(0x6b7280)
            .setTitle('🛑 Stream Cancelled')
            .setDescription(`Cancelled by <@${interaction.user.id}> via /cancel-stream. No sessions were counted.`);
          const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stream_join_ended').setLabel('Stream Cancelled').setStyle(ButtonStyle.Secondary).setDisabled(true)
          );
          await msg.edit({ embeds: [cancelledEmbed], components: [disabledRow] }).catch(() => {});
        }

        return interaction.editReply({ content: `✅ Stream cancelled — <#${ended.vcId}> is no longer gated.` });
      }

      // ── /setup-modlog ──
      if (commandName === 'setup-modlog') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });

        const everyoneRole = guild.roles.everyone;

        // Create or find Admin category
        let adminCat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '🔒 ADMIN');
        if (!adminCat) {
          adminCat = await guild.channels.create({
            name: '🔒 ADMIN',
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
              { id: everyoneRole.id, deny: [PermissionsBitField.Flags.ViewChannel] },
              { id: STAFF_ROLE_IDS[0], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
              { id: STAFF_ROLE_IDS[1], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
            ],
          });
        }

        // Create or find #mod-log channel
        let modLogCh = guild.channels.cache.find(c => c.name === 'mod-log' && c.parentId === adminCat.id);
        if (!modLogCh) {
          modLogCh = await guild.channels.create({
            name: 'mod-log',
            type: ChannelType.GuildText,
            parent: adminCat.id,
            permissionOverwrites: [
              { id: everyoneRole.id, deny: [PermissionsBitField.Flags.ViewChannel] },
              { id: STAFF_ROLE_IDS[0], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] },
              { id: STAFF_ROLE_IDS[1], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] },
            ],
            topic: 'Automated server audit log — all changes tracked here.',
          });
        }
        MOD_LOG_CH_ID = modLogCh.id;

        await interaction.editReply({ content: `✅ Mod log active!\n**Category:** ${adminCat.name}\n**Channel:** <#${modLogCh.id}>` });
        await modLogCh.send({ embeds: [new EmbedBuilder().setColor(0x6366f1).setTitle('📋 Mod Log Active').setDescription('All server events will be logged here automatically.').setTimestamp()] });
        return;
      }

      // ── /setup-signals ──
      if (commandName === 'setup-signals') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });

        const everyoneRole = guild.roles.everyone;
        const overwrites = [
          { id: everyoneRole.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: PREMIUM_SIGNAL_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
          { id: STAFF_ROLE_IDS[0], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
          { id: STAFF_ROLE_IDS[1], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        ];

        let signalsCat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '📡 SIGNALS');
        if (!signalsCat) {
          signalsCat = await guild.channels.create({
            name: '📡 SIGNALS',
            type: ChannelType.GuildCategory,
            permissionOverwrites: overwrites,
          });
        }

        let signalsCh = guild.channels.cache.find(c => c.name === 'signals' && c.parentId === signalsCat.id);
        if (!signalsCh) {
          signalsCh = await guild.channels.create({
            name: 'signals',
            type: ChannelType.GuildText,
            parent: signalsCat.id,
            permissionOverwrites: overwrites,
            topic: 'Live trading signals — Premium Signal access only.',
          });
        }

        await interaction.editReply({ content: `✅ Signals set up!\n**Category:** ${signalsCat.name}\n**Channel:** <#${signalsCh.id}>\n**Role:** <@&${PREMIUM_SIGNAL_ROLE_ID}>` });
        return;
      }

      // ── /setup-vc-alerts ──
      if (commandName === 'setup-vc-alerts') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });
        const everyoneRole = guild.roles.everyone;

        let vcRole = guild.roles.cache.find(r => r.name === '📅 VC Alerts');
        if (!vcRole) vcRole = await guild.roles.create({ name: '📅 VC Alerts', color: 0xfbbf24, mentionable: true, reason: 'VC Alerts system' });
        VC_ALERT_ROLE_ID = vcRole.id;

        let alertCat = guild.channels.cache.find(c => c.type === 4 && c.name === '〢 ALERTS');
        if (!alertCat) {
          alertCat = await guild.channels.create({
            name: '〢 ALERTS', type: 4,
            permissionOverwrites: [{ id: everyoneRole.id, deny: ['ViewChannel'] }],
          });
        }

        // #🔔〢alert-roles — add VC button if channel exists
        let rolesAlertCh = guild.channels.cache.find(c => c.name === '🔔〢alert-roles');
        if (!rolesAlertCh) {
          rolesAlertCh = await guild.channels.create({
            name: '🔔〢alert-roles', type: 0, parent: alertCat.id,
            permissionOverwrites: [
              { id: everyoneRole.id, allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
              { id: STAFF_ROLE_IDS[0], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
              { id: STAFF_ROLE_IDS[1], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
            ],
          });
        }
        if (!SWEEP_ROLES_CH_ID) SWEEP_ROLES_CH_ID = rolesAlertCh.id;

        // #📅〢vc-schedule — everyone can see, nobody can type
        let vcSchedCh = guild.channels.cache.find(c => c.name === '📅〢vc-schedule');
        if (!vcSchedCh) {
          vcSchedCh = await guild.channels.create({
            name: '📅〢vc-schedule', type: 0, parent: alertCat.id,
            permissionOverwrites: [
              { id: everyoneRole.id, allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
              { id: vcRole.id, allow: ['ViewChannel', 'ReadMessageHistory'] },
              { id: STAFF_ROLE_IDS[0], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
              { id: STAFF_ROLE_IDS[1], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
            ],
          });
        }
        VC_SCHED_CH_ID = vcSchedCh.id;

        // Post/update combined alert-roles message
        const sweepAlertChId = guild.channels.cache.find(c => c.name === '📡〢sweep-alerts')?.id;
        await _postCombinedAlertRoles(rolesAlertCh, sweepAlertChId, vcSchedCh.id);

        return interaction.editReply({ content: `✅ Done!\n**Role:** <@&${vcRole.id}>\n**Schedule channel:** <#${vcSchedCh.id}>\n**Self-assign:** <#${rolesAlertCh.id}>` });
      }

      // ── /vc-schedule ──
      if (commandName === 'vc-schedule') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });

        if (!VC_SCHED_CH_ID) return interaction.editReply({ content: 'Run `/setup-vc-alerts` first.' });

        const timeVal    = interaction.options.getString('time');
        const vcChName   = interaction.options.getString('channel');
        const customTime = interaction.options.getString('custom_time');
        const note       = interaction.options.getString('note') ?? null;
        const host       = interaction.options.getString('host');

        // Parse time → next occurrence in ET
        const chosenTime = customTime ?? timeVal;
        const [hStr, mStr] = chosenTime.split(':');
        const hh = parseInt(hStr, 10);
        const mm = parseInt(mStr, 10);
        if (isNaN(hh) || isNaN(mm)) return interaction.editReply({ content: 'Invalid time format. Use HH:MM (24h ET).' });

        // Build target epoch (ET = UTC-4 in summer, UTC-5 winter — use Intl to determine)
        const nowNY = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const target = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
        target.setHours(hh, mm, 0, 0);
        // If time already passed today, schedule for tomorrow
        if (target <= nowNY) target.setDate(target.getDate() + 1);
        // Convert target NY time → UTC epoch
        const targetUTC = new Date(target.toLocaleString('en-US', { timeZone: 'UTC' }));
        // Use offset approach: get UTC equivalent
        const nyOffsetMs = nowNY.getTime() - new Date(new Date().toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
        const startEpoch = Math.floor((target.getTime() - nyOffsetMs) / 1000);

        const secsUntil = startEpoch - Math.floor(Date.now() / 1000);
        if (secsUntil > 24 * 3600) return interaction.editReply({ content: 'Cannot schedule more than 24h ahead.' });

        // Cancel any existing countdown
        if (_vcCountdown) {
          clearInterval(_vcCountdown.intervalId);
          _vcCountdown = null;
          _vcSave();
        }

        const ch = guild.channels.cache.get(VC_SCHED_CH_ID);
        if (!ch) return interaction.editReply({ content: 'vc-schedule channel not found.' });

        // Initial ping
        const pingContent = VC_ALERT_ROLE_ID
          ? `<@&${VC_ALERT_ROLE_ID}> 📅 **${vcChName}** session scheduled for <t:${startEpoch}:t> ET — <t:${startEpoch}:R>`
          : `📅 **${vcChName}** session scheduled for <t:${startEpoch}:t> ET — <t:${startEpoch}:R>`;

        const sentMsg = await ch.send({
          content: pingContent,
          embeds: [_buildVcEmbed(startEpoch, vcChName, note, false, host)],
        });

        const intervalId = setInterval(() => _tickVcCountdown().catch(() => {}), 60 * 1000);
        _vcCountdown = { messageId: sentMsg.id, vcChannelName: vcChName, sessionNote: note, host, startEpoch, intervalId, warned4h: false, warned1h: false, warned15: false };
        _vcSave();

        return interaction.editReply({ content: `✅ Countdown posted in <#${VC_SCHED_CH_ID}>. Starts <t:${startEpoch}:R>.` });
      }

      // ── /vc-cancel ──
      if (commandName === 'vc-cancel') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });
        if (!_vcCountdown) return interaction.reply({ content: 'No active VC countdown.', ephemeral: true });
        clearInterval(_vcCountdown.intervalId);
        // Edit message to cancelled state
        try {
          const ch = guild.channels.cache.get(VC_SCHED_CH_ID);
          if (ch) {
            const msg = await ch.messages.fetch(_vcCountdown.messageId);
            const cancelEmbed = new EmbedBuilder()
              .setColor(0x6b7280)
              .setTitle('❌  Session Cancelled')
              .setDescription(`The **${_vcCountdown.vcChannelName}** session has been cancelled.`)
              .setFooter({ text: 'The Smart Money Paradigm  ·  VC Schedule' })
              .setTimestamp();
            await msg.edit({ embeds: [cancelEmbed], components: [] });
          }
        } catch (_) {}
        _vcCountdown = null;
        _vcSave();
        return interaction.reply({ content: '✅ VC countdown cancelled.', ephemeral: true });
      }

      // ── /giveaway ──
      if (commandName === 'giveaway') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        const modal = new ModalBuilder()
          .setCustomId('giveaway_modal')
          .setTitle('🎉 Create Giveaway');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('gw_title').setLabel('Giveaway Title').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Weekend Giveaway')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('gw_prize').setLabel('Prize').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. 1 month free membership')
          ),
        );
        return interaction.showModal(modal);
      }

      // ── /dropsignal ──
      // Any Volume tier, staff, or Assistant Coach can drop a live signal.
      // Modal collects level + optional note; the actual post + web-save
      // happen in the modal-submit handler below.
      // ── /dropsignal ──
      // Two paths: "Level" (quick price + note, unchanged from before) or
      // "Signal" (structured asset/direction/stop/TP, built across several
      // button clicks + a review step since Discord can't chain modal ->
      // modal directly). Both end up with the same W/L/Criteria outcome
      // buttons once posted.
      if (commandName === 'dropsignal') {
        if (!_canDropSignal(interaction.member)) {
          return interaction.reply({ content: 'No permission.', ephemeral: true });
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('dropsignal_pick_level').setLabel('Level').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('dropsignal_pick_signal').setLabel('Signal').setStyle(ButtonStyle.Success),
        );
        return interaction.reply({ content: 'What are you dropping?', components: [row], ephemeral: true });
      }

      if (commandName === 'clear-welcome') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const welcomeCh = guild.channels.cache.get(WELCOME_CH_ID);
        if (!welcomeCh) return interaction.editReply({ content: 'Welcome channel not found.' });

        let deleted = 0;
        let fetched;
        do {
          fetched = await welcomeCh.messages.fetch({ limit: 100 });
          const botMsgs = fetched.filter(m => m.author.id === client.user.id);
          if (botMsgs.size === 0) break;
          await welcomeCh.bulkDelete(botMsgs, true).catch(async () => {
            for (const m of botMsgs.values()) await m.delete().catch(() => {});
          });
          deleted += botMsgs.size;
        } while (fetched.size === 100);

        return interaction.editReply({ content: `Deleted ${deleted} bot messages from welcome channel.` });
      }

      if (commandName === 'welcome-all') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const welcomeCh = guild.channels.cache.get(WELCOME_CH_ID);
        if (!welcomeCh) return interaction.editReply({ content: 'Welcome channel not found.' });

        const allMembers = await guild.members.fetch();
        const targets = allMembers.filter(m => !m.user.bot);

        let count = 0;
        const memberArray = [...targets.values()].sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
        for (let i = 0; i < memberArray.length; i++) {
          const m = memberArray[i];
          try {
            const cardBuffer = await buildWelcomeCard(m, i + 1);
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });

            const welcomeEmbed = new EmbedBuilder()
              .setColor(0x0a0a0a)
              .setDescription(
                `## Welcome, <@${m.user.id}>\n\n` +
                `*Not everyone who enters leaves the same.*\n\n` +
                `Head to <#${ROLES_CH_ID}> and request access to unlock the server.`
              )
              .setImage('attachment://welcome.png')
              .setFooter({ text: 'The Smart Money Paradigm  ·  The market is engineered. Learn the engineering.' });

            await welcomeCh.send({ embeds: [welcomeEmbed], files: [attachment] });
            count++;
            await new Promise(r => setTimeout(r, 800));
          } catch (e) {
            console.warn(`welcome-all skip ${m.user.tag}:`, e.message);
          }
        }

        return interaction.editReply({ content: `Done. Posted welcome for ${count} members.` });
      }

      if (commandName === 'test-welcome') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const welcomeCh = guild.channels.cache.get(WELCOME_CH_ID);
        if (!welcomeCh) return interaction.editReply({ content: 'Welcome channel not found.' });

        const cardBuffer = await buildWelcomeCard(interaction.member, guild.memberCount);
        const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });

        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x0a0a0a)
          .setDescription(
            `## Welcome, <@${interaction.user.id}>\n\n` +
            `*Not everyone who enters leaves the same.*\n\n` +
            `Head to <#${ROLES_CH_ID}> and request access to unlock the server.`
          )
          .setImage('attachment://welcome.png')
          .setFooter({ text: 'The Smart Money Paradigm  ·  The market is engineered. Learn the engineering.' });

        await welcomeCh.send({ embeds: [welcomeEmbed], files: [attachment] });

        return interaction.editReply({ content: 'Test welcome card posted.' });
      }

      if (commandName === 'create-invite') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        // Use the roles channel (public) so the invite lands on a real channel
        const targetCh = guild.channels.cache.get(ROLES_CH_ID) || guild.channels.cache.find(c => c.type === 0);
        if (!targetCh) return interaction.editReply({ content: 'No suitable channel found to create invite from.' });

        const invite = await targetCh.createInvite({
          maxAge: 0,      // never expires
          maxUses: 0,     // unlimited uses
          unique: true,
          reason: `Permanent invite created by ${interaction.user.tag} via /create-invite`,
        });

        return interaction.editReply({ content: `**Permanent invite link:**\nhttps://discord.gg/${invite.code}\n\nNever expires · Unlimited uses · Created by TsmpBot` });
      }

      if (commandName === 'welcome') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('user');
        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) return interaction.editReply({ content: 'Member not found in server.' });

        const welcomeCh = guild.channels.cache.get(WELCOME_CH_ID);
        if (!welcomeCh) return interaction.editReply({ content: 'Welcome channel not found.' });

        const cardBuffer = await buildWelcomeCard(targetMember, guild.memberCount);
        const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });

        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x0a0a0a)
          .setDescription(
            `## Welcome, <@${targetUser.id}>\n\n` +
            `*Not everyone who enters leaves the same.*\n\n` +
            `You've been granted access. The server is yours.`
          )
          .setImage('attachment://welcome.png')
          .setFooter({ text: 'The Smart Money Paradigm  ·  The market is engineered. Learn the engineering.' });

        await welcomeCh.send({ embeds: [welcomeEmbed], files: [attachment] });
        return interaction.editReply({ content: `Welcome card posted for <@${targetUser.id}>.` });
      }

      if (commandName === 'news-protocols') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.reply({ content: 'Posting news protocols...', ephemeral: true });

        const ch = guild.channels.cache.get(NEWS_PROTOCOLS_CH_ID);
        if (!ch) return interaction.editReply({ content: 'news-protocols channel not found.' });

        const PROTOCOLS_DIR = path.join(__dirname, '..', 'Downloads', 'news protocols');

        for (const protocol of NEWS_PROTOCOLS) {
          const filePath = path.join(PROTOCOLS_DIR, protocol.file);
          const attachment = new AttachmentBuilder(filePath);
          await ch.send({
            content: protocol.context,
            files: [attachment],
          });
          await new Promise(r => setTimeout(r, 800));
        }

        return interaction.editReply({ content: 'All 10 news protocol images posted.' });
      }
    }

    // ── Modal submit ──
    if (interaction.isModalSubmit()) {

      // access_intake_modal handled below outside button block

      if (interaction.customId.startsWith('env_edit_day_')) {
        await interaction.deferReply({ ephemeral: true });
        const day = interaction.customId.replace('env_edit_day_', '');
        const warning   = interaction.fields.getTextInputValue('warning').trim();
        const execNotes = interaction.fields.getTextInputValue('execNotes').trim();
        const killzones = interaction.fields.getTextInputValue('killzones').trim();

        if (!warning && !execNotes && !killzones) {
          delete _envOverrides[day];
        } else {
          _envOverrides[day] = { warning, execNotes, killzones };
        }
        saveEnvOverrides(_envOverrides);
        return interaction.editReply({ content: `✅ **${day}** day-level override saved.` });
      }

      if (interaction.customId.startsWith('env_edit_sess_')) {
        await interaction.deferReply({ ephemeral: true });
        const parts = interaction.customId.replace('env_edit_sess_', '').split('_');
        const sess = parts.pop();
        const day = parts.join('_');
        const key = `${day}_${sess}`;

        const rating = interaction.fields.getTextInputValue('rating').trim().toUpperCase();
        const reason = interaction.fields.getTextInputValue('reason').trim();
        const notes  = interaction.fields.getTextInputValue('notes').trim();

        const validRatings = ['IDEAL', 'CAUTION', 'AVOID'];
        if (rating && !validRatings.includes(rating)) {
          return interaction.editReply({ content: `Invalid rating. Use IDEAL, CAUTION, or AVOID.` });
        }

        if (!rating && !reason && !notes) {
          delete _envOverrides[key];
        } else {
          _envOverrides[key] = { rating, reason, notes };
        }
        saveEnvOverrides(_envOverrides);
        return interaction.editReply({ content: `✅ **${day} — ${sess}** override saved.` });
      }

      if (interaction.customId.startsWith('roadmap_modal_')) {
        await interaction.deferReply({ ephemeral: true });

        const vol = interaction.customId.replace('roadmap_modal_', '');
        const raw = interaction.fields.getTextInputValue('roadmap_items');

        const items = raw
          .split('\n')
          .map(l => l.replace(/^\s*\d+[\.\)]\s*/, '').trim())
          .filter(l => l.length > 0);

        ROADMAP_SECTIONS[vol].items = items;

        const ROADMAP_CH_ID = '1510155588686970900';
        const ch = interaction.guild.channels.cache.get(ROADMAP_CH_ID);
        const updatedContent = buildRoadmapContent();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('roadmap_question')
            .setLabel('💬 Ask a Question')
            .setStyle(ButtonStyle.Secondary),
        );

        if (roadmapMessageId) {
          try {
            const msg = await ch.messages.fetch(roadmapMessageId);
            await msg.edit({ content: updatedContent, components: [row] });
            return interaction.editReply({ content: 'Roadmap updated in place.' });
          } catch (e) {}
        }

        const msg = await ch.send({ content: updatedContent, components: [row] });
        roadmapMessageId = msg.id;
        return interaction.editReply({ content: 'Roadmap reposted with updates.' });
      }

      // ── Giveaway modal submit ──
      if (interaction.customId === 'giveaway_modal') {
        await interaction.deferReply({ ephemeral: true });
        const title = interaction.fields.getTextInputValue('gw_title').trim();
        const prize = interaction.fields.getTextInputValue('gw_prize').trim();

        const embed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle(`🎉  ${title}`)
          .setDescription(`🎁 **Prize:** ${prize}\n\n👥 **Entrants:** 0\n\nClick **🎟️ Enter Giveaway** to join!\nHost presses **🎰 Spin the Wheel** when ready.`)
          .setFooter({ text: 'The Smart Money Paradigm  ·  Giveaway' })
          .setTimestamp();

        const memberRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('gw_enter').setLabel('🎟️ Enter Giveaway').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('gw_spin_PLACEHOLDER').setLabel('🎰 Spin the Wheel').setStyle(ButtonStyle.Danger),
        );

        const msg = await interaction.channel.send({ embeds: [embed], components: [memberRow] });

        // Replace placeholder with real message ID
        const spinBtn = new ButtonBuilder().setCustomId(`gw_spin_${msg.id}`).setLabel('🎰 Spin the Wheel').setStyle(ButtonStyle.Danger);
        const enterBtn = new ButtonBuilder().setCustomId('gw_enter').setLabel('🎟️ Enter Giveaway (0)').setStyle(ButtonStyle.Primary);
        await msg.edit({ components: [new ActionRowBuilder().addComponents(enterBtn, spinBtn)] });

        _giveaways.set(msg.id, { channelId: interaction.channelId, title, prize, hostId: interaction.user.id, entrants: new Set() });
        return interaction.editReply({ content: `✅ Giveaway posted! Press **🎰 Spin the Wheel** when you're ready to pick a winner.` });
      }
    }

    // ── Button interactions ──
    if (interaction.isButton()) {
      const { guild, member, customId } = interaction;

      // ── Sweep role toggles ──
      if (customId === 'sweep_tc_toggle') {
        await interaction.deferReply({ ephemeral: true });
        if (!SWEEP_TC_ROLE_ID) { const r = interaction.guild.roles.cache.find(r => r.name === '📡 Sweep Alerts'); if (r) SWEEP_TC_ROLE_ID = r.id; }
        if (!SWEEP_TC_ROLE_ID) return interaction.editReply({ content: 'Role not found. Ask staff to run `/setup-sweep-alerts`.' });
        const m = interaction.member;
        const has = m.roles.cache.has(SWEEP_TC_ROLE_ID);
        if (has) {
          await m.roles.remove(SWEEP_TC_ROLE_ID);
          return interaction.editReply({ content: `🔕 Removed **📡 Sweep Alerts** — you will no longer receive these alerts.` });
        } else {
          await m.roles.add(SWEEP_TC_ROLE_ID);
          return interaction.editReply({ content: `🔔 Added **📡 Sweep Alerts** — you will now be pinged for NQ sweep alerts.` });
        }
      }

      // ── VC alert role toggle ──
      if (customId === 'vc_alert_toggle') {
        await interaction.deferReply({ ephemeral: true });
        if (!VC_ALERT_ROLE_ID) {
          const r = interaction.guild.roles.cache.find(r => r.name === '📅 VC Alerts');
          if (r) VC_ALERT_ROLE_ID = r.id;
        }
        if (!VC_ALERT_ROLE_ID) return interaction.editReply({ content: 'Role not found. Ask staff to run `/setup-vc-alerts`.' });
        const m = interaction.member;
        const has = m.roles.cache.has(VC_ALERT_ROLE_ID);
        if (has) {
          await m.roles.remove(VC_ALERT_ROLE_ID);
          return interaction.editReply({ content: '🔕 Removed **📅 VC Alerts** — you will no longer be pinged for sessions.' });
        } else {
          await m.roles.add(VC_ALERT_ROLE_ID);
          return interaction.editReply({ content: '🔔 Added **📅 VC Alerts** — you will be pinged when sessions are scheduled.' });
        }
      }

      // ── Giveaway buttons ──
      if (customId === 'gw_enter') {
        const msgId = interaction.message.id;
        const gw = _giveaways.get(msgId);
        if (!gw) return interaction.reply({ content: 'This giveaway is no longer active.', ephemeral: true });

        const userId = interaction.user.id;
        if (gw.entrants.has(userId)) {
          return interaction.reply({ content: '✅ You\'re already entered!', ephemeral: true });
        }
        gw.entrants.add(userId);
        const count = gw.entrants.size;

        // Update embed count + button label
        const updatedEmbed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle(`🎉  ${gw.title}`)
          .setDescription(`🎁 **Prize:** ${gw.prize}\n\n👥 **Entrants:** ${count}\n\nClick **🎟️ Enter Giveaway** to join!\nHost presses **🎰 Spin the Wheel** when ready.`)
          .setFooter({ text: 'The Smart Money Paradigm  ·  Giveaway' })
          .setTimestamp(interaction.message.createdTimestamp);

        const updatedRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('gw_enter').setLabel(`🎟️ Enter Giveaway (${count})`).setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`gw_spin_${msgId}`).setLabel('🎰 Spin the Wheel').setStyle(ButtonStyle.Danger),
        );
        await interaction.update({ embeds: [updatedEmbed], components: [updatedRow] });
        return;
      }

      if (customId.startsWith('gw_spin_')) {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'Only staff can spin the wheel.', ephemeral: true });
        const msgId = customId.replace('gw_spin_', '');
        _spinGiveaway(interaction, msgId).catch(e => {
          console.error('Spin giveaway error:', e?.message || String(e));
          interaction.followUp({ content: `Spin failed: ${e?.message || 'unknown error'}`, ephemeral: true }).catch(() => {});
        });
        return;
      }

      // ── Env day button ──
      if (customId.startsWith('envday_')) {
        await interaction.deferReply({ ephemeral: true });
        const dowIndex = parseInt(customId.split('_')[1]);
        try {
          const weekData = await getEnvWeekData();
          const embed = buildDayEmbed(weekData, dowIndex);
          return interaction.editReply({ embeds: [embed] });
        } catch (e) {
          return interaction.editReply({ content: 'Failed to load day data — try again.' });
        }
      }

      if (customId === 'roadmap_question') {
        await interaction.deferReply({ ephemeral: true });

        const ROADMAP_CH_ID = '1510155588686970900';
        const roadmapCh = guild.channels.cache.get(ROADMAP_CH_ID);

        const existing = roadmapCh.threads.cache.find(
          t => t.name === `question-${member.user.username}` && !t.archived
        );
        if (existing) return interaction.editReply({ content: `You already have an open question thread: ${existing}` });

        const thread = await roadmapCh.threads.create({
          name: `question-${member.user.username}`,
          autoArchiveDuration: 1440,
          type: 12,
          invitable: false,
          reason: `Roadmap question from ${member.user.tag}`,
        });

        await thread.members.add(member.user.id);
        const allMembers = await guild.members.fetch();
        for (const m of allMembers.values()) {
          if (m.user.bot) continue;
          if (STAFF_ROLE_IDS.some(id => m.roles.cache.has(id))) {
            await thread.members.add(m.id).catch(() => {});
          }
        }

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`close_question_${member.user.id}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Secondary),
        );

        await thread.send({
          content: `<@${member.user.id}> — ask your question. A staff member will respond.\n\nStaff: <@&${STAFF_ROLE_IDS[0]}> <@&${STAFF_ROLE_IDS[1]}>`,
          components: [closeRow],
        });

        return interaction.editReply({ content: `Thread opened: ${thread}` });
      }

      // ── Close question thread ──
      if (customId.startsWith('close_question')) {
        await interaction.deferReply({ ephemeral: true });
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        const targetUserId = customId.split('_')[2];
        const isOwner = interaction.user.id === targetUserId;
        if (!isStaff && !isOwner) return interaction.editReply({ content: 'Only staff or thread owner can close.' });
        await interaction.editReply({ content: 'Closing...' });
        await interaction.channel.delete().catch(() => {});
      }

      // ── Open ticket — show intake modal first ──
      if (customId === 'open_ticket') {
        const hasVolume = Object.values(VOLUME_ROLES).some(v => member.roles.cache.has(v.id));
        if (hasVolume) return interaction.reply({ content: 'You already have a role assigned.', ephemeral: true });

        const rolesCh = guild.channels.cache.get(ROLES_CH_ID);
        const existing = rolesCh?.threads.cache.find(
          t => t.name === `ticket-${member.user.username}` && !t.archived
        );
        if (existing) return interaction.reply({ content: `You already have an open ticket: ${existing}`, ephemeral: true });

        const modal = new ModalBuilder()
          .setCustomId('access_intake_modal')
          .setTitle('Access Application');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('intake_journey')
              .setLabel('Your trading journey & biggest struggle')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(500)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('intake_learner')
              .setLabel('Scale 1-10: How fast of a learner are you?')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(2)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('intake_invest')
              .setLabel('Willing to invest in learning? (Min $150)')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(20)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('intake_referred')
              .setLabel('Referred by? (optional)')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setMaxLength(100)
          ),
        );

        return interaction.showModal(modal);
      }

      // ── Assign volume role ──
      if (customId.startsWith('assign_vol')) {
        await interaction.deferReply({ ephemeral: true });

        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.editReply({ content: 'Only staff can assign roles.' });

        const parts = customId.split('_');
        // format: assign_vol_vol1_USERID → parts[2]=vol1, parts[3]=USERID
        const assignVolKeyMap = { vol1: 'Vol I', vol2: 'Vol II', vol3: 'Vol III', vol4: 'Vol IV' };
        const volKey = assignVolKeyMap[parts[2]] || 'Vol III';
        const targetUserId = parts[3];
        const roleId = VOLUME_ROLES[volKey].id;

        const targetMember = await guild.members.fetch(targetUserId).catch(() => null);
        if (!targetMember) return interaction.editReply({ content: 'Member not found.' });

        await targetMember.roles.remove(PENDING_ROLE_ID).catch(() => {});
        await targetMember.roles.add(roleId);
        await targetMember.roles.add(MENTEE_ROLE_ID);

        await interaction.channel.send(
          `✅ <@${targetUserId}> assigned **${volKey}** by <@${interaction.user.id}>. Welcome.`
        );

        try {
          const generalCh = guild.channels.cache.get(GENERAL_CH_ID);
          if (generalCh) await generalCh.send(`@everyone Welcome In Our New Member <@${targetUserId}>`);
        } catch (e) { console.warn('General welcome announce error:', e.message); }

        // Post welcome card now that member is approved
        try {
          const welcomeCh = guild.channels.cache.get(WELCOME_CH_ID);
          if (welcomeCh) {
            const cardBuffer = await buildWelcomeCard(targetMember, guild.memberCount);
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });
            const welcomeEmbed = new EmbedBuilder()
              .setColor(0x0a0a0a)
              .setDescription(
                `## Congrats, <@${targetUserId}> 🎉\n\n` +
                `You're officially part of the mentorship. **${volKey}** access granted.\n\n` +
                `The market is engineered — now you learn the engineering.`
              )
              .setImage('attachment://welcome.png')
              .setFooter({ text: 'The Smart Money Paradigm  ·  Welcome to the family.' });
            await welcomeCh.send({ embeds: [welcomeEmbed], files: [attachment] });
          }
        } catch (e) { console.warn('Welcome card error:', e.message); }

        await interaction.editReply({ content: `Done. ${volKey} assigned.` });
        setTimeout(async () => {
          await _saveTicketTranscript(interaction.channel, `${interaction.user.tag} (assigned ${volKey})`);
          await interaction.channel.delete().catch(() => {});
        }, 3000);
      }

      // ── Grant volume role (web-purchase ticket flow) ──
      // Web "Join Now" buttons open a ticket via the smp-join Cloudflare Worker,
      // which builds Vol I-IV buttons with customId grant_v1/v2/v3/v4 and stamps
      // the ticket owner into the channel topic ("{tier} enrollment — user {id}")
      // instead of the customId suffix that native assign_vol* tickets use.
      // These clicks used to go nowhere once the worker's interactions_endpoint_url
      // was unregistered (fixed the gateway-vs-HTTP conflict) — nothing was left to
      // answer them, so Discord always timed out with "application didn't respond".
      if (customId.startsWith('grant_v')) {
        await interaction.deferReply({ ephemeral: true });

        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.editReply({ content: 'Only staff can assign roles.' });

        const topicMatch = /^(.*) enrollment — user (\d+)$/.exec(interaction.channel.topic || '');
        if (!topicMatch) return interaction.editReply({ content: 'Could not identify the ticket owner (topic missing/edited).' });
        const targetUserId = topicMatch[2];

        const tierKey = customId.replace('grant_', ''); // v1/v2/v3/v4
        const volKeyMap = { v1: 'Vol I', v2: 'Vol II', v3: 'Vol III', v4: 'Vol IV' };
        const volKey = volKeyMap[tierKey];
        const roleId = VOLUME_ROLES[volKey]?.id;

        const targetMember = await guild.members.fetch(targetUserId).catch(() => null);
        if (!targetMember) return interaction.editReply({ content: 'Member not found.' });

        await targetMember.roles.remove(PENDING_ROLE_ID).catch(() => {});
        if (roleId) await targetMember.roles.add(roleId);
        await targetMember.roles.add(MENTEE_ROLE_ID);

        await interaction.channel.send(
          `✅ <@${targetUserId}> assigned **${volKey}** by <@${interaction.user.id}>.${roleId ? '' : ' (Vol IV role not yet created — Mentee only.)'} Welcome.`
        );

        try {
          const generalCh = guild.channels.cache.get(GENERAL_CH_ID);
          if (generalCh) await generalCh.send(`@everyone Welcome In Our New Member <@${targetUserId}>`);
        } catch (e) { console.warn('General welcome announce error:', e.message); }

        try {
          const welcomeCh = guild.channels.cache.get(WELCOME_CH_ID);
          if (welcomeCh) {
            const cardBuffer = await buildWelcomeCard(targetMember, guild.memberCount);
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });
            const welcomeEmbed = new EmbedBuilder()
              .setColor(0x0a0a0a)
              .setDescription(
                `## Congrats, <@${targetUserId}> 🎉\n\n` +
                `You're officially part of the mentorship. **${volKey}** access granted.\n\n` +
                `The market is engineered — now you learn the engineering.`
              )
              .setImage('attachment://welcome.png')
              .setFooter({ text: 'The Smart Money Paradigm  ·  Welcome to the family.' });
            await welcomeCh.send({ embeds: [welcomeEmbed], files: [attachment] });
          }
        } catch (e) { console.warn('Welcome card error:', e.message); }

        await interaction.editReply({ content: `Done. ${volKey} assigned.` });
        setTimeout(async () => {
          await _saveTicketTranscript(interaction.channel, `${interaction.user.tag} (assigned ${volKey})`);
          await interaction.channel.delete().catch(() => {});
        }, 3000);
      }

      // ── Close ticket ──
      if (customId.startsWith('close_ticket')) {
        await interaction.deferReply({ ephemeral: true });

        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        const targetUserId = customId.split('_')[2];
        const isOwner = interaction.user.id === targetUserId;

        if (!isStaff && !isOwner) {
          return interaction.editReply({ content: 'Only staff or the ticket owner can close this.' });
        }

        await interaction.editReply({ content: 'Closing ticket...' });
        await _saveTicketTranscript(interaction.channel, interaction.user.tag);
        await interaction.channel.delete().catch(() => {});
      }

      // ── Resources library: Get Access → permanent pass ──
      // Any Volume role or staff can get a pass; role check happens locally
      // (fast, native), pass storage/issuance happens via the smp-join
      // Cloudflare Worker so it survives Railway restarts (this bot's own
      // filesystem is ephemeral, KV isn't). Native gateway handler — runs
      // alongside every other button here with zero risk of the
      // interactions-endpoint conflict that broke commands earlier.
      if (customId.startsWith('resource_access_') || customId === 'get_pass') {
        await interaction.deferReply({ ephemeral: true });

        const hasVolume = Object.values(VOLUME_ROLES).some(v => member.roles.cache.has(v.id));
        const isStaffMember = STAFF_ROLE_IDS.some(id => member.roles.cache.has(id));
        const isOneOnOne = member.roles.cache.has(ONE_ON_ONE_ROLE_ID);
        if (!hasVolume && !isStaffMember && !isOneOnOne) {
          return interaction.editReply({ content: "You're not enrolled yet. Join first, then come back for your pass." });
        }

        const resource = customId.startsWith('resource_access_') ? customId.replace('resource_access_', '') : null;
        const RESOURCE_LINKS = {
          'asia-mech':      'https://smartmoneysequence.com/models/asia-mech/',
          'london-mech':    'https://smartmoneysequence.com/models/london-mech/',
          'trinity':        'https://smartmoneysequence.com/models/trinity/',
          'gbt':            'https://smartmoneysequence.com/models/gbt/',
          'news-protocols': 'https://smartmoneysequence.com/models/news-protocols/',
        };
        const RESOURCE_NAMES = { 'asia-mech': 'Asia Mech Model', 'london-mech': 'London Mech Model', 'nyam-mech': 'NYAM Mech Model', 'trinity': 'Trinity Framework', 'gbt': 'Goldbach Time & PO3 Ranges', 'model22': '22 Model Refined', 'news-protocols': 'News Protocols', 'qtmodel': 'Quarterly Theory Model' };

        if (resource === 'nyam-mech') {
          return interaction.editReply({ content: 'NYAM Mech Model is still in development — not available yet. Check back soon.' });
        }

        try {
          const r = await fetch('https://smp-join.poshop608.workers.dev/issue-pass', {
            method: 'POST',
            headers: { 'Authorization': `Bot ${process.env.TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId: interaction.user.id }),
          });
          const d = await r.json();
          if (!d.ok) return interaction.editReply({ content: 'Could not issue a pass right now — try again shortly.' });

          const link = RESOURCE_LINKS[resource] || 'https://smartmoneysequence.com/resources.html';
          const label = RESOURCE_NAMES[resource];
          await interaction.editReply({
            content:
              `Your pass:\n\`\`\`\n${d.pass}\n\`\`\`\n` +
              `_Tap/click the code block above to copy it._\n\n` +
              (label ? `Open **${label}**: ${link}\n` : `Open the Resources library: ${link}\n`) +
              `Enter your pass there — it unlocks every model, permanently, on any device.\n\n` +
              `_Don't share it — this pass is tied to your account._`,
          });
        } catch (e) {
          console.error('[resource access] issue-pass failed:', e.message);
          await interaction.editReply({ content: 'Could not reach the pass service — try again shortly.' });
        }
      }

      // ── Video access request: topic pick (GB Time / PO3 Ranges) ──
      // Thread is created by the smp-join worker when someone picks "Videos" on
      // the GBT resource page. This button lives inside that thread — requester
      // picks a series, bot shows an Approve button to Founders. No auto-grant:
      // videos are copyright-sensitive, staff manually approves every request.
      if (customId.startsWith('video_pick_gbtime_') || customId.startsWith('video_pick_po3_')) {
        await interaction.deferReply();

        const isGbTime = customId.startsWith('video_pick_gbtime_');
        const requesterId = customId.replace(isGbTime ? 'video_pick_gbtime_' : 'video_pick_po3_', '');
        if (interaction.user.id !== requesterId) {
          return interaction.editReply({ content: 'Only the person who requested access can pick a series.' });
        }

        const seriesLabel = isGbTime ? 'GB Time' : 'PO3 Ranges';
        const seriesKey = isGbTime ? 'gbtime' : 'po3';

        await interaction.editReply({
          content: `<@&${STAFF_ROLE_IDS[0]}> — <@${requesterId}> requested **${seriesLabel}** videos. Approve to send the Drive link.`,
          components: [{
            type: 1,
            components: [
              { type: 2, style: 3, label: 'Approve', custom_id: `video_approve_${seriesKey}_${requesterId}` },
            ],
          }],
        });
      }

      // ── Video access request: Founder approval ──
      if (customId.startsWith('video_approve_')) {
        await interaction.deferReply();

        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.editReply({ content: 'Only staff can approve this.' });

        const parts = customId.split('_'); // video_approve_<key>_<userId>
        const seriesKey = parts[2];
        const requesterId = parts[3];

        // Placeholder until the real Drive links are provided — update these.
        const VIDEO_DRIVE_LINKS = {
          gbtime: 'https://drive.google.com/drive/folders/1Hj2fUcis953mBWRBQ6nL_aiy_al2vj8Q?usp=drive_link',
          po3: 'https://drive.google.com/drive/folders/1d5sGeSKNkGMfTWpI0eQMzEZ-R9epS8hL?usp=drive_link',
          model22: 'https://1drv.ms/f/c/347c2f5edb3cd159/IgAgsivVreIsQYmvNWCmIFfKAazhNEpTC0suSGFWRMRAVxg?e=503cOV',
          qtmodel: 'https://drive.google.com/drive/folders/1zyNgFx6CYKlT4JLireZ9NgFcyu38q1Z_?usp=drive_link',
        };
        const VIDEO_SERIES_LABELS = { gbtime: 'GB Time', po3: 'PO3 Ranges', model22: '22 Model Refined', qtmodel: 'Quarterly Theory Model' };
        const seriesLabel = VIDEO_SERIES_LABELS[seriesKey] || seriesKey;
        const link = VIDEO_DRIVE_LINKS[seriesKey];

        if (!link) {
          return interaction.editReply({
            content: `⚠️ No Drive link is set for **${seriesLabel}** yet. Staff: add it in the code, then paste it here manually for now.`,
            components: [{
              type: 1,
              components: [
                { type: 2, style: 4, label: 'Close Ticket', custom_id: `video_close_${requesterId}` },
              ],
            }],
          });
        }

        let dmSent = true;
        try {
          const requesterMember = await interaction.guild.members.fetch(requesterId);
          await requesterMember.send(`✅ Your **${seriesLabel}** request was approved — here's the link: ${link}`);
        } catch (e) {
          dmSent = false;
        }

        await interaction.editReply({
          content: dmSent
            ? `✅ Approved by <@${interaction.user.id}>. DM sent to <@${requesterId}> with the **${seriesLabel}** link.`
            : `⚠️ Approved by <@${interaction.user.id}>, but could not DM <@${requesterId}> (DMs likely closed). Send it manually: ${link}`,
          components: [{
            type: 1,
            components: [
              { type: 2, style: 4, label: 'Close Ticket', custom_id: `video_close_${requesterId}` },
            ],
          }],
        });
      }

      // ── Video access request: close, no transcript needed ──
      if (customId.startsWith('video_close_')) {
        await interaction.deferReply();

        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        const requesterId = customId.replace('video_close_', '');
        const isOwner = interaction.user.id === requesterId;
        if (!isStaff && !isOwner) {
          return interaction.editReply({ content: 'Only staff or the requester can close this.' });
        }

        await interaction.editReply({ content: 'Closing…' });
        await interaction.channel.delete().catch(() => {});
      }

      // ── Daily opening-range poll: cast/change vote ──
      if (customId.startsWith('orpoll_vote_')) {
        if (!orPollState || interaction.message.id !== orPollState.messageId) {
          return interaction.reply({ content: 'This poll has closed.', ephemeral: true });
        }
        const choice = customId.replace('orpoll_vote_', '');
        orPollState.votes.set(interaction.user.id, choice);

        const row = new ActionRowBuilder().addComponents(
          OR_POLL_OPTIONS.map(opt =>
            new ButtonBuilder().setCustomId(`orpoll_vote_${opt.key}`).setLabel(opt.label).setEmoji(opt.emoji).setStyle(ButtonStyle.Secondary)
          )
        );
        await interaction.update({ embeds: [_orPollEmbed(orPollState.votes, false)], components: [row] });
      }

      // ── Live-stream Join VC button ──
      if (customId === 'stream_join_click') {
        if (!activeStream || interaction.message.id !== activeStream.messageId) {
          return interaction.reply({ content: 'This stream has ended.', ephemeral: true });
        }

        const member = interaction.member;

        // The host never needs to click — they can join/leave the VC freely
        // at any time, no quota use, no lock-in.
        if (member.id === activeStream.hostId) {
          return interaction.reply({ content: `You're hosting this stream — no need to click, join <#${activeStream.vcId}> whenever you're ready.`, ephemeral: true });
        }

        // Already clicked — no switching, no double-counting, just let them
        // know they're already in.
        if (activeStream.clickedUserIds.has(member.id)) {
          return interaction.reply({ content: `You're already locked in for this stream — head to <#${activeStream.vcId}>.`, ephemeral: true });
        }

        const unlimited = _streamIsUnlimited(member);
        if (!unlimited) {
          const limit = _streamBaseLimit(member) + _streamBonus(member.id);
          const used = _streamJoinCount(member.id);
          if (used >= limit) {
            return interaction.reply({
              content: `You've used your ${limit}/${limit} streams this week. Quota resets Sunday 00:00 ET. ` +
                `If it's an emergency, contact the owner — or ask about a higher volume tier for more streams.`,
              ephemeral: true,
            });
          }
        }

        activeStream.clickedUserIds.add(member.id);
        if (!unlimited) _streamRecordJoin(member.id);

        const updatedEmbed = _streamEmbed({
          hostId: activeStream.hostId,
          vcName: activeStream.vcName,
          startedAt: activeStream.startedAt,
          joined: activeStream.clickedUserIds.size,
        });
        interaction.message.edit({ embeds: [updatedEmbed] }).catch(() => {});

        const usedNow = unlimited ? null : _streamJoinCount(member.id);
        const limitNow = unlimited ? null : _streamBaseLimit(member) + _streamBonus(member.id);
        return interaction.reply({
          content: unlimited
            ? `✅ You're in — head to <#${activeStream.vcId}>.`
            : `✅ You're in — head to <#${activeStream.vcId}>. (${usedNow}/${limitNow} this week)`,
          ephemeral: true,
        });
      }

      // ── Cancel Stream button — staff only ──
      if (customId.startsWith('stream_cancel_')) {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) {
          return interaction.reply({ content: 'Only staff can cancel a stream.', ephemeral: true });
        }
        if (!activeStream || interaction.message.id !== activeStream.messageId) {
          return interaction.reply({ content: 'This stream has already ended.', ephemeral: true });
        }

        const hostId = activeStream.hostId;
        activeStream = null;
        const cancelledEmbed = EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0x6b7280)
          .setTitle('🛑 Stream Cancelled')
          .setDescription(`Cancelled by <@${interaction.user.id}>. No sessions were counted.`);
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('stream_join_ended').setLabel('Stream Cancelled').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );
        return interaction.update({ embeds: [cancelledEmbed], components: [disabledRow] });
      }

      // ── End Stream button — staff only. Locks in a session for whoever
      // clicks it (unless it's the host, who's exempt from the quota) and
      // marks the stream officially over. ──
      if (customId.startsWith('stream_end_')) {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) {
          return interaction.reply({ content: 'Only staff can end a stream.', ephemeral: true });
        }
        if (!activeStream || interaction.message.id !== activeStream.messageId) {
          return interaction.reply({ content: 'This stream has already ended.', ephemeral: true });
        }

        const member = interaction.member;
        const isHost = member.id === activeStream.hostId;
        if (!isHost && !activeStream.clickedUserIds.has(member.id)) {
          const unlimited = _streamIsUnlimited(member);
          activeStream.clickedUserIds.add(member.id);
          if (!unlimited) _streamRecordJoin(member.id);
        }

        const endedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0x4ade80)
          .setTitle('✅ Stream Ended')
          .setDescription(`Ended by <@${interaction.user.id}>. ${activeStream.clickedUserIds.size} member(s) locked in this stream.`);
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('stream_join_ended').setLabel('Stream Ended').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );

        const finishedEntry = _streamFinalizeAndLog(activeStream);
        activeStream = null;
        await interaction.update({ embeds: [endedEmbed], components: [disabledRow] });

        // Auto-post this stream's history summary — same format as
        // /stream-history — so staff don't have to run it manually every time.
        const historyCh = interaction.guild.channels.cache.get(STREAM_ANNOUNCE_CH_ID);
        if (historyCh) {
          const summaryEmbed = await _streamHistoryEmbed(interaction.guild, finishedEntry);
          await historyCh.send({ embeds: [summaryEmbed] }).catch(() => {});
        }
        return;
      }

      // ── /dropsignal: "Level" path — jumps straight to the quick modal. ──
      if (customId === 'dropsignal_pick_level') {
        signalDrafts.set(interaction.user.id, { kind: 'level' });
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('dropsignal_asset_NQ').setLabel('NQ').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('dropsignal_asset_ES').setLabel('ES').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('dropsignal_asset_GOLD').setLabel('GOLD').setStyle(ButtonStyle.Primary),
        );
        return interaction.update({ content: 'Which asset?', components: [row] });
      }

      // ── /dropsignal: "Signal" path — step 1, pick the asset. ──
      if (customId === 'dropsignal_pick_signal') {
        signalDrafts.set(interaction.user.id, { kind: 'signal' });
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('dropsignal_asset_NQ').setLabel('NQ').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('dropsignal_asset_ES').setLabel('ES').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('dropsignal_asset_GOLD').setLabel('GOLD').setStyle(ButtonStyle.Primary),
        );
        return interaction.update({ content: 'Which asset?', components: [row] });
      }

      // ── /dropsignal: "Signal" path — step 2, pick the asset then direction. ──
      if (customId.startsWith('dropsignal_asset_')) {
        const draft = signalDrafts.get(interaction.user.id);
        if (!draft) return interaction.update({ content: 'That signal draft expired — run /dropsignal again.', components: [] });
        draft.asset = customId.replace('dropsignal_asset_', '');

        // "Level" path: asset picked, now go straight to the level+note modal
        // (no Buy/Sell/Stop/TP — that's the "Signal" path's structured flow).
        if (draft.kind === 'level') {
          const modal = new ModalBuilder()
            .setCustomId('dropsignal_modal')
            .setTitle(`Drop a Signal — ${draft.asset}`);
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('sig_level').setLabel('Level').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. 21500')
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('sig_note').setLabel('Note (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder('e.g. strong displacement / algo signature')
            ),
          );
          return interaction.showModal(modal);
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('dropsignal_dir_Buy').setLabel('Buy').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('dropsignal_dir_Sell').setLabel('Sell').setStyle(ButtonStyle.Danger),
        );
        return interaction.update({ content: `**${draft.asset}** — Buy or Sell?`, components: [row] });
      }

      // ── /dropsignal: "Signal" path — step 3, direction picked. Posts
      // immediately with Stop/TP marked "Pending" so the signal is live with
      // no delay — Stop/TP are added a few seconds later via the "Add Stop
      // & TP" button on the posted message, instead of blocking the initial
      // post on typing them into a modal first. ──
      if (customId.startsWith('dropsignal_dir_')) {
        const draft = signalDrafts.get(interaction.user.id);
        if (!draft) return interaction.update({ content: 'That signal draft expired — run /dropsignal again.', components: [] });
        draft.direction = customId.replace('dropsignal_dir_', '');

        await interaction.update({ content: 'Sending…', components: [] });

        const msg = await _postSignal(interaction.guild, interaction.user, {
          level: 'Pending',
          note: null,
          asset: draft.asset,
          direction: draft.direction,
          stop: null,
          extraFields: [
            { name: 'Asset', value: draft.asset, inline: true },
            { name: 'Direction', value: draft.direction, inline: true },
            { name: 'Stop', value: 'Pending', inline: true },
          ],
          addStopTpButton: true,
        });
        signalDrafts.delete(interaction.user.id);

        return interaction.editReply({
          content: msg ? 'Signal dropped — add Stop & TP from the message when ready.' : 'Could not post the signal — check the signals channel exists.',
        });
      }

      // ── /dropsignal: Add Stop & TP after the fact — button lives on the
      // just-posted message, only the poster can use it. messageId is
      // threaded through the modal's custom_id since a modal-submit
      // interaction doesn't carry interaction.message the way this button
      // click does — this is the only chance to capture it. ──
      if (customId.startsWith('dropsignal_addstoptp_')) {
        const signalId = customId.replace('dropsignal_addstoptp_', '');
        const posterId = signalId.split('_').pop();
        if (interaction.user.id !== posterId) {
          return interaction.reply({ content: 'Only the person who dropped this signal can add Stop & TP.', ephemeral: true });
        }

        const modal = new ModalBuilder()
          .setCustomId(`dropsignal_stoptp_modal|${signalId}|${interaction.message.id}`)
          .setTitle('Add Stop & TP');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('sig_stop').setLabel('Stop (time reference)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. 9:40 high or 9:03 low')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('sig_tp').setLabel('TP (price)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. 21550')
          ),
        );
        return interaction.showModal(modal);
      }

      if (customId === 'dropsignal_cancel') {
        signalDrafts.delete(interaction.user.id);
        return interaction.update({ content: 'Cancelled.', embeds: [], components: [] });
      }

      // ── Custom-model access request: Approve/Decline. These buttons are
      // posted by the Worker (into a Discord ticket channel) but Discord
      // routes the actual click back to the bot's gateway connection, not
      // the Worker's HTTP /interactions — so the real handler lives here,
      // calling the Worker's bot-only model endpoints server-to-server.
      // Creator-only (checked against the model's own creatorId, not a
      // Discord role), matching "any student can create a model" spec. ──
      if (customId.startsWith('model_approve|') || customId.startsWith('model_decline|')) {
        const [action, modelId, requesterId] = customId.split('|');
        const approve = action === 'model_approve';

        await interaction.deferReply({ ephemeral: true });

        try {
          const r = await fetch('https://smp-join.poshop608.workers.dev/bot/models/get', {
            method: 'POST',
            headers: { 'Authorization': `Bot ${process.env.TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: modelId }),
          });
          const d = await r.json();
          if (!d.ok) return interaction.editReply({ content: 'Could not find that model — it may have been deleted.' });

          const model = d.model;
          if (model.creatorId !== interaction.user.id) {
            return interaction.editReply({ content: 'Only the model creator can resolve this.' });
          }

          if (approve) {
            await fetch('https://smp-join.poshop608.workers.dev/bot/models/grant', {
              method: 'POST',
              headers: { 'Authorization': `Bot ${process.env.TOKEN}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: modelId, requesterId }),
            });
          }

          // DM the requester since the ticket channel is about to be
          // deleted — no transcript, no lingering channel, per spec.
          const requesterMember = await interaction.guild.members.fetch(requesterId).catch(() => null);
          if (requesterMember) {
            await requesterMember.send(
              approve
                ? `✅ You've been approved for **${model.name}** — check the Custom Models tab on the site.`
                : `❌ Your request for **${model.name}** was declined.`
            ).catch(() => {});
          }

          await interaction.editReply({ content: 'Done — closing this ticket.' });
          setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
          return;
        } catch (e) {
          console.error('[model approve/decline] failed:', e.message);
          return interaction.editReply({ content: 'Something went wrong — try again.' });
        }
      }

      // ── Signal outcome buttons — only the person who dropped the signal
      // can resolve it. signalId is formatted "sig_<timestamp>_<userId>", so
      // the poster's ID is recovered directly from it rather than needing a
      // second lookup. "|" is the field separator (see dropsignal_modal). ──
      if (customId.startsWith('signal_outcome|')) {
        const [, signalId, outcome] = customId.split('|');
        const posterId = signalId.split('_').pop();
        if (interaction.user.id !== posterId) {
          return interaction.reply({ content: 'Only the person who dropped this signal can resolve it.', ephemeral: true });
        }

        await interaction.deferUpdate();

        const outcomeLabel = { W: '✅ Win', L: '❌ Loss', criteria_not_met: '⚠️ Criteria Not Met' }[outcome] || outcome;
        const oldEmbed = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(oldEmbed).setFields(
          (oldEmbed.fields || []).map(f => f.name === 'Outcome' ? { name: 'Outcome', value: outcomeLabel, inline: true } : f)
        );
        await interaction.message.edit({ embeds: [updatedEmbed], components: [] }).catch(() => {});

        try {
          await fetch('https://smp-join.poshop608.workers.dev/bot/signals/outcome', {
            method: 'POST',
            headers: { 'Authorization': `Bot ${process.env.TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: signalId, outcome }),
          });
        } catch (e) {
          console.error('[signal outcome] web update failed:', e.message);
        }
        return;
      }

      // ── Force-cancel a stuck stream from /host-stream's conflict prompt,
      // then immediately post the new stream announcement the user wanted. ──
      if (customId.startsWith('stream_force_cancel_')) {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferUpdate();

        const newVcId = customId.replace('stream_force_cancel_', '');

        // Best-effort: mark the old announcement as cancelled if it still exists.
        if (activeStream) {
          const oldAnnounceCh = interaction.guild.channels.cache.get(STREAM_ANNOUNCE_CH_ID);
          const oldMsg = oldAnnounceCh ? await oldAnnounceCh.messages.fetch(activeStream.messageId).catch(() => null) : null;
          if (oldMsg) {
            const cancelledEmbed = EmbedBuilder.from(oldMsg.embeds[0])
              .setColor(0x6b7280)
              .setTitle('🛑 Stream Cancelled')
              .setDescription(`Cancelled by <@${interaction.user.id}> to start a new stream. No sessions were counted.`);
            const disabledRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('stream_join_ended').setLabel('Stream Cancelled').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );
            await oldMsg.edit({ embeds: [cancelledEmbed], components: [disabledRow] }).catch(() => {});
          }
        }
        activeStream = null;

        // Now post the new stream announcement.
        const newVc = interaction.guild.channels.cache.get(newVcId);
        const announceCh = interaction.guild.channels.cache.get(STREAM_ANNOUNCE_CH_ID);
        if (!newVc || !announceCh) {
          return interaction.editReply({ content: 'Old stream cancelled, but could not start the new one — channel not found. Run /host-stream again.', components: [] });
        }

        const newEmbed = _streamEmbed({ hostId: interaction.user.id, vcName: newVc.name, startedAt: new Date(), joined: 0 });

        const newRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('stream_join_click').setLabel('Join VC').setEmoji('🔊').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`stream_cancel_${interaction.user.id}`).setLabel('Cancel Stream').setEmoji('🛑').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`stream_end_${interaction.user.id}`).setLabel('End Stream').setEmoji('⏹️').setStyle(ButtonStyle.Secondary)
        );

        const newMsg = await announceCh.send({ embeds: [newEmbed], components: [newRow] }).catch(() => null);
        if (!newMsg) {
          return interaction.editReply({ content: 'Old stream cancelled, but could not post the new announcement. Run /host-stream again.', components: [] });
        }

        activeStream = { vcId: newVc.id, vcName: newVc.name, messageId: newMsg.id, hostId: interaction.user.id, startedAt: new Date(), clickedUserIds: new Set(), vcTimes: new Map() };
        return interaction.editReply({ content: `✅ Old stream cancelled. New stream announcement posted in <#${STREAM_ANNOUNCE_CH_ID}>, tracking joins for <#${newVc.id}>.`, components: [] });
      }
    }

    // ── Modal submit — access intake ──
    if (interaction.isModalSubmit() && interaction.customId === 'access_intake_modal') {
      await interaction.deferReply({ ephemeral: true });

      const { guild, member } = interaction;
      const journey  = interaction.fields.getTextInputValue('intake_journey');
      const learner  = interaction.fields.getTextInputValue('intake_learner');
      const invest   = interaction.fields.getTextInputValue('intake_invest');
      const referred = interaction.fields.getTextInputValue('intake_referred') || 'N/A';

      // Double-check no existing open ticket in roles channel
      const rolesCh = guild.channels.cache.get(ROLES_CH_ID);
      if (!rolesCh) return interaction.editReply({ content: 'Roles channel not found. Contact staff.' });

      const existing = rolesCh.threads.cache.find(
        t => t.name === `ticket-${member.user.username}` && !t.archived
      );
      if (existing) return interaction.editReply({ content: `You already have an open ticket: ${existing}` });

      // Create private thread in #roles so pending user can see it
      const thread = await rolesCh.threads.create({
        name: `ticket-${member.user.username}`,
        autoArchiveDuration: 10080,
        type: 12, // GUILD_PRIVATE_THREAD
        invitable: false,
        reason: `Access application from ${member.user.tag}`,
      });

      await thread.members.add(member.user.id);
      const allMembers = await guild.members.fetch();
      for (const m of allMembers.values()) {
        if (m.user.bot) continue;
        if (STAFF_ROLE_IDS.some(id => m.roles.cache.has(id))) {
          await thread.members.add(m.id).catch(() => {});
        }
      }

      const intakeEmbed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle(`📋 Access Application — ${member.user.username}`)
        .addFields(
          { name: 'Trading Journey & Struggle', value: journey },
          { name: 'Learner Score (1-10)', value: learner, inline: true },
          { name: 'Willing to Invest?', value: invest, inline: true },
          { name: 'Referred By', value: referred, inline: true },
        )
        .setFooter({ text: `User ID: ${member.user.id}` })
        .setTimestamp();

      const volRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`assign_vol_vol1_${member.user.id}`).setLabel('Vol I').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`assign_vol_vol2_${member.user.id}`).setLabel('Vol II').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`assign_vol_vol3_${member.user.id}`).setLabel('Vol III').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`assign_vol_vol4_${member.user.id}`).setLabel('Vol IV').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`close_ticket_${member.user.id}`).setLabel('Close').setStyle(ButtonStyle.Danger),
      );

      await thread.send({
        content: `<@&${STAFF_ROLE_IDS[0]}> <@&${STAFF_ROLE_IDS[1]}> — new access application from <@${member.user.id}>`,
        embeds: [intakeEmbed],
        components: [volRow],
      });

      return interaction.editReply({ content: `Your application has been submitted. Staff will review it shortly.` });
    }

    // ── Modal submit — drop a signal ──
    if (interaction.isModalSubmit() && interaction.customId === 'dropsignal_modal') {
      await interaction.deferReply({ ephemeral: true });

      const level = interaction.fields.getTextInputValue('sig_level');
      const note = interaction.fields.getTextInputValue('sig_note') || null;
      const draft = signalDrafts.get(interaction.user.id);
      const asset = draft?.asset || null;
      signalDrafts.delete(interaction.user.id);

      const msg = await _postSignal(interaction.guild, interaction.user, { level, note, asset });
      if (!msg) return interaction.editReply({ content: 'Could not post the signal — check the signals channel exists.' });

      return interaction.editReply({ content: 'Signal dropped.' });
    }

    // ── Signal path: Add Stop & TP modal submit — signal is already live
    // (posted the instant asset+direction were picked), this just patches
    // the existing message's Stop/Level(TP) fields and removes the button,
    // instead of holding the whole signal back behind a review step. ──
    if (interaction.isModalSubmit() && interaction.customId.startsWith('dropsignal_stoptp_modal|')) {
      await interaction.deferReply({ ephemeral: true });

      const [, signalId, messageId] = interaction.customId.split('|');
      const stop = interaction.fields.getTextInputValue('sig_stop');
      const tp = interaction.fields.getTextInputValue('sig_tp');

      const ch = interaction.guild.channels.cache.get(SIGNALS_CH_ID);
      const msg = ch && await ch.messages.fetch(messageId).catch(() => null);
      if (!msg) return interaction.editReply({ content: 'Could not find the original signal message — it may have been deleted.' });

      const oldEmbed = msg.embeds[0];
      const updatedEmbed = EmbedBuilder.from(oldEmbed).setFields(
        (oldEmbed.fields || []).map(f => {
          if (f.name === 'Stop') return { name: 'Stop', value: stop, inline: true };
          if (f.name === 'Take Profit') return { name: 'Take Profit', value: tp, inline: true };
          return f;
        })
      );
      const outcomeRow = msg.components[0];
      await msg.edit({ embeds: [updatedEmbed], components: outcomeRow ? [outcomeRow] : [] }).catch(() => {});

      try {
        await fetch('https://smp-join.poshop608.workers.dev/bot/signals/update', {
          method: 'POST',
          headers: { 'Authorization': `Bot ${process.env.TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: signalId, stop, level: tp }),
        });
      } catch (e) {
        console.error('[dropsignal addstoptp] web update failed:', e.message);
      }

      return interaction.editReply({ content: 'Stop & TP added.' });
    }

  } catch (err) {
    console.error('Interaction error:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Something went wrong.', ephemeral: true }).catch(() => {});
    } else {
      await interaction.editReply({ content: 'Something went wrong.' }).catch(() => {});
    }
  }
});

// ── Text prefix commands ──
// Auto-hide any channel FJ NewsBot creates and update relay target
client.on(Events.ChannelCreate, async channel => {
  if (channel.type !== 0) return;
  // Check if FJ bot has an overwrite on this channel (it created it)
  await new Promise(r => setTimeout(r, 1500)); // wait for perms to settle
  const ch = channel.guild?.channels.cache.get(channel.id);
  if (!ch) return;
  const hasFJ = ch.permissionOverwrites?.cache.has(FJ_BOT_ID);
  if (!hasFJ) return;
  // Hide from everyone, allow Founder + TsmpBot
  const EVERYONE = '1469213835666657362', FOUNDER = '1469222592312377374', BOT = '1510284937159508061';
  ch.permissionOverwrites.edit(EVERYONE, { ViewChannel: false }).catch(() => {});
  ch.permissionOverwrites.edit(FOUNDER,  { ViewChannel: true  }).catch(() => {});
  ch.permissionOverwrites.edit(BOT,      { ViewChannel: true  }).catch(() => {});
  console.log('[FJ] Auto-hidden new channel:', ch.name, ch.id);
});

client.on(Events.MessageCreate, async message => {
  // Relay anything posted in #newsfeed → #macro-news (FJ posts as webhook, not bot user)
  if (message.channel.id === FJ_NEWSFEED_ID) {
    console.log(`[FJ relay] msg from FJ in #${message.channel.name} (${message.channel.id}) — embeds:${message.embeds.length} content:${!!message.content} attachments:${message.attachments.size}`);
    const target = message.guild?.channels.cache.get(MACRO_NEWS_CH_ID);
    if (!target) { console.warn('[FJ relay] macro-news channel not found'); return; }
    // Re-fetch to ensure embeds are populated (Discord may not deliver them on first event)
    let msg = message;
    if (!message.embeds.length && !message.content) {
      try { msg = await message.channel.messages.fetch(message.id); } catch {}
    }
    const opts = {};
    if (msg.embeds.length)    opts.embeds  = msg.embeds;
    if (msg.content)          opts.content = `-# via FinancialJuice\n${msg.content}`;
    if (msg.attachments.size) opts.files   = [...msg.attachments.values()].map(a => a.url);
    console.log(`[FJ relay] sending to macro-news — embeds:${(opts.embeds||[]).length} content:${!!opts.content}`);
    if (opts.embeds || opts.content || opts.files) await target.send(opts).catch(e => console.error('[FJ relay] send err:', e.message));
    return;
  }

  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const isStaff = STAFF_ROLE_IDS.some(id => message.member?.roles.cache.has(id));
  const cmd = message.content.trim().toLowerCase();

  if (cmd === '!fj-debug') {
    if (!isStaff) return;
    const lines = [];
    lines.push(`FJ_BOT_ID: \`${FJ_BOT_ID}\``);
    lines.push(`MACRO_NEWS_CH_ID: \`${MACRO_NEWS_CH_ID}\``);
    lines.push(`FJ_NEWSFEED_ID: \`${FJ_NEWSFEED_ID}\``);
    // Try to fetch last 5 messages from newsfeed channel
    const newsfeedCh = message.guild.channels.cache.get(FJ_NEWSFEED_ID);
    if (!newsfeedCh) {
      lines.push(`❌ Cannot find newsfeed channel \`${FJ_NEWSFEED_ID}\` in cache`);
    } else {
      lines.push(`✅ Newsfeed channel found: #${newsfeedCh.name}`);
      try {
        const msgs = await newsfeedCh.messages.fetch({ limit: 3 });
        lines.push(`Last ${msgs.size} messages in #newsfeed:`);
        for (const m of msgs.values()) {
          lines.push(`  author:\`${m.author.id}\` embeds:${m.embeds.length} content:${m.content?.slice(0,50)||'(none)'}`);
        }
      } catch (e) {
        lines.push(`❌ Cannot fetch messages: ${e.message}`);
      }
    }
    lines.push('**Channels bot can see (text only):**');
    for (const ch of message.guild.channels.cache.values()) {
      if (ch.type !== 0) continue;
      const hasFJ = ch.permissionOverwrites?.cache.has(FJ_BOT_ID);
      if (hasFJ) lines.push(`\`${ch.id}\` #${ch.name} ← **FJ overwrite**`);
    }
    await message.reply({ content: lines.join('\n').slice(0, 1990), allowedMentions: { repliedUser: false } });
    return;
  }

  if (cmd === '!economic-calendar') {
    if (!isStaff) return message.reply({ content: 'No permission.', allowedMentions: { repliedUser: false } });
    if (!ENV_CH_ID) return message.reply({ content: 'Run `/setup-economic-calendar` first.', allowedMentions: { repliedUser: false } });
    await message.reply({ content: 'Posting...', allowedMentions: { repliedUser: false } });
    await postEnvCalendar(message.guild).catch(e => console.error('text cmd env err:', e.message));
    return;
  }
});

// ── Join welcome card ──
async function _generateJoinCard(member) {
  const { createCanvas, loadImage } = require('@napi-rs/canvas');
  const W = 800, H = 200;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // BG — dark grey to black gradient left→right
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1a1a');
  bg.addColorStop(0.5, '#111111');
  bg.addColorStop(1, '#000000');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle top-left radial softness
  const soft = ctx.createRadialGradient(0, 0, 0, 0, 0, 400);
  soft.addColorStop(0, 'rgba(60,60,60,0.25)');
  soft.addColorStop(1, 'transparent');
  ctx.fillStyle = soft; ctx.fillRect(0, 0, W, H);

  // Top edge line — grey fade
  const topLine = ctx.createLinearGradient(0, 0, W, 0);
  topLine.addColorStop(0, 'transparent');
  topLine.addColorStop(0.3, 'rgba(180,180,180,0.25)');
  topLine.addColorStop(0.7, 'rgba(180,180,180,0.25)');
  topLine.addColorStop(1, 'transparent');
  ctx.fillStyle = topLine; ctx.fillRect(0, 0, W, 1);

  // Bottom edge line
  const botLine = ctx.createLinearGradient(0, 0, W, 0);
  botLine.addColorStop(0, 'transparent');
  botLine.addColorStop(0.3, 'rgba(80,80,80,0.2)');
  botLine.addColorStop(0.7, 'rgba(80,80,80,0.2)');
  botLine.addColorStop(1, 'transparent');
  ctx.fillStyle = botLine; ctx.fillRect(0, H - 1, W, 1);

  // Bot avatar — circle left
  const logoX = 52, logoY = H / 2, logoR = 46;
  try {
    const botAvatarURL = client.user.displayAvatarURL({ extension: 'png', size: 128 });
    const logoImg = await loadImage(botAvatarURL);
    ctx.save();
    ctx.beginPath(); ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logoImg, logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
    ctx.restore();
    // thin grey ring
    ctx.beginPath(); ctx.arc(logoX, logoY, logoR + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,200,200,0.15)'; ctx.lineWidth = 1; ctx.stroke();
  } catch (e) {}

  // Vertical divider
  const div = ctx.createLinearGradient(0, 20, 0, H - 20);
  div.addColorStop(0, 'transparent');
  div.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  div.addColorStop(1, 'transparent');
  ctx.fillStyle = div;
  ctx.fillRect(logoX + logoR + 22, 20, 1, H - 40);

  // Text
  const tx = logoX + logoR + 44;

  // Eyebrow
  ctx.fillStyle = 'rgba(180,180,180,0.45)';
  ctx.font = '500 10px monospace';
  ctx.fillText('NEW MEMBER', tx, 66);

  // Username
  const username = member.user.username.length > 18
    ? member.user.username.slice(0, 17) + '…'
    : member.user.username;
  ctx.fillStyle = '#ECECEC';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(username, tx, 120);

  // Subtext
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = '400 13px sans-serif';
  ctx.fillText('Smart Money Paradigm', tx, 150);

  // Member count pill — bottom right
  const tag = `Member #${member.guild.memberCount}`;
  ctx.font = '400 11px monospace';
  const tagW = ctx.measureText(tag).width + 22;
  const tagX = W - tagW - 20, tagY = H - 28;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath(); ctx.roundRect(tagX, tagY - 14, tagW, 22, 11); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(tag, tagX + 11, tagY + 3);

  return canvas.toBuffer('image/png');
}

// ── Auto-assign Pending + welcome on join ──
client.on(Events.GuildMemberAdd, async member => {
  try {
    await member.roles.add(PENDING_ROLE_ID);
  } catch (e) {
    console.warn('Pending role error:', e.message);
  }

  // Welcome new user in free-chat with card
  try {
    const ch = member.guild.channels.cache.get(FREE_CHAT_CH_ID);
    if (ch) {
      const card = await _generateJoinCard(member);
      const file = new AttachmentBuilder(card, { name: 'welcome.png' });
      const embed = new EmbedBuilder()
        .setColor(0x111114)
        .setDescription(`hey <@${member.id}> 👋 head to <#${ROLES_CH_ID}> and hit **Request Access** to join the mentorship.`)
        .setImage('attachment://welcome.png')
        .setFooter({ text: 'TSMP · Smart Money Paradigm' });
      await ch.send({ embeds: [embed], files: [file] });
    }
  } catch (e) {
    console.warn('Free chat welcome error:', e.message);
  }
});

client.once(Events.ClientReady, () => {
  console.log(`TsmpBot online — ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    const cal = guild.channels.cache.find(c => c.name === '📅〢economic-calendar' && c.parentId === ENV_CATEGORY_ID);
    if (cal) { ENV_CH_ID = cal.id; console.log('economic-calendar channel found:', ENV_CH_ID); }
    const eng = guild.channels.cache.find(c => c.name === '🧠〢environment-selection' && c.parentId === ENV_CATEGORY_ID);
    if (eng) { ENV_ENGINE_CH_ID = eng.id; console.log('environment-selection channel found:', ENV_ENGINE_CH_ID); }
    const tcRole = guild.roles.cache.find(r => r.name === '📡 Sweep Alerts');
    if (tcRole) { SWEEP_TC_ROLE_ID = tcRole.id; console.log('Sweep Alerts role found:', SWEEP_TC_ROLE_ID); }
    const sweepCh = guild.channels.cache.find(c => c.name === '📡〢sweep-alerts');
    if (sweepCh) { SWEEP_ALERT_CH_ID = sweepCh.id; console.log('sweep-alerts channel found:', SWEEP_ALERT_CH_ID); }
    const sweepRolesCh = guild.channels.cache.find(c => c.name === '🔔〢alert-roles');
    if (sweepRolesCh) { SWEEP_ROLES_CH_ID = sweepRolesCh.id; }
    const vcRole = guild.roles.cache.find(r => r.name === '📅 VC Alerts');
    if (vcRole) { VC_ALERT_ROLE_ID = vcRole.id; }
    const vcSchedCh = guild.channels.cache.find(c => c.name === '📅〢vc-schedule');
    if (vcSchedCh) { VC_SCHED_CH_ID = vcSchedCh.id; }

    // Lock #roles — everyone can view/read, only staff can send
    const rolesCh = guild.channels.cache.get(ROLES_CH_ID);
    if (rolesCh) {
      rolesCh.permissionOverwrites.set([
        { id: guild.roles.everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] },
        { id: STAFF_ROLE_IDS[0], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        { id: STAFF_ROLE_IDS[1], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        { id: '1510284937159508061', allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      ]).catch(() => {});
      console.log('[roles] Locked #roles perms');
    }

    // Lock #tickets to Founder only — deny everyone else including Moderator
    const ticketsCh = guild.channels.cache.get(TICKETS_CH_ID);
    if (ticketsCh) {
      ticketsCh.permissionOverwrites.set([
        { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: STAFF_ROLE_IDS[0], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] },
        { id: '1510284937159508061', allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      ]).catch(() => {});
      console.log('[tickets] Locked #tickets to Founder only');
    }

    // Ensure bot can see any channel FJ NewsBot has access to (survives restarts)
    const EVERYONE_ID = '1469213835666657362', FOUNDER_ID = '1469222592312377374', BOT_ROLE_ID = '1510284937159508061';
    for (const ch of guild.channels.cache.values()) {
      if (ch.type !== 0) continue;
      if (!ch.permissionOverwrites?.cache.has(FJ_BOT_ID)) continue;
      ch.permissionOverwrites.edit(EVERYONE_ID, { ViewChannel: false }).catch(() => {});
      ch.permissionOverwrites.edit(FOUNDER_ID,  { ViewChannel: true  }).catch(() => {});
      ch.permissionOverwrites.edit(BOT_ROLE_ID, { ViewChannel: true  }).catch(() => {});
      console.log('[FJ] Restored perms on FJ channel:', ch.name, ch.id);
    }

    // Restore VC countdown from file (survives Railway restarts)
    const saved = _vcLoad();
    if (saved && saved.startEpoch > Math.floor(Date.now() / 1000) - 30 * 60) {
      const intervalId = setInterval(() => _tickVcCountdown().catch(() => {}), 60 * 1000);
      _vcCountdown = { ...saved, intervalId };
      console.log(`VC countdown restored: ${saved.vcChannelName} at <t:${saved.startEpoch}:R>`);
    } else if (saved) {
      _vcSave(); // expired — clear file
    }
  }

  // Refresh calendar cache on startup so data is always current after each Railway deploy
  (async () => {
    for (const week of ['thisweek', 'nextweek']) {
      try {
        const events = await _fetchInvesting(week);
        if (Array.isArray(events) && events.length) {
          fs.writeFileSync(path.join(__dirname, 'data', `ff_${week}.json`), JSON.stringify(events));
          console.log(`Startup cache refresh (${week}): ${events.length} events`);
        }
      } catch (e) { console.warn(`Startup cache refresh failed (${week}): ${e.message}`); }
    }
  })();

  // NQ sweep monitor — temporarily disabled (was sending too many alerts, burning tokens fast)
  // To re-enable: uncomment below.
  // _refreshNQLevels()
  //   .then(() => _seedSweptFromCurrentPrice())
  //   .catch(e => console.warn('NQ init warning:', e?.message || String(e)));
  // setInterval(() => {
  //   _pollNQSweeps().catch(e => console.warn('sweep poll err:', e?.message || String(e)));
  // }, SWEEP_POLL_MS);
  console.log('NQ sweep monitor: DISABLED');

  // Start macro news poller — first run after 10s (let bot fully init), then every 5 min
  setTimeout(() => {
    pollMacroNews().catch(e => console.error('macro news poll err:', e.message));
    setInterval(() => {
      pollMacroNews().catch(e => console.error('macro news poll err:', e.message));
    }, MACRO_POLL_MS);
  }, 10000);
  console.log('Macro news poller started (every 5 min)');

});

// ── Express webhook server for TradingView sweep alerts ──
const app = express();
app.use(express.json());

app.post('/levels', (req, res) => {
  const { secret, ...levels } = req.body;
  if (secret !== SWEEP_WEBHOOK_SECRET) return res.status(403).json({ error: 'forbidden' });
  _pineLevels = levels;  // store all level values from Pine
  res.json({ ok: true });
});

app.post('/sweep', async (req, res) => {
  try {
    const { level, direction, price, secret, ticker } = req.body;

    if (secret !== SWEEP_WEBHOOK_SECRET) return res.status(403).json({ error: 'forbidden' });
    if (!level || !direction) return res.status(400).json({ error: 'missing level or direction' });
    if (!SWEEP_ALERT_CH_ID) return res.status(503).json({ error: 'sweep alerts not configured — run /setup-sweep-alerts' });

    const guild = client.guilds.cache.first();
    if (!guild) return res.status(503).json({ error: 'bot not ready' });
    const ch = guild.channels.cache.get(SWEEP_ALERT_CH_ID);
    if (!ch) return res.status(503).json({ error: 'alert channel not found' });

    const levelKey = level.toUpperCase();
    const labelName = LEVEL_LABELS[levelKey] || levelKey;
    const isAbove = ['above', 'swept_above', 'broken_above'].includes(direction);
    const priceVal = price ? parseFloat(price) : null;
    const priceStr = priceVal ? priceVal.toFixed(2) : null;

    // Update session H/L tracker if price provided
    if (priceVal) _tickSessionHL(isAbove ? priceVal : 0, isAbove ? 999999 : priceVal);

    const hm = _nyHM();
    const SESSION_LABELS = { asia: 'Asia (18:00–00:00)', london: 'London (00:00–07:00)', nyam: 'NY Morning (07:00–11:30)', nypm: 'NY Afternoon (11:30–16:00)' };
    const curSess = hm >= 1080 ? 'asia' : hm < 420 ? 'london' : hm < 690 ? 'nyam' : hm < 960 ? 'nypm' : null;
    const sessLabel = SESSION_LABELS[curSess] || '—';

    const color = isAbove ? 0x22d3ee : 0xf87171;
    const arrow = isAbove ? '🔺' : '🔻';
    const dirWord = isAbove ? 'Swept **Above**' : 'Swept **Below**';
    const title = `${arrow}  NQ — **${labelName}** ${dirWord}`;

    const nyTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York'
    });

    const desc = [
      `${arrow} **${labelName}** — ${isAbove ? 'swept **above**' : 'swept **below**'}${priceStr ? ` at \`${priceStr}\`` : ''}`,
      ``,
      `> 💰 **Current Price** — ${priceStr ? `\`${priceStr}\`` : '—'}`,
      `> 🕐 **Session** — ${sessLabel}`,
      `> 🗓️ **Time** — ${nyTime} ET`,
    ].join('\n');

    const rolePings = [];
    if (SWEEP_TC_ROLE_ID) rolePings.push(`<@&${SWEEP_TC_ROLE_ID}>`);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(desc)
      .setTimestamp()
      .setFooter({ text: 'The Smart Money Paradigm  ·  NQ Sweep Alert  ·  ⚠️ ~10 min delay' });

    await ch.send({ content: rolePings.join(' ') || undefined, embeds: [embed] });
    console.log(`Webhook sweep: ${levelKey} ${direction} @ ${priceStr}`);
    res.json({ ok: true });
  } catch (e) {
    console.error('Sweep webhook error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (_, res) => res.json({ ok: true, bot: client.user?.tag || 'starting' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server listening on port ${PORT}`));

// ══════════════════════════════════════════════════════
// MOD LOG — all server audit events
// ══════════════════════════════════════════════════════

function _mlCh(guild) {
  if (!MOD_LOG_CH_ID) return null;
  return guild?.channels.cache.get(MOD_LOG_CH_ID) || null;
}
function _mlSend(guild, embed) {
  const ch = _mlCh(guild);
  if (ch) ch.send({ embeds: [embed] }).catch(() => {});
}
function _mlEmbed(color, title, fields, user) {
  const e = new EmbedBuilder().setColor(color).setTitle(title).setTimestamp();
  if (fields.length) e.addFields(fields);
  if (user) e.setFooter({ text: `User ID: ${user.id}`, iconURL: user.displayAvatarURL?.() });
  return e;
}

// Message deleted
// Auto-cancel the active stream if its announcement message gets deleted —
// separate listener from mod-log below since that one skips bot-authored
// messages, and the stream announcement is posted by the bot itself.
client.on(Events.MessageDelete, msg => {
  if (activeStream && msg.id === activeStream.messageId) {
    activeStream = null;
  }
});

client.on(Events.MessageDelete, async msg => {
  if (!MOD_LOG_CH_ID || msg.author?.bot) return;
  const embed = _mlEmbed(0xef4444, '🗑️ Message Deleted', [
    { name: 'Author', value: msg.author ? `<@${msg.author.id}> (${msg.author.tag})` : 'Unknown', inline: true },
    { name: 'Channel', value: `<#${msg.channelId}>`, inline: true },
    { name: 'Content', value: msg.content?.slice(0, 1000) || '*(no text — possibly embed/attachment)*' },
  ], msg.author);
  _mlSend(msg.guild, embed);
});

// Message edited
client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
  if (!MOD_LOG_CH_ID || newMsg.author?.bot) return;
  if (oldMsg.content === newMsg.content) return;
  const embed = _mlEmbed(0xf59e0b, '✏️ Message Edited', [
    { name: 'Author', value: `<@${newMsg.author.id}> (${newMsg.author.tag})`, inline: true },
    { name: 'Channel', value: `<#${newMsg.channelId}>`, inline: true },
    { name: 'Jump', value: `[View Message](${newMsg.url})`, inline: true },
    { name: 'Before', value: oldMsg.content?.slice(0, 500) || '*(unknown)*' },
    { name: 'After', value: newMsg.content?.slice(0, 500) || '*(empty)*' },
  ], newMsg.author);
  _mlSend(newMsg.guild, embed);
});

// Member join
client.on(Events.GuildMemberAdd, member => {
  if (!MOD_LOG_CH_ID) return;
  const created = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`;
  const embed = _mlEmbed(0x22c55e, '📥 Member Joined', [
    { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
    { name: 'Account Created', value: created, inline: true },
    { name: 'Member Count', value: String(member.guild.memberCount), inline: true },
  ], member.user);
  _mlSend(member.guild, embed);
});

// Member leave
client.on(Events.GuildMemberRemove, member => {
  if (!MOD_LOG_CH_ID) return;
  const roles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.name).join(', ') || 'None';
  const embed = _mlEmbed(0xf87171, '📤 Member Left', [
    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
    { name: 'Roles', value: roles.slice(0, 500) },
  ], member.user);
  _mlSend(member.guild, embed);
});

// Member update — roles added/removed, nickname change, timeout
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (!MOD_LOG_CH_ID) return;
  const fields = [];

  // Nickname
  if (oldMember.nickname !== newMember.nickname) {
    fields.push({ name: 'Nickname Before', value: oldMember.nickname || '*(none)*', inline: true });
    fields.push({ name: 'Nickname After', value: newMember.nickname || '*(removed)*', inline: true });
  }

  // Roles added
  const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
  if (added.size) fields.push({ name: 'Roles Added', value: added.map(r => `<@&${r.id}>`).join(', ') });

  // Roles removed
  const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
  if (removed.size) fields.push({ name: 'Roles Removed', value: removed.map(r => `<@&${r.id}>`).join(', ') });

  // Timeout
  const wasTimedOut = !!oldMember.communicationDisabledUntil;
  const isTimedOut  = !!newMember.communicationDisabledUntil;
  if (!wasTimedOut && isTimedOut) fields.push({ name: 'Timeout Applied', value: `Until <t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>` });
  if (wasTimedOut && !isTimedOut) fields.push({ name: 'Timeout Removed', value: 'Member timed-out status cleared' });

  if (!fields.length) return;
  fields.unshift({ name: 'User', value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true });

  // Try to find who made the change via audit log
  try {
    await new Promise(r => setTimeout(r, 1000));
    const log = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate }).catch(() => null);
    const entry = log?.entries.first();
    if (entry && entry.target.id === newMember.id && Date.now() - entry.createdTimestamp < 5000) {
      fields.push({ name: 'Changed By', value: `<@${entry.executor.id}>`, inline: true });
    }
  } catch {}

  const title = added.size ? '🎭 Role Added' : removed.size ? '🎭 Role Removed' : '👤 Member Updated';
  _mlSend(newMember.guild, _mlEmbed(0x818cf8, title, fields, newMember.user));
});

// User update — username/avatar change (global, not guild-specific)
client.on(Events.UserUpdate, (oldUser, newUser) => {
  if (!MOD_LOG_CH_ID) return;
  const fields = [];
  if (oldUser.username !== newUser.username) {
    fields.push({ name: 'Username Before', value: oldUser.username, inline: true });
    fields.push({ name: 'Username After',  value: newUser.username, inline: true });
  }
  if (oldUser.discriminator !== newUser.discriminator) {
    fields.push({ name: 'Discriminator', value: `${oldUser.discriminator} → ${newUser.discriminator}`, inline: true });
  }
  if (oldUser.avatar !== newUser.avatar) {
    fields.push({ name: 'Avatar', value: 'Profile picture changed' });
  }
  if (!fields.length) return;
  fields.unshift({ name: 'User', value: `<@${newUser.id}> (${newUser.tag})`, inline: true });
  const guild = client.guilds.cache.first();
  _mlSend(guild, _mlEmbed(0xa78bfa, '👤 User Updated', fields, newUser));
});

// Ban
client.on(Events.GuildBanAdd, ban => {
  if (!MOD_LOG_CH_ID) return;
  const embed = _mlEmbed(0xdc2626, '🔨 Member Banned', [
    { name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
    { name: 'Reason', value: ban.reason || 'No reason given' },
  ], ban.user);
  _mlSend(ban.guild, embed);
});

// Unban
client.on(Events.GuildBanRemove, ban => {
  if (!MOD_LOG_CH_ID) return;
  const embed = _mlEmbed(0x4ade80, '✅ Member Unbanned', [
    { name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
  ], ban.user);
  _mlSend(ban.guild, embed);
});

// Channel create
client.on(Events.ChannelCreate, async ch => {
  if (!MOD_LOG_CH_ID || !ch.guild) return;
  const typeNames = { 0: 'Text', 2: 'Voice', 4: 'Category', 5: 'Announcement', 13: 'Stage', 15: 'Forum' };
  const embed = _mlEmbed(0x34d399, '📢 Channel Created', [
    { name: 'Name', value: ch.name, inline: true },
    { name: 'Type', value: typeNames[ch.type] || String(ch.type), inline: true },
    { name: 'Category', value: ch.parent?.name || 'None', inline: true },
  ]);
  _mlSend(ch.guild, embed);
});

// Channel delete
client.on(Events.ChannelDelete, ch => {
  if (!MOD_LOG_CH_ID || !ch.guild) return;
  const typeNames = { 0: 'Text', 2: 'Voice', 4: 'Category', 5: 'Announcement', 13: 'Stage', 15: 'Forum' };
  const embed = _mlEmbed(0xf87171, '🗑️ Channel Deleted', [
    { name: 'Name', value: ch.name, inline: true },
    { name: 'Type', value: typeNames[ch.type] || String(ch.type), inline: true },
    { name: 'Category', value: ch.parent?.name || 'None', inline: true },
  ]);
  _mlSend(ch.guild, embed);
});

// Channel update — name/topic/slowmode changes
client.on(Events.ChannelUpdate, (oldCh, newCh) => {
  if (!MOD_LOG_CH_ID || !newCh.guild) return;
  const fields = [];
  if (oldCh.name !== newCh.name) fields.push({ name: 'Name', value: `${oldCh.name} → ${newCh.name}` });
  if (oldCh.topic !== newCh.topic) fields.push({ name: 'Topic Before', value: oldCh.topic || '*(none)*' }, { name: 'Topic After', value: newCh.topic || '*(removed)*' });
  if (oldCh.rateLimitPerUser !== newCh.rateLimitPerUser) fields.push({ name: 'Slowmode', value: `${oldCh.rateLimitPerUser}s → ${newCh.rateLimitPerUser}s`, inline: true });
  if (!fields.length) return;
  fields.unshift({ name: 'Channel', value: `<#${newCh.id}>`, inline: true });
  _mlSend(newCh.guild, _mlEmbed(0xfbbf24, '⚙️ Channel Updated', fields));
});

// Role create
client.on(Events.GuildRoleCreate, role => {
  if (!MOD_LOG_CH_ID) return;
  const embed = _mlEmbed(0x34d399, '🎭 Role Created', [
    { name: 'Name', value: role.name, inline: true },
    { name: 'Color', value: role.hexColor, inline: true },
    { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
  ]);
  _mlSend(role.guild, embed);
});

// Role delete
client.on(Events.GuildRoleDelete, role => {
  if (!MOD_LOG_CH_ID) return;
  const embed = _mlEmbed(0xf87171, '🗑️ Role Deleted', [
    { name: 'Name', value: role.name, inline: true },
    { name: 'Color', value: role.hexColor, inline: true },
  ]);
  _mlSend(role.guild, embed);
});

// Role update — name/color/permissions change
client.on(Events.GuildRoleUpdate, (oldRole, newRole) => {
  if (!MOD_LOG_CH_ID) return;
  const fields = [];
  if (oldRole.name !== newRole.name) fields.push({ name: 'Name', value: `${oldRole.name} → ${newRole.name}`, inline: true });
  if (oldRole.hexColor !== newRole.hexColor) fields.push({ name: 'Color', value: `${oldRole.hexColor} → ${newRole.hexColor}`, inline: true });
  if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) fields.push({ name: 'Permissions Changed', value: 'Role permissions were modified' });
  if (oldRole.mentionable !== newRole.mentionable) fields.push({ name: 'Mentionable', value: `${oldRole.mentionable} → ${newRole.mentionable}`, inline: true });
  if (!fields.length) return;
  fields.unshift({ name: 'Role', value: `<@&${newRole.id}>`, inline: true });
  _mlSend(newRole.guild, _mlEmbed(0xfbbf24, '⚙️ Role Updated', fields));
});

// Server update — name/icon/etc
client.on(Events.GuildUpdate, (oldGuild, newGuild) => {
  if (!MOD_LOG_CH_ID) return;
  const fields = [];
  if (oldGuild.name !== newGuild.name) fields.push({ name: 'Server Name', value: `${oldGuild.name} → ${newGuild.name}` });
  if (oldGuild.icon !== newGuild.icon) fields.push({ name: 'Icon', value: 'Server icon changed' });
  if (oldGuild.banner !== newGuild.banner) fields.push({ name: 'Banner', value: 'Server banner changed' });
  if (oldGuild.description !== newGuild.description) fields.push({ name: 'Description Before', value: oldGuild.description || '*(none)*' }, { name: 'Description After', value: newGuild.description || '*(removed)*' });
  if (!fields.length) return;
  _mlSend(newGuild, _mlEmbed(0x818cf8, '🏠 Server Updated', fields));
});

// Voice join / leave / move
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  if (!MOD_LOG_CH_ID) return;
  const user = newState.member?.user;
  if (!user) return;
  if (!oldState.channelId && newState.channelId) {
    _mlSend(newState.guild, _mlEmbed(0x4ade80, '🔊 Joined Voice', [
      { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
      { name: 'Channel', value: newState.channel?.name || '?', inline: true },
    ], user));
  } else if (oldState.channelId && !newState.channelId) {
    _mlSend(oldState.guild, _mlEmbed(0xf87171, '🔇 Left Voice', [
      { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
      { name: 'Channel', value: oldState.channel?.name || '?', inline: true },
    ], user));
  } else if (oldState.channelId !== newState.channelId) {
    _mlSend(newState.guild, _mlEmbed(0xfbbf24, '🔀 Moved Voice Channel', [
      { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
      { name: 'From', value: oldState.channel?.name || '?', inline: true },
      { name: 'To', value: newState.channel?.name || '?', inline: true },
    ], user));
  }
});

// Live-stream Join gate: ONLY while a stream is active, and ONLY on the
// specific VC picked in /host-stream — every other voice channel is always
// open, gate or no gate. Two ways to get kicked from the tracked VC:
//   1. Never clicked Join VC on the announcement at all.
//   2. Clicked it, but their weekly count is already at/over their limit
//      by the time they actually try to enter (e.g. clicked earlier when
//      they had room, used up the rest of their quota elsewhere since).
// The host is always exempt — never gated, never counted.
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (!activeStream) return;
  if (oldState.channelId === newState.channelId) return;

  const member = oldState.member || newState.member;
  if (!member || member.user.bot) return;

  // Left the tracked VC (or moved out of it) — accrue their time in.
  if (oldState.channelId === activeStream.vcId && newState.channelId !== activeStream.vcId) {
    const rec = activeStream.vcTimes.get(member.id);
    if (rec && rec.joinedAt) {
      rec.totalMs += Date.now() - rec.joinedAt;
      rec.joinedAt = null;
    }
  }

  if (newState.channelId !== activeStream.vcId) return; // only police the tracked VC

  if (member.id === activeStream.hostId) {
    // Host is exempt from the gate but still gets their time tracked.
    const rec = activeStream.vcTimes.get(member.id) || { joinedAt: null, totalMs: 0 };
    rec.joinedAt = Date.now();
    activeStream.vcTimes.set(member.id, rec);
    return;
  }

  if (!activeStream.clickedUserIds.has(member.id)) {
    await newState.disconnect('Must click Join VC on the stream announcement first').catch(() => {});
    try {
      await member.send(
        `Click **Join VC** in <#${STREAM_ANNOUNCE_CH_ID}> first, then rejoin.`
      );
    } catch {}
    return;
  }

  if (!_streamIsUnlimited(member)) {
    const limit = _streamBaseLimit(member) + _streamBonus(member.id);
    const used = _streamJoinCount(member.id);
    if (used > limit) {
      await newState.disconnect('Weekly live-stream limit reached').catch(() => {});
      try {
        await member.send(
          `You've hit your weekly limit (${limit}/${limit}). Resets Sunday 00:00 ET.`
        );
      } catch {}
      return;
    }
  }

  const rec = activeStream.vcTimes.get(member.id) || { joinedAt: null, totalMs: 0 };
  rec.joinedAt = Date.now();
  activeStream.vcTimes.set(member.id, rec);
});

// ── Daily opening-range poll scheduler ──
// Checks the current ET minute every tick; fires post/reveal once per
// matching minute using a date-string guard so a slow tick or restart
// doesn't cause a double-post within the same day.
let orPollLastPostDate = null;
let orPollLastRevealDate = null;

function _orPollEmbed(votes, revealed) {
  const counts = { pump: 0, dump: 0, judas: 0 };
  for (const key of votes.values()) counts[key] = (counts[key] || 0) + 1;
  const total = votes.size;

  const lines = OR_POLL_OPTIONS.map(opt => {
    const n = counts[opt.key] || 0;
    const pct = total ? Math.round((n / total) * 100) : 0;
    return `${opt.emoji} **${opt.label}** — ${n} vote${n === 1 ? '' : 's'} (${pct}%)`;
  }).join('\n');

  return new EmbedBuilder()
    .setColor(revealed ? 0xfbbf24 : 0x38bdf8)
    .setTitle(revealed ? '🔔 Opening Range — Here It Comes' : '📊 Opening Range Call')
    .setDescription(
      (revealed
        ? `NYSE opens in 1 minute. Votes are locked.\n\n`
        : `NY market opens at 9:30 AM ET. Where's the opening range going?\n\n`) + lines
    )
    .setFooter({ text: revealed ? 'Good luck out there.' : `${total} vote${total === 1 ? '' : 's'} so far — polls lock at 9:29 AM ET` })
    .setTimestamp();
}

setInterval(async () => {
  const nyNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dow = nyNow.getDay(); // 0 = Sun, 6 = Sat
  if (dow === 0 || dow === 6) return; // Mon-Fri only
  const hh = nyNow.getHours();
  const mm = nyNow.getMinutes();
  const dateKey = nyNow.toISOString().slice(0, 10);

  const guild = client.guilds.cache.first();
  if (!guild) return;

  // 9:15 AM ET — post the poll
  if (hh === 9 && mm === 15 && orPollLastPostDate !== dateKey) {
    orPollLastPostDate = dateKey;
    const ch = guild.channels.cache.get(GENERAL_CH_ID);
    if (!ch) return;

    const votes = new Map();
    const row = new ActionRowBuilder().addComponents(
      OR_POLL_OPTIONS.map(opt =>
        new ButtonBuilder().setCustomId(`orpoll_vote_${opt.key}`).setLabel(opt.label).setEmoji(opt.emoji).setStyle(ButtonStyle.Secondary)
      )
    );
    const msg = await ch.send({ embeds: [_orPollEmbed(votes, false)], components: [row] }).catch(() => null);
    if (msg) orPollState = { messageId: msg.id, votes };
  }

  // 9:29 AM ET — reveal, lock voting
  if (hh === 9 && mm === 29 && orPollLastRevealDate !== dateKey) {
    orPollLastRevealDate = dateKey;
    if (!orPollState) return;
    const ch = guild.channels.cache.get(GENERAL_CH_ID);
    const msg = ch ? await ch.messages.fetch(orPollState.messageId).catch(() => null) : null;
    if (msg) {
      const lockedRow = new ActionRowBuilder().addComponents(
        OR_POLL_OPTIONS.map(opt =>
          new ButtonBuilder().setCustomId(`orpoll_vote_${opt.key}`).setLabel(opt.label).setEmoji(opt.emoji).setStyle(ButtonStyle.Secondary).setDisabled(true)
        )
      );
      await msg.edit({ embeds: [_orPollEmbed(orPollState.votes, true)], components: [lockedRow] }).catch(() => {});
    }
    orPollState = null;
  }

  // 5:00 PM ET — DM anyone whose signal from today is still pending (no
  // outcome picked yet). Runs daily, guarded by lastSignalReminderDate so a
  // slow tick or restart can't double-send within the same day.
  if (hh === 17 && mm === 0 && lastSignalReminderDate !== dateKey) {
    lastSignalReminderDate = dateKey;
    _remindPendingSignals(guild, dateKey).catch(e => console.error('[signal reminder] failed:', e.message));
  }
}, 30 * 1000);

let lastSignalReminderDate = null;

async function _remindPendingSignals(guild, dateKey) {
  const r = await fetch('https://smp-join.poshop608.workers.dev/bot/signals', {
    headers: { 'Authorization': `Bot ${process.env.TOKEN}` },
  });
  const d = await r.json().catch(() => ({ ok: false }));
  if (!d.ok) return;

  const pendingToday = d.signals.filter(s => {
    if (s.outcome) return false;
    const sigDateKey = new Date(s.createdAt).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    return sigDateKey === dateKey;
  });

  // One reminder per user, even if they dropped multiple pending signals.
  const byUser = new Map();
  for (const sig of pendingToday) {
    if (!byUser.has(sig.discordId)) byUser.set(sig.discordId, []);
    byUser.get(sig.discordId).push(sig);
  }

  for (const [discordId, sigs] of byUser) {
    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) continue;
    const list = sigs.map(s => `• ${s.asset ? `${s.asset} ${s.direction} — ` : ''}${s.level}`).join('\n');
    await member.send(
      `You dropped ${sigs.length === 1 ? 'a signal' : `${sigs.length} signals`} today that still ${sigs.length === 1 ? "doesn't" : "don't"} have an outcome set:\n${list}\n\nHead to the signal message in <#${SIGNALS_CH_ID}> and click W, L, or Criteria Not Met.`
    ).catch(() => {});
  }
}

// Invite create
client.on(Events.InviteCreate, invite => {
  if (!MOD_LOG_CH_ID) return;
  const embed = _mlEmbed(0x34d399, '🔗 Invite Created', [
    { name: 'Code', value: invite.code, inline: true },
    { name: 'Created By', value: invite.inviter ? `<@${invite.inviter.id}>` : 'Unknown', inline: true },
    { name: 'Channel', value: invite.channel ? `<#${invite.channel.id}>` : '?', inline: true },
    { name: 'Max Uses', value: invite.maxUses ? String(invite.maxUses) : 'Unlimited', inline: true },
    { name: 'Expires', value: invite.expiresAt ? `<t:${Math.floor(invite.expiresTimestamp / 1000)}:R>` : 'Never', inline: true },
  ]);
  _mlSend(invite.guild, embed);
});

// Invite delete
client.on(Events.InviteDelete, invite => {
  if (!MOD_LOG_CH_ID) return;
  const embed = _mlEmbed(0xf87171, '🔗 Invite Deleted', [
    { name: 'Code', value: invite.code, inline: true },
    { name: 'Channel', value: invite.channel ? `<#${invite.channel.id}>` : '?', inline: true },
  ]);
  _mlSend(invite.guild, embed);
});

// Thread create
client.on(Events.ThreadCreate, thread => {
  if (!MOD_LOG_CH_ID) return;
  const embed = _mlEmbed(0x34d399, '🧵 Thread Created', [
    { name: 'Name', value: thread.name, inline: true },
    { name: 'Parent', value: thread.parent ? `<#${thread.parentId}>` : '?', inline: true },
  ]);
  _mlSend(thread.guild, embed);
});

// Thread delete
client.on(Events.ThreadDelete, thread => {
  if (!MOD_LOG_CH_ID) return;
  const embed = _mlEmbed(0xf87171, '🧵 Thread Deleted', [
    { name: 'Name', value: thread.name, inline: true },
    { name: 'Parent', value: thread.parent ? `<#${thread.parentId}>` : '?', inline: true },
  ]);
  _mlSend(thread.guild, embed);
});

// Emoji create/delete
client.on(Events.GuildEmojiCreate, emoji => {
  if (!MOD_LOG_CH_ID) return;
  _mlSend(emoji.guild, _mlEmbed(0x34d399, '😀 Emoji Added', [{ name: 'Name', value: `:${emoji.name}:`, inline: true }, { name: 'ID', value: emoji.id, inline: true }]));
});
client.on(Events.GuildEmojiDelete, emoji => {
  if (!MOD_LOG_CH_ID) return;
  _mlSend(emoji.guild, _mlEmbed(0xf87171, '😀 Emoji Removed', [{ name: 'Name', value: `:${emoji.name}:`, inline: true }]));
});

// Sticker create/delete
client.on(Events.GuildStickerCreate, sticker => {
  if (!MOD_LOG_CH_ID) return;
  _mlSend(sticker.guild, _mlEmbed(0x34d399, '🏷️ Sticker Added', [{ name: 'Name', value: sticker.name, inline: true }]));
});
client.on(Events.GuildStickerDelete, sticker => {
  if (!MOD_LOG_CH_ID) return;
  _mlSend(sticker.guild, _mlEmbed(0xf87171, '🏷️ Sticker Removed', [{ name: 'Name', value: sticker.name, inline: true }]));
});

client.login(process.env.TOKEN);

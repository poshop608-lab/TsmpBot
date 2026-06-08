require('dotenv').config();
const path = require('path');
const express = require('express');
const { XMLParser } = require('fast-xml-parser');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const {
  Client,
  GatewayIntentBits,
  Events,
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
const LOGO_PATH = 'C:/Users/Administrator/Downloads/fceb53001879bcd55cccb025dbc7243b.jpg';
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
async function fetchUSDEvents(week = 'thisweek') {
  const all = await fetchAllUSDEvents(week);
  return all.filter(e => (e.country || e.currency || '') === 'USD' && (e.impact === 'High' || e.impact === 'Medium'));
}

// ── Environment Engine (ported from TradoArc) ──
const ENV_TIER1 = ['federal funds rate','fomc statement','fomc minutes','fomc press conference','interest rate decision','non-farm','nonfarm','nfp','unemployment rate','average hourly earnings','cpi','consumer price index','core pce','pce price'];
const ENV_TIER2 = ['ppi','producer price','retail sales','ism manufacturing','ism services','s&p global pmi','pmi','gdp','durable goods'];
const ENV_TIER3 = ['jobless claims','initial claims','continuing claims','jolts','consumer confidence','michigan sentiment','personal income','personal spending','factory orders'];
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
    if ((e.country || e.currency || '').toUpperCase() !== 'USD') return false;
    if ((e.impact || '') === 'L' || (e.impact || '') === 'Low') return false;
    const n = (e.title || e.name || '').toLowerCase();
    if (ENV_EXCLUDE.some(x => n.includes(x))) return false;
    return true;
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
  ctx.fillText('Source: ForexFactory  ·  USD events only  ·  Based on TSMP news protocols  ·  The Smart Money Paradigm', PAD, footY + 20);

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
  const fmt = d => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(friday) };
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

async function fetchAllUSDEvents(week = 'thisweek') {
  // 1. Read from file cache (populated by GitHub Action or previous successful fetch)
  try {
    const filePath = path.join(__dirname, 'data', `ff_${week}.json`);
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (raw && raw !== '[]') {
      const j = JSON.parse(raw);
      if (Array.isArray(j) && j.length > 0) {
        console.log(`Calendar loaded from file (${week}): ${j.length} events`);
        return j;
      }
    }
  } catch {}

  // 2. Investing.com — works for any week including future dates, no rate limit
  try {
    console.log(`Fetching from Investing.com (${week})...`);
    const result = await Promise.race([
      _fetchInvesting(week),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000)),
    ]);
    if (Array.isArray(result) && result.length) {
      console.log(`Investing.com (${week}): ${result.length} events`);
      try { fs.writeFileSync(path.join(__dirname, 'data', `ff_${week}.json`), JSON.stringify(result)); } catch {}
      return result;
    }
  } catch (e) { console.warn(`Investing.com fetch failed: ${e.message}`); }

  // 3. FF direct fallback (thisweek/nextweek only, may be rate limited)
  try {
    console.warn(`Falling back to FF direct (${week})...`);
    const FF_URL = `https://nfs.faireconomy.media/ff_calendar_${week}.json`;
    const r = await fetch(FF_URL, { headers: { 'User-Agent': 'Wget/1.21.3', 'Accept': '*/*' } });
    if (r.ok) {
      const text = await r.text();
      if (!text.trim().startsWith('<')) {
        const result = JSON.parse(text);
        if (Array.isArray(result) && result.length) {
          try { fs.writeFileSync(path.join(__dirname, 'data', `ff_${week}.json`), JSON.stringify(result)); } catch {}
          return result;
        }
      }
    }
  } catch (e) { console.warn(`FF fallback failed: ${e.message}`); }

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
  const dow = new Date().getDay(); // 0=Sun
  let allEvents;
  if (dow === 0) {
    allEvents = await fetchAllUSDEvents('nextweek');
    if (!allEvents.length) allEvents = await fetchAllUSDEvents('thisweek');
  } else {
    allEvents = await fetchAllUSDEvents('thisweek');
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
      const time = e.date ? fmtEventTime(e.date) : (e.time || 'TBD');
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
    const d = new Date(e.date);
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
      ctx.fillText(fmtEventTime(e.date), cx + DAY_INNER_PAD + 14, ey + 11);

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
  ctx.fillText('Source: Investing.com  ·  USD events only  ·  Based on TSMP news protocols  ·  The Smart Money Paradigm', PAD, footY + 18);

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

  const allEvents = await fetchAllUSDEvents(week);
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
const ROLES_CH_ID      = '1510297377779748994';
const TICKETS_CH_ID    = '1510299210371567709';

const VOLUME_ROLES = {
  'Vol I':   { id: '1508205135099068606', style: ButtonStyle.Success },   // green
  'Vol II':  { id: '1508205224878411786', style: ButtonStyle.Primary },   // yellow/gold — closest is Primary (blurple), override below
  'Vol III': { id: '1508205421385748740', style: ButtonStyle.Danger },    // red
};

const STAFF_ROLE_IDS = [
  '1469222592312377374', // ⌬ Founder
  '1510299206990958865', // ⬡ Moderator
];

const NEWS_PROTOCOLS_CH_ID = '1476978704243495003';
const ENV_CATEGORY_ID = '1469241557118095391';
let ENV_CH_ID = null;

// ── Sweep Alerts ──
const SWEEP_WEBHOOK_SECRET = process.env.SWEEP_SECRET || 'tsmp_sweep_secret';
let SWEEP_TC_ROLE_ID   = null;  // 📈 Time Cycle Alerts role
let SWEEP_QT_ROLE_ID   = null;  // 📐 QT Theory Alerts role
let SWEEP_ALERT_CH_ID  = null;  // #📡〢sweep-alerts channel
let SWEEP_ROLES_CH_ID  = null;  // #🔔〢alert-roles channel

// ── VC Countdown ──
let VC_ALERT_ROLE_ID   = null;  // 📅 VC Alerts role
let VC_SCHED_CH_ID     = null;  // #📅〢vc-schedule channel

// active countdown: { messageId, vcChannelId, vcChannelName, sessionNote, startEpoch, intervalId, warned15 }
let _vcCountdown = null;

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
    countdownStr = hrs > 0
      ? `**${hrs}h ${mins}m** · <t:${startEpoch}:R>`
      : `**${mins} min** · <t:${startEpoch}:R>`;
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
  if (host) embed.addFields({ name: 'Hosted By', value: `👤 ${host}`, inline: true });
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

  // 15-min warning ping
  if (!warned15 && secsLeft > 0 && secsLeft <= 900 && VC_ALERT_ROLE_ID) {
    _vcCountdown.warned15 = true;
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
  }
}

// ── NQ Price Monitor ──
// Yahoo Finance: ~30s lag during market hours, ~10min outside
const SWEEP_POLL_MS = 30 * 1000;
const NQ_SYMBOL = 'NQ=F';

// Tracked static levels — refreshed daily/weekly/monthly
let _nqLevels = {
  pdh: null, pdl: null,   // Previous Day H/L
  pwh: null, pwl: null,   // Previous Week H/L
  pmh: null, pml: null,   // Previous Month H/L
  premh: null, preml: null, // Pre-Market H/L (07:00-09:30 ET)
};

// QT Theory — 90-min Q block H/L (built during block, alerted next block)
// Keys: qt_asia_q1, qt_asia_q2, qt_asia_q3, qt_lon_q1 ... qt_nypm_q3
// Each: { h, l, stored }
let _qtBlocks = {};

// Time Cycle — session H/L (built during session, alerted next session)
// Keys: tc_asia, tc_london, tc_nyam, tc_nypm
let _tcSessions = {};

// One-shot fired flags
let _swept = {};
let _lastSweepDay  = null;
let _lastSweepWeek = null;
let _lastSweepMonth = null;

function _nyTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

function _nyHM() {
  const t = _nyTime();
  return t.getHours() * 60 + t.getMinutes();
}

// QT Theory time blocks — 90-min quarters per session, anchored at 18:00 NY
// Returns { session, q } or null
function _qtBlock() {
  const hm = _nyHM();
  // Asia:   18:00-19:30(Q1) 19:30-21:00(Q2) 21:00-22:30(Q3) 22:30-00:00(Q4)
  if (hm >= 1080 && hm < 1170) return { session: 'asia',  q: 1 };
  if (hm >= 1170 && hm < 1260) return { session: 'asia',  q: 2 };
  if (hm >= 1260 && hm < 1350) return { session: 'asia',  q: 3 };
  if (hm >= 1350)               return { session: 'asia',  q: 4 };
  // London: 00:00-01:30(Q1) 01:30-03:00(Q2) 03:00-04:30(Q3) 04:30-06:00(Q4)
  if (hm >= 0   && hm < 90)  return { session: 'london', q: 1 };
  if (hm >= 90  && hm < 180) return { session: 'london', q: 2 };
  if (hm >= 180 && hm < 270) return { session: 'london', q: 3 };
  if (hm >= 270 && hm < 360) return { session: 'london', q: 4 };
  // NY AM:  06:00-07:30(Q1) 07:30-09:00(Q2) 09:00-10:30(Q3) 10:30-12:00(Q4)
  if (hm >= 360 && hm < 450) return { session: 'nyam',   q: 1 };
  if (hm >= 450 && hm < 540) return { session: 'nyam',   q: 2 };
  if (hm >= 540 && hm < 630) return { session: 'nyam',   q: 3 };
  if (hm >= 630 && hm < 720) return { session: 'nyam',   q: 4 };
  // NY PM:  12:00-13:30(Q1) 13:30-15:00(Q2) 15:00-16:30(Q3) 16:30-18:00(Q4)
  if (hm >= 720 && hm < 810) return { session: 'nypm',   q: 1 };
  if (hm >= 810 && hm < 900) return { session: 'nypm',   q: 2 };
  if (hm >= 900 && hm < 990) return { session: 'nypm',   q: 3 };
  if (hm >= 990 && hm < 1080)return { session: 'nypm',   q: 4 };
  return null;
}

// Time Cycle sessions (transcript timings)
function _tcSession() {
  const hm = _nyHM();
  if (hm >= 1080 || hm < 150) return 'asia';    // 18:00-02:30
  if (hm >= 150  && hm < 420) return 'london';  // 02:30-07:00
  if (hm >= 420  && hm < 690) return 'nyam';    // 07:00-11:30
  if (hm >= 690  && hm < 960) return 'nypm';    // 11:30-16:00
  return null;
}

// True Open times (QT Theory) — price at Q2 open of each session
const QT_TRUE_OPENS = {
  tao: 19 * 60 + 30,  // Asia Q2  — 19:30 NY
  tlo: 1  * 60 + 30,  // London Q2 — 01:30 NY
  tny: 7  * 60 + 30,  // NY AM Q2  — 07:30 NY
  tpm: 13 * 60 + 30,  // NY PM Q2  — 13:30 NY
};
let _trueOpens = { tao: null, tlo: null, tny: null, tpm: null };
let _trueOpenFired = {};

async function _fetchNQCandles(range, interval) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${NQ_SYMBOL}?interval=${interval}&range=${range}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).chart.result[0]); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function _refreshNQLevels() {
  try {
    // PDH/PDL — 5d daily, second-to-last candle
    const daily = await _fetchNQCandles('5d', '1d');
    const dh = daily.indicators.quote[0].high;
    const dl = daily.indicators.quote[0].low;
    if (dh.length >= 2) {
      _nqLevels.pdh = dh[dh.length - 2];
      _nqLevels.pdl = dl[dl.length - 2];
    }
    // PWH/PWL — 3mo weekly, second-to-last candle
    const weekly = await _fetchNQCandles('3mo', '1wk');
    const wh = weekly.indicators.quote[0].high;
    const wl = weekly.indicators.quote[0].low;
    if (wh.length >= 2) {
      _nqLevels.pwh = wh[wh.length - 2];
      _nqLevels.pwl = wl[wl.length - 2];
    }
    // PMH/PML — 1y monthly, second-to-last candle
    const monthly = await _fetchNQCandles('1y', '1mo');
    const mh = monthly.indicators.quote[0].high;
    const ml = monthly.indicators.quote[0].low;
    if (mh.length >= 2) {
      _nqLevels.pmh = mh[mh.length - 2];
      _nqLevels.pml = ml[ml.length - 2];
    }
    console.log('NQ levels refreshed:', JSON.stringify(_nqLevels));
  } catch (e) { console.warn('NQ level refresh failed:', e.message); }
}

async function _pollNQSweeps() {
  if (!SWEEP_ALERT_CH_ID) return;
  if (!SWEEP_TC_ROLE_ID && !SWEEP_QT_ROLE_ID) return;

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

    const ny    = _nyTime();
    const hm    = _nyHM();
    const today = ny.toDateString();
    const weekN = `${ny.getFullYear()}-W${ny.getDay() === 0 ? Math.ceil(ny.getDate()/7)-1 : Math.ceil(ny.getDate()/7)}`;
    const monthN = `${ny.getFullYear()}-${ny.getMonth()}`;

    // ── Daily reset ──
    if (_lastSweepDay !== today) {
      _lastSweepDay = today;
      // Clear daily-scoped flags
      Object.keys(_swept).filter(k =>
        ['pdh','pdl','prem'].some(p => k.startsWith(p)) ||
        k.startsWith('tc_') || k.startsWith('qt_') ||
        k.startsWith('to_') || k.startsWith('sess_')
      ).forEach(k => delete _swept[k]);
      _qtBlocks = {};
      _tcSessions = {};
      _trueOpens = { tao: null, tlo: null, tny: null, tpm: null };
      _trueOpenFired = {};
      _nqLevels.premh = null;
      _nqLevels.preml = null;
      await _refreshNQLevels();
    }

    // ── Weekly reset ──
    if (_lastSweepWeek !== weekN) {
      _lastSweepWeek = weekN;
      ['pwh','pwl'].forEach(k => delete _swept[k]);
    }

    // ── Monthly reset ──
    if (_lastSweepMonth !== monthN) {
      _lastSweepMonth = monthN;
      ['pmh','pml'].forEach(k => delete _swept[k]);
    }

    const guild = client.guilds.cache.first();
    if (!guild) return;
    const ch = guild.channels.cache.get(SWEEP_ALERT_CH_ID);
    if (!ch) return;

    // roleIds: array of role IDs to ping — 'both', 'tc', 'qt'
    async function fireAlert(key, label, direction, lvlPrice, roleType) {
      if (_swept[key]) return;
      _swept[key] = true;
      const emoji   = direction === 'above' ? '🔼' : '🔽';
      const color   = direction === 'above' ? 0x22d3ee : 0xf87171;
      const dirText = direction === 'above' ? 'Swept Above' : 'Swept Below';
      const rolePings = [];
      if ((roleType === 'both' || roleType === 'tc') && SWEEP_TC_ROLE_ID) rolePings.push(`<@&${SWEEP_TC_ROLE_ID}>`);
      if ((roleType === 'both' || roleType === 'qt') && SWEEP_QT_ROLE_ID) rolePings.push(`<@&${SWEEP_QT_ROLE_ID}>`);
      if (!rolePings.length) return;
      const roleTag = roleType === 'both' ? '📈 TC  📐 QT' : roleType === 'tc' ? '📈 Time Cycle' : '📐 QT Theory';
      const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({ name: `${emoji} NQ Sweep — ${label} ${dirText}` })
        .setDescription(`**${label}** at **${lvlPrice.toFixed(2)}** swept.\nCurrent price: **${price.toFixed(2)}**`)
        .addFields(
          { name: 'Level', value: label, inline: true },
          { name: 'Price', value: lvlPrice.toFixed(2), inline: true },
          { name: 'Theory', value: roleTag, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: '⚠️ ~10 min data delay · TSMP Sweep Monitor · The Smart Money Paradigm' });
      await ch.send({ content: rolePings.join(' '), embeds: [embed] });
      console.log(`Sweep: ${key} ${dirText} @ ${lvlPrice}`);
    }

    // ── UNIVERSAL LEVELS (both roles) ──
    const { pdh, pdl, pwh, pwl, pmh, pml, premh, preml } = _nqLevels;
    if (pdh  && high > pdh)  await fireAlert('pdh',   'PDH (Prev Day High)',    'above', pdh,   'both');
    if (pdl  && low  < pdl)  await fireAlert('pdl',   'PDL (Prev Day Low)',     'below', pdl,   'both');
    if (pwh  && high > pwh)  await fireAlert('pwh',   'PWH (Prev Week High)',   'above', pwh,   'both');
    if (pwl  && low  < pwl)  await fireAlert('pwl',   'PWL (Prev Week Low)',    'below', pwl,   'both');
    if (pmh  && high > pmh)  await fireAlert('pmh',   'PMH (Prev Month High)',  'above', pmh,   'both');
    if (pml  && low  < pml)  await fireAlert('pml',   'PML (Prev Month Low)',   'below', pml,   'both');
    if (premh && high > premh) await fireAlert('premh', 'PreMH (Pre-Mkt High)', 'above', premh, 'both');
    if (preml && low  < preml) await fireAlert('preml', 'PreML (Pre-Mkt Low)',  'below', preml, 'both');

    // ── BUILD PRE-MARKET H/L (07:00-09:30 ET) ──
    if (hm >= 420 && hm < 570) {
      _nqLevels.premh = _nqLevels.premh === null ? high : Math.max(_nqLevels.premh, high);
      _nqLevels.preml = _nqLevels.preml === null ? low  : Math.min(_nqLevels.preml, low);
    }

    // ── TIME CYCLE — cross-session PXH/PXL ──
    // Sessions: asia 18:00-02:30, london 02:30-07:00, nyam 07:00-11:30, nypm 11:30-16:00
    const TC_SESSIONS = [
      { key: 'asia',   start: 1080, end: 150,  label: 'Asia',        alertDuring: 'london' },
      { key: 'london', start: 150,  end: 420,  label: 'London',      alertDuring: 'nyam'   },
      { key: 'nyam',   start: 420,  end: 690,  label: 'NY Morning',  alertDuring: 'nypm'   },
    ];

    const curTCSess = _tcSession();

    for (const sess of TC_SESSIONS) {
      // Build H/L while inside session
      const inSess = sess.start > sess.end
        ? (hm >= sess.start || hm < sess.end)   // wraps midnight (asia)
        : (hm >= sess.start && hm < sess.end);
      if (inSess) {
        if (!_tcSessions[sess.key]) _tcSessions[sess.key] = { h: null, l: null };
        const sd = _tcSessions[sess.key];
        sd.h = sd.h === null ? high : Math.max(sd.h, high);
        sd.l = sd.l === null ? low  : Math.min(sd.l, low);
      }
      // Alert when inside the alertDuring session and levels exist
      if (curTCSess === sess.alertDuring && _tcSessions[sess.key]) {
        const sd = _tcSessions[sess.key];
        if (sd.h && high > sd.h) await fireAlert(`tc_${sess.key}_h`, `${sess.label} High (TC)`, 'above', sd.h, 'tc');
        if (sd.l && low  < sd.l) await fireAlert(`tc_${sess.key}_l`, `${sess.label} Low (TC)`,  'below', sd.l, 'tc');
      }
    }

    // ── QT THEORY — 90-min Q block PXH/PXL ──
    const curQT = _qtBlock();

    const QT_BLOCKS = [
      { session: 'asia',   q: 1, start: 1080, end: 1170 },
      { session: 'asia',   q: 2, start: 1170, end: 1260 },
      { session: 'asia',   q: 3, start: 1260, end: 1350 },
      { session: 'london', q: 1, start: 0,    end: 90   },
      { session: 'london', q: 2, start: 90,   end: 180  },
      { session: 'london', q: 3, start: 180,  end: 270  },
      { session: 'nyam',   q: 1, start: 360,  end: 450  },
      { session: 'nyam',   q: 2, start: 450,  end: 540  },
      { session: 'nyam',   q: 3, start: 540,  end: 630  },
      { session: 'nypm',   q: 1, start: 720,  end: 810  },
      { session: 'nypm',   q: 2, start: 810,  end: 900  },
      { session: 'nypm',   q: 3, start: 900,  end: 990  },
    ];

    const SESS_LABELS_QT = { asia: 'Asia', london: 'London', nyam: 'NY AM', nypm: 'NY PM' };

    for (const blk of QT_BLOCKS) {
      const bKey = `${blk.session}_q${blk.q}`;
      const inBlk = blk.start > blk.end
        ? (hm >= blk.start || hm < blk.end)
        : (hm >= blk.start && hm < blk.end);

      // Build H/L while inside block
      if (inBlk) {
        if (!_qtBlocks[bKey]) _qtBlocks[bKey] = { h: null, l: null };
        const bd = _qtBlocks[bKey];
        bd.h = bd.h === null ? high : Math.max(bd.h, high);
        bd.l = bd.l === null ? low  : Math.min(bd.l, low);
      }

      // Alert during the NEXT block (same session, q+1)
      const isNextBlock = curQT && curQT.session === blk.session && curQT.q === blk.q + 1;
      if (isNextBlock && _qtBlocks[bKey]) {
        const bd = _qtBlocks[bKey];
        const sLabel = SESS_LABELS_QT[blk.session];
        if (bd.h && high > bd.h) await fireAlert(`qt_${bKey}_h`, `${sLabel} Q${blk.q} High (QT)`, 'above', bd.h, 'qt');
        if (bd.l && low  < bd.l) await fireAlert(`qt_${bKey}_l`, `${sLabel} Q${blk.q} Low (QT)`,  'below', bd.l, 'qt');
      }
    }

    // ── QT TRUE OPENS — TAO/TLO/TNY/TPM swept ──
    // Capture price at true open time
    for (const [key, openHM] of Object.entries(QT_TRUE_OPENS)) {
      if (hm >= openHM && hm < openHM + 2 && !_trueOpens[key]) {
        _trueOpens[key] = price;
      }
    }
    // Alert if true open level swept
    const TO_LABELS = { tao: 'TAO (Asia Q2 Open)', tlo: 'TLO (London Q2 Open)', tny: 'TNY (NY AM Q2 Open)', tpm: 'TPM (NY PM Q2 Open)' };
    for (const [key, lvl] of Object.entries(_trueOpens)) {
      if (!lvl) continue;
      if (high > lvl) await fireAlert(`to_${key}_h`, `${TO_LABELS[key]} swept above`, 'above', lvl, 'qt');
      if (low  < lvl) await fireAlert(`to_${key}_l`, `${TO_LABELS[key]} swept below`, 'below', lvl, 'qt');
    }

  } catch (e) { console.warn('NQ sweep poll error:', e.message); }
}

// ── Macro News Feed ──
const MACRO_NEWS_CH_ID = '1487871136875286538';
const MACRO_POLL_MS = 5 * 60 * 1000; // every 5 min
const seenGuids = new Set(); // dedupe — in-memory, clears on restart (fine)

const MACRO_FEEDS = [
  { name: 'Reuters Business',   url: 'https://feeds.reuters.com/reuters/businessNews' },
  { name: 'Reuters World',      url: 'https://feeds.reuters.com/Reuters/worldNews' },
  { name: 'AP News Economy',    url: 'https://rsshub.app/apnews/topics/economy' },
  { name: 'MarketWatch',        url: 'https://feeds.marketwatch.com/marketwatch/topstories' },
  { name: 'BBC Business',       url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { name: 'CNBC Economy',       url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258' },
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

  for (const feed of MACRO_FEEDS) {
    const items = await fetchRSSFeed(feed);
    for (const item of items) {
      if (!item.guid || seenGuids.has(item.guid)) continue;
      seenGuids.add(item.guid);

      const impact = classifyNews(item.title, item.desc);
      if (!impact) continue;

      const isHigh = impact === 'HIGH';
      const impactBadge = isHigh ? '🔴 HIGH IMPACT' : '🟡 MEDIUM IMPACT';
      const embedColor = isHigh ? 0xef4444 : 0xfbbf24;

      const cleanDesc = item.desc
        ? item.desc.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim().slice(0, 280)
        : '';

      const timeStr = item.pubDate
        ? new Date(item.pubDate).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' ET'
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

    // ── Slash commands ──
    if (interaction.isChatInputCommand()) {
      const { commandName, guild } = interaction;

      if (commandName === 'ping') {
        return interaction.reply({ content: `Pong! Latency: ${client.ws.ping}ms`, ephemeral: true });
      }

      if (commandName === 'nq') {
        await interaction.deferReply({ ephemeral: false });
        try {
          const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1m&range=1d', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const json = await res.json();
          const meta = json?.chart?.result?.[0]?.meta;
          if (!meta) return interaction.editReply({ content: 'Failed to fetch NQ price.' });
          const price     = meta.regularMarketPrice ?? meta.previousClose;
          const prevClose = meta.previousClose;
          const change    = price - prevClose;
          const changePct = (change / prevClose) * 100;
          const arrow     = change >= 0 ? '🔼' : '🔽';
          const color     = change >= 0 ? 0x22d3ee : 0xf87171;
          const tsEpoch   = meta.regularMarketTime;
          const tsDisc    = tsEpoch ? `<t:${tsEpoch}:R>` : 'unknown';
          const { pdh, pdl, pwh, pwl, pmh, pml, premh, preml } = _nqLevels;
          const fmtLvl = v => v != null ? v.toFixed(2) : '—';
          const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('📊  NQ Futures — Current Price')
            .addFields(
              { name: 'Price', value: `**${price.toFixed(2)}**`, inline: true },
              { name: 'Change', value: `${arrow} ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`, inline: true },
              { name: 'Data As Of', value: tsDisc, inline: true },
              { name: '━━━  Key Levels  ━━━', value:
                `\`PDH\` ${fmtLvl(pdh)}  ·  \`PDL\` ${fmtLvl(pdl)}\n` +
                `\`PWH\` ${fmtLvl(pwh)}  ·  \`PWL\` ${fmtLvl(pwl)}\n` +
                `\`PMH\` ${fmtLvl(pmh)}  ·  \`PML\` ${fmtLvl(pml)}\n` +
                `\`PreMH\` ${fmtLvl(premh)}  ·  \`PreML\` ${fmtLvl(preml)}`,
                inline: false },
            )
            .setFooter({ text: '⚠️ ~10 min data delay · Yahoo Finance · The Smart Money Paradigm' })
            .setTimestamp();
          return interaction.editReply({ embeds: [embed] });
        } catch (e) {
          return interaction.editReply({ content: `Error fetching NQ price: ${e.message}` });
        }
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
          return interaction.editReply({ content: `No USD high/medium events found for **${week}** — FF may not have published it yet.` });
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

        const week = interaction.options.getString('week') || 'thisweek';
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

        const week = interaction.options.getString('week') || 'thisweek';
        const allEvents = await fetchAllUSDEvents(week);

        if (allEvents.length === 0) {
          return interaction.editReply({ content: `No events found for **${week}** — FF may not have published it yet.` });
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

        if (!SWEEP_ALERT_CH_ID) return interaction.editReply({ content: 'Run `/setup-sweep-alerts` first.' });

        const ch = guild.channels.cache.get(SWEEP_ALERT_CH_ID);
        if (!ch) return interaction.editReply({ content: 'Sweep alerts channel not found.' });

        const testLevels = [
          { key: 'test_pdh',    label: 'PDH (Prev Day High)',      dir: 'above', price: 29743.00, role: 'both' },
          { key: 'test_pdl',    label: 'PDL (Prev Day Low)',       dir: 'below', price: 28822.25, role: 'both' },
          { key: 'test_pmh',    label: 'PMH (Prev Month High)',    dir: 'above', price: 30807.75, role: 'both' },
          { key: 'test_premh',  label: 'PreMH (Pre-Mkt High)',     dir: 'above', price: 29500.00, role: 'both' },
          { key: 'test_tc_lon', label: 'London High (TC)',         dir: 'above', price: 29650.00, role: 'tc'   },
          { key: 'test_qt_q2',  label: 'NY AM Q1 High (QT)',       dir: 'above', price: 29580.00, role: 'qt'   },
          { key: 'test_tny',    label: 'TNY (NY AM Q2 Open)',      dir: 'below', price: 29450.00, role: 'qt'   },
        ];

        for (const t of testLevels) {
          const emoji   = t.dir === 'above' ? '🔼' : '🔽';
          const color   = t.dir === 'above' ? 0x22d3ee : 0xf87171;
          const dirText = t.dir === 'above' ? 'Swept Above' : 'Swept Below';
          const rolePings = [];
          if ((t.role === 'both' || t.role === 'tc') && SWEEP_TC_ROLE_ID) rolePings.push(`<@&${SWEEP_TC_ROLE_ID}>`);
          if ((t.role === 'both' || t.role === 'qt') && SWEEP_QT_ROLE_ID) rolePings.push(`<@&${SWEEP_QT_ROLE_ID}>`);
          const roleTag = t.role === 'both' ? '📈 TC  📐 QT' : t.role === 'tc' ? '📈 Time Cycle' : '📐 QT Theory';
          const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: `${emoji} NQ Sweep — ${t.label} ${dirText}` })
            .setDescription(`**${t.label}** at **${t.price.toFixed(2)}** swept.\nCurrent price: **${t.price.toFixed(2)}**`)
            .addFields(
              { name: 'Level', value: t.label, inline: true },
              { name: 'Price', value: t.price.toFixed(2), inline: true },
              { name: 'Theory', value: roleTag, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: '⚠️ TEST ALERT — not a real sweep · TSMP Sweep Monitor' });
          await ch.send({ content: rolePings.length ? rolePings.join(' ') : '*(no roles assigned yet)*', embeds: [embed] });
        }

        return interaction.editReply({ content: `✅ Sent ${testLevels.length} test alerts to <#${SWEEP_ALERT_CH_ID}>.` });
      }

      if (commandName === 'setup-sweep-alerts') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        const everyoneRole = guild.roles.everyone;

        // Create two alert roles
        let tcRole = guild.roles.cache.find(r => r.name === '📈 Time Cycle Alerts');
        if (!tcRole) tcRole = await guild.roles.create({ name: '📈 Time Cycle Alerts', color: 0x22d3ee, mentionable: true, reason: 'Sweep Alerts system' });
        SWEEP_TC_ROLE_ID = tcRole.id;

        let qtRole = guild.roles.cache.find(r => r.name === '📐 QT Theory Alerts');
        if (!qtRole) qtRole = await guild.roles.create({ name: '📐 QT Theory Alerts', color: 0xa78bfa, mentionable: true, reason: 'Sweep Alerts system' });
        SWEEP_QT_ROLE_ID = qtRole.id;

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

        // #📡〢sweep-alerts — only TC or QT role holders can see
        let alertCh = guild.channels.cache.find(c => c.name === '📡〢sweep-alerts');
        if (!alertCh) {
          alertCh = await guild.channels.create({
            name: '📡〢sweep-alerts', type: 0, parent: alertCat.id,
            permissionOverwrites: [
              { id: everyoneRole.id, deny: ['ViewChannel'] },
              { id: tcRole.id, allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
              { id: qtRole.id, allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
              { id: STAFF_ROLE_IDS[0], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
              { id: STAFF_ROLE_IDS[1], allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
            ],
          });
        }
        SWEEP_ALERT_CH_ID = alertCh.id;

        // Self-assign embed with two buttons
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('sweep_tc_toggle').setLabel('📈  Time Cycle Alerts').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('sweep_qt_toggle').setLabel('📐  QT Theory Alerts').setStyle(ButtonStyle.Secondary),
        );
        const embed = new EmbedBuilder()
          .setColor(0x22d3ee)
          .setTitle('📡  NQ Sweep Alerts')
          .setDescription(`Select the framework you trade. You can hold **both roles** — alerts fire in <#${alertCh.id}>.\n\n⚠️ **Data has a ~10 minute delay.** Alerts are informational, not real-time execution signals.`)
          .addFields(
            {
              name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📈  TIME CYCLE ALERTS',
              value:
                '**Universal Levels** *(always active)*\n' +
                '`PDH / PDL` — Previous Day High & Low\n' +
                '`PWH / PWL` — Previous Week High & Low\n' +
                '`PMH / PML` — Previous Month High & Low\n' +
                '`PreMH / PreML` — Pre-Market High & Low\n\n' +
                '**Cross-Session PXH / PXL**\n' +
                '`Asia H/L` built `18:00–02:30 ET` → alerted during **London**\n' +
                '`London H/L` built `02:30–07:00 ET` → alerted during **NY Morning**\n' +
                '`NY Morning H/L` built `07:00–11:30 ET` → alerted during **NY PM**',
              inline: false,
            },
            {
              name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📐  QT THEORY ALERTS',
              value:
                '**Universal Levels** *(same as above)*\n' +
                '`PDH / PDL` · `PWH / PWL` · `PMH / PML` · `PreMH / PreML`\n\n' +
                '**True Opens** *(Q2 open of each session)*\n' +
                '`TAO` 19:30 ET · `TLO` 01:30 ET · `TNY` 07:30 ET · `TPM` 13:30 ET\n\n' +
                '**90-Min Q Block Sweeps** *(previous Q H/L swept in current Q)*\n' +
                '`Asia Q1` 18:00–19:30 → `Q2` 19:30–21:00 → `Q3` 21:00–22:30\n' +
                '`London Q1` 00:00–01:30 → `Q2` 01:30–03:00 → `Q3` 03:00–04:30\n' +
                '`NY AM Q1` 06:00–07:30 → `Q2` 07:30–09:00 → `Q3` 09:00–10:30\n' +
                '`NY PM Q1` 12:00–13:30 → `Q2` 13:30–15:00 → `Q3` 15:00–16:30',
              inline: false,
            },
            {
              name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              value: 'Click a button below to **toggle your role on or off**.',
              inline: false,
            }
          )
          .setFooter({ text: 'The Smart Money Paradigm  ·  Data via Yahoo Finance  ·  ~10 min data delay' });

        await rolesAlertCh.send({ embeds: [embed], components: [row] });

        return interaction.editReply({
          content: `✅ Done!\n\n**Roles:** <@&${tcRole.id}> · <@&${qtRole.id}>\n**Alert channel:** <#${alertCh.id}>\n**Self-assign:** <#${rolesAlertCh.id}>`,
        });
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

        // VC self-assign button in alert-roles
        const vcRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('vc_alert_toggle').setLabel('📅  VC Session Alerts').setStyle(ButtonStyle.Success),
        );
        const vcEmbed = new EmbedBuilder()
          .setColor(0xfbbf24)
          .setTitle('📅  VC Session Alerts')
          .setDescription(`Get pinged when a VC session is scheduled.\n\nCountdown updates live in <#${vcSchedCh.id}> with a **15-min warning** before it starts.\n\nClick below to toggle your role.`)
          .setFooter({ text: 'The Smart Money Paradigm  ·  VC Schedule' });
        await rolesAlertCh.send({ embeds: [vcEmbed], components: [vcRow] });

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
        const hostInput  = interaction.options.getString('host');
        const host       = hostInput ?? interaction.member.displayName;

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
        _vcCountdown = { messageId: sentMsg.id, vcChannelName: vcChName, sessionNote: note, host, startEpoch, intervalId, warned15: false };

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
        return interaction.reply({ content: '✅ VC countdown cancelled.', ephemeral: true });
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
    }

    // ── Button interactions ──
    if (interaction.isButton()) {
      const { guild, member, customId } = interaction;

      // ── Sweep role toggles ──
      if (customId === 'sweep_tc_toggle' || customId === 'sweep_qt_toggle') {
        await interaction.deferReply({ ephemeral: true });
        const isTC = customId === 'sweep_tc_toggle';
        // Lazy-load role IDs if missing
        if (!SWEEP_TC_ROLE_ID) { const r = interaction.guild.roles.cache.find(r => r.name === '📈 Time Cycle Alerts'); if (r) SWEEP_TC_ROLE_ID = r.id; }
        if (!SWEEP_QT_ROLE_ID) { const r = interaction.guild.roles.cache.find(r => r.name === '📐 QT Theory Alerts');  if (r) SWEEP_QT_ROLE_ID = r.id; }
        const roleId = isTC ? SWEEP_TC_ROLE_ID : SWEEP_QT_ROLE_ID;
        const roleName = isTC ? '📈 Time Cycle Alerts' : '📐 QT Theory Alerts';
        if (!roleId) return interaction.editReply({ content: 'Role not found. Ask staff to run `/setup-sweep-alerts`.' });
        const m = interaction.member;
        const has = m.roles.cache.has(roleId);
        if (has) {
          await m.roles.remove(roleId);
          return interaction.editReply({ content: `🔕 Removed **${roleName}** — you will no longer receive these alerts.` });
        } else {
          await m.roles.add(roleId);
          return interaction.editReply({ content: `🔔 Added **${roleName}** — you will now be pinged for these NQ sweeps.` });
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

      // ── Open ticket ──
      if (customId === 'open_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const hasVolume = Object.values(VOLUME_ROLES).some(v => member.roles.cache.has(v.id));
        if (hasVolume) return interaction.editReply({ content: 'You already have a role assigned.' });

        // Check existing open ticket thread
        const ticketsCh = guild.channels.cache.get(TICKETS_CH_ID);
        const existing = ticketsCh.threads.cache.find(
          t => t.name === `ticket-${member.user.username}` && !t.archived
        );
        if (existing) return interaction.editReply({ content: `You already have an open ticket: ${existing}` });

        // Create private thread in tickets channel
        const thread = await ticketsCh.threads.create({
          name: `ticket-${member.user.username}`,
          autoArchiveDuration: 1440,
          type: 12, // PRIVATE_THREAD
          invitable: false,
          reason: `Access request from ${member.user.tag}`,
        });

        // Add only the requesting member
        await thread.members.add(member.user.id);

        // Add only staff members
        const allMembers = await guild.members.fetch();
        for (const m of allMembers.values()) {
          if (m.user.bot) continue;
          if (STAFF_ROLE_IDS.some(id => m.roles.cache.has(id))) {
            await thread.members.add(m.id).catch(() => {});
          }
        }

        // Staff assignment buttons with correct colors
        const assignRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`assign_vol1_${member.user.id}`)
            .setLabel('Volume I')
            .setStyle(ButtonStyle.Success),   // green
          new ButtonBuilder()
            .setCustomId(`assign_vol2_${member.user.id}`)
            .setLabel('Volume II')
            .setStyle(ButtonStyle.Primary),   // blurple (closest to gold)
          new ButtonBuilder()
            .setCustomId(`assign_vol3_${member.user.id}`)
            .setLabel('Volume III')
            .setStyle(ButtonStyle.Danger),    // red
        );

        // Close ticket button
        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`close_ticket_${member.user.id}`)
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Secondary),
        );

        await thread.send({
          content: `<@${member.user.id}> — a staff member will be with you shortly.`,
        });

        const staffEmbed = new EmbedBuilder()
          .setColor(0x111111)
          .setDescription(
            `**<@${member.user.id}>** is requesting access.\n\nAssign their role below.`
          );

        await thread.send({ embeds: [staffEmbed], components: [assignRow] });
        await thread.send({ components: [closeRow] });

        return interaction.editReply({ content: `Ticket opened: ${thread}` });
      }

      // ── Assign volume role ──
      if (customId.startsWith('assign_vol')) {
        await interaction.deferReply({ ephemeral: true });

        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.editReply({ content: 'Only staff can assign roles.' });

        const parts = customId.split('_');
        const volKey = parts[1] === 'vol1' ? 'Vol I' : parts[1] === 'vol2' ? 'Vol II' : 'Vol III';
        const targetUserId = parts[2];
        const roleId = VOLUME_ROLES[volKey].id;

        const targetMember = await guild.members.fetch(targetUserId).catch(() => null);
        if (!targetMember) return interaction.editReply({ content: 'Member not found.' });

        await targetMember.roles.remove(PENDING_ROLE_ID).catch(() => {});
        await targetMember.roles.add(roleId);
        await targetMember.roles.add(MENTEE_ROLE_ID);

        await interaction.channel.send(
          `✅ <@${targetUserId}> assigned **${volKey}** by <@${interaction.user.id}>. Welcome.`
        );

        await interaction.editReply({ content: `Done. ${volKey} assigned.` });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
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
        await interaction.channel.delete().catch(() => {});
      }
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
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const isStaff = STAFF_ROLE_IDS.some(id => message.member?.roles.cache.has(id));
  const cmd = message.content.trim().toLowerCase();

  if (cmd === '!economic-calendar') {
    if (!isStaff) return message.reply({ content: 'No permission.', allowedMentions: { repliedUser: false } });
    if (!ENV_CH_ID) return message.reply({ content: 'Run `/setup-economic-calendar` first.', allowedMentions: { repliedUser: false } });
    await message.reply({ content: 'Posting...', allowedMentions: { repliedUser: false } });
    await postEnvCalendar(message.guild).catch(e => console.error('text cmd env err:', e.message));
    return;
  }
});

// ── Auto-assign Pending + welcome on join ──
client.on(Events.GuildMemberAdd, async member => {
  const { guild } = member;

  try {
    await member.roles.add(PENDING_ROLE_ID);
  } catch (e) {
    console.warn('Pending role error:', e.message);
  }

  try {
    const welcomeCh = guild.channels.cache.get(WELCOME_CH_ID);
    if (!welcomeCh) return;

    const cardBuffer = await buildWelcomeCard(member, guild.memberCount);
    const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome.png' });

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x0a0a0a)
      .setDescription(
        `## Welcome, <@${member.user.id}>\n\n` +
        `*Not everyone who enters leaves the same.*\n\n` +
        `Head to <#${ROLES_CH_ID}> and request access to unlock the server.`
      )
      .setImage('attachment://welcome.png')
      .setFooter({ text: 'The Smart Money Paradigm  ·  The market is engineered. Learn the engineering.' });

    await welcomeCh.send({ embeds: [welcomeEmbed], files: [attachment] });

  } catch (e) {
    console.error('Welcome error:', e.message);
  }
});

client.once(Events.ClientReady, () => {
  console.log(`TsmpBot online — ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    const cal = guild.channels.cache.find(c => c.name === '📅〢economic-calendar' && c.parentId === ENV_CATEGORY_ID);
    if (cal) { ENV_CH_ID = cal.id; console.log('economic-calendar channel found:', ENV_CH_ID); }
    const eng = guild.channels.cache.find(c => c.name === '🧠〢environment-selection' && c.parentId === ENV_CATEGORY_ID);
    if (eng) { ENV_ENGINE_CH_ID = eng.id; console.log('environment-selection channel found:', ENV_ENGINE_CH_ID); }
    const tcRole = guild.roles.cache.find(r => r.name === '📈 Time Cycle Alerts');
    if (tcRole) { SWEEP_TC_ROLE_ID = tcRole.id; console.log('TC Alerts role found:', SWEEP_TC_ROLE_ID); }
    const qtRole = guild.roles.cache.find(r => r.name === '📐 QT Theory Alerts');
    if (qtRole) { SWEEP_QT_ROLE_ID = qtRole.id; console.log('QT Alerts role found:', SWEEP_QT_ROLE_ID); }
    const sweepCh = guild.channels.cache.find(c => c.name === '📡〢sweep-alerts');
    if (sweepCh) { SWEEP_ALERT_CH_ID = sweepCh.id; console.log('sweep-alerts channel found:', SWEEP_ALERT_CH_ID); }
    const sweepRolesCh = guild.channels.cache.find(c => c.name === '🔔〢alert-roles');
    if (sweepRolesCh) { SWEEP_ROLES_CH_ID = sweepRolesCh.id; }
    const vcRole = guild.roles.cache.find(r => r.name === '📅 VC Alerts');
    if (vcRole) { VC_ALERT_ROLE_ID = vcRole.id; }
    const vcSchedCh = guild.channels.cache.find(c => c.name === '📅〢vc-schedule');
    if (vcSchedCh) { VC_SCHED_CH_ID = vcSchedCh.id; }
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

  // Start NQ sweep monitor — refresh levels then poll every 30s
  _refreshNQLevels().then(() => {
    setInterval(() => {
      _pollNQSweeps().catch(e => console.warn('sweep poll err:', e.message));
    }, SWEEP_POLL_MS);
    console.log('NQ sweep monitor started (every 30s, ~10min data delay)');
  }).catch(e => console.warn('NQ level init failed:', e.message));

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

app.post('/sweep', async (req, res) => {
  try {
    const { level, direction, price, secret, ticker } = req.body;

    if (secret !== SWEEP_WEBHOOK_SECRET) {
      return res.status(403).json({ error: 'forbidden' });
    }
    if (!level || !direction) {
      return res.status(400).json({ error: 'missing level or direction' });
    }
    if (!SWEEP_ALERT_CH_ID || !SWEEP_ROLE_ID) {
      return res.status(503).json({ error: 'sweep alerts not configured — run /setup-sweep-alerts' });
    }

    const guild = client.guilds.cache.first();
    if (!guild) return res.status(503).json({ error: 'bot not ready' });
    const ch = guild.channels.cache.get(SWEEP_ALERT_CH_ID);
    if (!ch) return res.status(503).json({ error: 'alert channel not found' });

    const labelName = LEVEL_LABELS[level.toUpperCase()] || level.toUpperCase();
    const isAbove = direction === 'broken_above' || direction === 'swept_above' || direction === 'above';
    const dirLabel = isAbove ? '🔺 SWEPT ABOVE' : '🔻 SWEPT BELOW';
    const dirColor = isAbove ? 0x22d3ee : 0xf87171;
    const sym = ticker || 'NQ';
    const priceStr = price ? `**${parseFloat(price).toFixed(2)}**` : '—';

    const nyTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true, timeZone: 'America/New_York'
    });

    const embed = new EmbedBuilder()
      .setColor(dirColor)
      .setTitle(`${dirLabel}  ·  ${labelName}`)
      .setDescription(
        `**${sym}** swept through the **${labelName}**\n\n` +
        `Price: ${priceStr}\n` +
        `Direction: ${isAbove ? 'Above — potential liquidity grab above' : 'Below — potential liquidity grab below'}\n` +
        `Time: \`${nyTime} ET\``
      )
      .setFooter({ text: 'The Smart Money Paradigm  ·  NQ Sweep Alert' })
      .setTimestamp();

    await ch.send({ content: `<@&${SWEEP_ROLE_ID}>`, embeds: [embed] });
    res.json({ ok: true });
  } catch (e) {
    console.error('Sweep webhook error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (_, res) => res.json({ ok: true, bot: client.user?.tag || 'starting' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server listening on port ${PORT}`));

client.login(process.env.TOKEN);

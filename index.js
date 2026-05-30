require('dotenv').config();
const path = require('path');
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

  const weekLabel = 'Session-by-Session Trading Protocol  ·  Week of ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) + '  ·  All times ET';
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
    const d = (8 - dow) % 7 || 7;
    monday.setDate(nyNow.getDate() + d);
  } else {
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
  const days = {};
  for (const e of events) {
    const k = fmtEventDate(e.date);
    if (!days[k]) days[k] = [];
    days[k].push(e);
  }

  const W = 980, PAD = 48, ROW_H = 54, DAY_HEADER_H = 64, SECTION_GAP = 24;
  let H = 210;
  for (const k of Object.keys(days)) H += DAY_HEADER_H + days[k].length * ROW_H + SECTION_GAP;
  H += 70;
  if (events.length === 0) H = 280;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0b0d10';
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, 'rgba(255,255,255,0)');
  topBar.addColorStop(0.35, 'rgba(255,255,255,0.2)');
  topBar.addColorStop(0.65, 'rgba(255,255,255,0.2)');
  topBar.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = topBar; ctx.fillRect(0, 0, W, 2);

  // Left accent bar
  const leftBar = ctx.createLinearGradient(0, 80, 0, H - 80);
  leftBar.addColorStop(0, 'rgba(255,255,255,0)');
  leftBar.addColorStop(0.2, 'rgba(255,255,255,0.14)');
  leftBar.addColorStop(0.8, 'rgba(255,255,255,0.14)');
  leftBar.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = leftBar; ctx.fillRect(0, 0, 2, H);

  // Header
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = '10px Jakarta400';
  ctx.fillText('T H E   S M A R T   M O N E Y   P A R A D I G M', PAD, 48);

  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.4)'; ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px Jakarta700';
  ctx.fillText('Economic Calendar', PAD, 98);
  ctx.restore();

  const weekLabel = 'USD High & Medium Impact News  ·  Week of ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) + '  ·  All times ET';
  ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = '13px Jakarta400';
  ctx.fillText(weekLabel, PAD, 126);

  // Legend
  ctx.save();
  ctx.shadowColor = 'rgba(239,68,68,0.9)'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(PAD + 6, 152, 5, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px Jakarta400';
  ctx.fillText('High Impact', PAD + 16, 156);
  ctx.save();
  ctx.shadowColor = 'rgba(234,179,8,0.9)'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(PAD + 118, 152, 5, 0, Math.PI * 2); ctx.fillStyle = '#eab308'; ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px Jakarta400';
  ctx.fillText('Medium Impact', PAD + 128, 156);

  const ruleG = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  ruleG.addColorStop(0, 'rgba(255,255,255,0.2)');
  ruleG.addColorStop(0.5, 'rgba(255,255,255,0.07)');
  ruleG.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = ruleG; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, 170); ctx.lineTo(W - PAD, 170); ctx.stroke();

  // Column labels
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '9px Jakarta400';
  ctx.fillText('TIME', PAD + 22, 188);
  ctx.fillText('EVENT', PAD + 124, 188);
  ctx.textAlign = 'right';
  ctx.fillText('FORECAST', W - PAD - 130, 188);
  ctx.fillText('PREVIOUS', W - PAD, 188);
  ctx.textAlign = 'left';
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath(); ctx.moveTo(PAD, 194); ctx.lineTo(W - PAD, 194); ctx.stroke();

  if (events.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '14px Jakarta400';
    ctx.fillText('No USD high/medium impact events this week.', PAD, 240);
    return canvas.toBuffer('image/png');
  }

  let y = 198;

  for (const dayKey of Object.keys(days)) {
    const evts = days[dayKey];

    ctx.fillStyle = 'rgba(255,255,255,0.028)';
    ctx.fillRect(0, y, W, DAY_HEADER_H);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(0, y, 3, DAY_HEADER_H);

    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.25)'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px Jakarta700';
    ctx.fillText(dayKey, PAD, y + 40);
    ctx.restore();

    ctx.font = 'bold 16px Jakarta700';
    const dayNameW = ctx.measureText(dayKey).width;
    const badgeText = evts.length + ' event' + (evts.length > 1 ? 's' : '');
    ctx.font = '10px Jakarta400';
    const badgeW = ctx.measureText(badgeText).width + 20;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.roundRect(PAD + dayNameW + 16, y + 22, badgeW, 20, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(badgeText, PAD + dayNameW + 26, y + 36);

    y += DAY_HEADER_H;

    for (let i = 0; i < evts.length; i++) {
      const e = evts[i];
      const isHigh = e.impact === 'High';

      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.013)';
        ctx.fillRect(0, y, W, ROW_H);
      }

      ctx.save();
      ctx.shadowColor = isHigh ? 'rgba(239,68,68,1)' : 'rgba(234,179,8,1)'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(PAD + 8, y + ROW_H / 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = isHigh ? '#ef4444' : '#eab308'; ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '12px Jakarta400';
      ctx.fillText(fmtEventTime(e.date), PAD + 22, y + ROW_H / 2 + 4);

      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD + 110, y + 10); ctx.lineTo(PAD + 110, y + ROW_H - 10); ctx.stroke();

      ctx.save();
      if (isHigh) { ctx.shadowColor = 'rgba(255,255,255,0.15)'; ctx.shadowBlur = 8; }
      ctx.fillStyle = isHigh ? '#ffffff' : 'rgba(255,255,255,0.7)';
      ctx.font = (isHigh ? 'bold ' : '') + '14px Jakarta' + (isHigh ? '700' : '400');
      ctx.fillText(e.title, PAD + 124, y + ROW_H / 2 + 5);
      ctx.restore();

      ctx.textAlign = 'right';
      ctx.fillStyle = e.forecast ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
      ctx.font = '12px Jakarta400';
      ctx.fillText(e.forecast || '—', W - PAD - 130, y + ROW_H / 2 + 4);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillText(e.previous || '—', W - PAD, y + ROW_H / 2 + 4);
      ctx.textAlign = 'left';

      ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, y + ROW_H - 1); ctx.lineTo(W - PAD, y + ROW_H - 1); ctx.stroke();

      y += ROW_H;
    }
    y += SECTION_GAP;
  }

  ctx.strokeStyle = ruleG; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y + 12); ctx.lineTo(W - PAD, y + 12); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.font = 'italic 11px Jakarta300i';
  ctx.fillText('Source: ForexFactory  ·  USD events only  ·  High ● Red   Medium ● Yellow  ·  The Smart Money Paradigm', PAD, y + 32);

  return canvas.toBuffer('image/png');
}

async function postEnvCalendar(guild) {
  if (!ENV_CH_ID) return;
  const ch = guild.channels.cache.get(ENV_CH_ID);
  if (!ch) return;

  const events = await fetchUSDEvents();
  const cardBuffer = await buildEnvCalendarCard(events);
  const attachment = new AttachmentBuilder(cardBuffer, { name: 'env-calendar.png' });

  const embed = new EmbedBuilder()
    .setColor(0x0a0a0a)
    .setDescription(
      `**⌬ Economic Calendar — Weekly USD Events**\n\n` +
      `*Know your environment before you trade it.*\n\n` +
      `High & medium impact USD events for the week ahead. Plan around these — not through them.`
    )
    .setImage('attachment://env-calendar.png')
    .setFooter({ text: 'The Smart Money Paradigm  ·  The market is engineered. Learn the engineering.' });

  await ch.send({ content: `@everyone`, embeds: [embed], files: [attachment] });
}

async function postEnvEngine(guild, { ping = true } = {}) {
  if (!ENV_ENGINE_CH_ID) return;
  const ch = guild.channels.cache.get(ENV_ENGINE_CH_ID);
  if (!ch) return;

  const allEvents = await fetchAllUSDEvents('thisweek');
  if (allEvents.length === 0) return;

  // Cache for button clicks
  const weekData = buildEnvEngineWeek(allEvents);
  _envWeekCache = { ts: Date.now(), allEvents, weekData };

  const cardBuffer = await buildEnvEngineCard(allEvents);
  const attachment = new AttachmentBuilder(cardBuffer, { name: 'env-engine.png' });

  const headerEmbed = new EmbedBuilder()
    .setColor(0x0b0d10)
    .setDescription(
      `**⌬ Environment Selection — Weekly Session Protocol**\n\n` +
      `*Not every session is created equal. Know when to trade and when to stay flat.*\n\n` +
      `Click a day below to see the full session breakdown, events, and execution protocol.`
    )
    .setImage('attachment://env-engine.png')
    .setFooter({ text: 'The Smart Money Paradigm  ·  The market is engineered. Learn the engineering.' });

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

        await postEnvCalendar(guild);
        return interaction.editReply({ content: 'Economic calendar posted.' });
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
        await interaction.editReply({ content: `Preview for **${week}** (${events.length} events):`, files: [attachment] });
      }

      if (commandName === 'env-engine') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: 'No permission.', ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        if (!ENV_CH_ID) return interaction.editReply({ content: 'Run `/setup-economic-calendar` first to create the channel.' });

        await postEnvEngine(guild);
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
          content: `**Environment Selection preview — ${week}**\nClick a day to see full breakdown.`,
          files: [attachment],
          components: [buildDayButtons()],
        });
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

      // ── Roadmap question ──
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
  }

  // Sunday 19:00 ET scheduler (FF always publishes next week by then; ~12:30am IST Monday)
  function scheduleNextSunday() {
    const now = new Date();
    const nyNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const next = new Date(nyNow);
    // Find next Sunday 19:00 ET
    const daysUntilSun = (7 - nyNow.getDay()) % 7 || 7;
    next.setDate(nyNow.getDate() + daysUntilSun);
    next.setHours(19, 0, 0, 0);
    // If today is Sunday and we haven't hit 19:00 yet, post today
    if (nyNow.getDay() === 0 && nyNow.getHours() < 19) {
      next.setDate(nyNow.getDate());
    }
    const msUntil = next - nyNow;
    console.log(`Next env calendar post in ${Math.round(msUntil / 1000 / 60)} minutes`);
    setTimeout(async () => {
      for (const guild of client.guilds.cache.values()) {
        await postEnvCalendar(guild).catch(e => console.error('env calendar post err:', e.message));
        await new Promise(r => setTimeout(r, 2000));
        await postEnvEngine(guild).catch(e => console.error('env engine post err:', e.message));
      }
      scheduleNextSunday(); // reschedule for next week
    }, msUntil);
  }
  scheduleNextSunday();
});

client.login(process.env.TOKEN);

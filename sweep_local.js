/**
 * sweep_local.js — local NQ sweep detector via TradingView MCP CDP
 *
 * Requires:
 *   - TradingView Desktop open with NQ1! chart + TSMP Sweep Alerts indicator
 *   - TV launched with --remote-debugging-port=9222
 *   - npm install chrome-remote-interface form-data
 *
 * Run: node sweep_local.js
 * Auto-restart: pm2 start sweep_local.js --name sweep-local
 */

import CDP from 'chrome-remote-interface';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const BOT_URL        = 'https://tsmpbot-production.up.railway.app';
const SWEEP_SECRET   = 'tsmp_sweep_secret';
const POLL_MS        = 2000;   // 2s poll — real-time
const SCREENSHOT_TF  = '15';   // 15m chart for screenshot
const STATE_FILE     = path.join(__dirname, 'data', 'local_swept.json');

const LEVEL_LABELS = {
  PDH: 'Previous Day High',   PDL: 'Previous Day Low',
  PWH: 'Previous Week High',  PWL: 'Previous Week Low',
  PMH: 'Previous Month High', PML: 'Previous Month Low',
  PreMH: 'Pre-Market High',   PreML: 'Pre-Market Low',
  ASH: 'Asia High',           ASL: 'Asia Low',
  LOH: 'London High',         LOL: 'London Low',
  NYAH: 'NY Morning High',    NYAL: 'NY Morning Low',
  NYPH: 'NY Afternoon High',  NYPL: 'NY Afternoon Low',
};

// ── State ────────────────────────────────────────────────────────────────────
let _cdp = null;
let _swept = {};      // { [levelKey]: true } — one-shot locks
let _lastDay = null;  // ET date string for daily reset

// ── CDP connection ───────────────────────────────────────────────────────────
async function getCDP() {
  if (_cdp) {
    try { await _cdp.Runtime.evaluate({ expression: '1', returnByValue: true }); return _cdp; }
    catch { _cdp = null; }
  }
  const targets = await fetch('http://localhost:9222/json/list').then(r => r.json());
  const target  = targets.find(t => t.type === 'page' && /tradingview\.com\/chart/i.test(t.url))
                || targets.find(t => t.type === 'page' && /tradingview/i.test(t.url));
  if (!target) throw new Error('No TradingView chart found. Is TV Desktop open with a chart?');
  _cdp = await CDP({ host: 'localhost', port: 9222, target: target.id });
  await _cdp.Runtime.enable();
  await _cdp.Page.enable();
  return _cdp;
}

async function evaluate(expr) {
  const c = await getCDP();
  const r = await c.Runtime.evaluate({ expression: expr, returnByValue: true, awaitPromise: false });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'JS error');
  return r.result?.value;
}

// ── Get real-time quote from chart ───────────────────────────────────────────
async function getPrice() {
  const data = await evaluate(`
    (function() {
      try {
        var chart = window.TradingViewApi._activeChartWidgetWV.value()._chartWidget;
        var bars  = chart.model().mainSeries().bars();
        var last  = bars.valueAt(bars.lastIndex());
        if (!last) return null;
        return { high: last[2], low: last[3], close: last[4] };
      } catch(e) { return null; }
    })()`);
  return data;
}

// ── Get Pine Script line levels from TSMP Sweep Alerts indicator ─────────────
async function getLevels() {
  const data = await evaluate(`
    (function() {
      try {
        var chart   = window.TradingViewApi._activeChartWidgetWV.value()._chartWidget;
        var sources = chart.model().model().dataSources();
        var levels  = {};
        for (var i = 0; i < sources.length; i++) {
          var s = sources[i];
          if (!s.metaInfo) continue;
          var meta = s.metaInfo();
          var name = meta.description || meta.shortDescription || '';
          if (name.indexOf('TSMP Sweep') === -1) continue;
          // Read plot values from data window
          var plots = s._lastJsStudyBarUpdateArgs;
          if (plots && plots.plotValues) {
            plots.plotValues.forEach(function(p) {
              if (p.id && p.value != null) levels[p.id] = p.value;
            });
          }
        }
        return levels;
      } catch(e) { return {}; }
    })()`);
  return data || {};
}

// ── Get Pine lines (horizontal) from indicator ───────────────────────────────
async function getPineLines() {
  const data = await evaluate(`
    (function() {
      try {
        var chart   = window.TradingViewApi._activeChartWidgetWV.value()._chartWidget;
        var sources = chart.model().model().dataSources();
        var result  = {};
        for (var i = 0; i < sources.length; i++) {
          var s = sources[i];
          if (!s.metaInfo) continue;
          var name = (s.metaInfo().description || s.metaInfo().shortDescription || '');
          if (name.indexOf('TSMP Sweep') === -1) continue;
          // Read study data window values (plots)
          var dw = s.data && s.data();
          if (dw && dw.values) {
            var vals = dw.values;
            var meta = s.metaInfo();
            if (meta.plots) {
              meta.plots.forEach(function(p, idx) {
                if (vals[idx] != null) result[p.id] = vals[idx];
              });
            }
          }
        }
        return result;
      } catch(e) { return null; }
    })()`);
  return data;
}

// ── Get study values via data window items (title → value) ───────────────────
async function getStudyValues() {
  const data = await evaluate(`
    (function() {
      try {
        var chart   = window.TradingViewApi._activeChartWidgetWV.value()._chartWidget;
        var sources = chart.model().model().dataSources();
        for (var i = 0; i < sources.length; i++) {
          var s = sources[i];
          if (!s.metaInfo) continue;
          var name = s.metaInfo().description || s.metaInfo().shortDescription || '';
          if (name.indexOf('TSMP Sweep') === -1) continue;

          var result = {};

          // Method 1: data window view items (title/value pairs) — most reliable
          if (s._dataWindowView && s._dataWindowView._items) {
            var items = s._dataWindowView._items;
            items.forEach(function(item) {
              if (item._title && item._value != null) {
                var v = parseFloat(String(item._value).replace(/,/g, ''));
                if (!isNaN(v)) result[item._title] = v;
              }
            });
            if (Object.keys(result).length > 0) return result;
          }

          // Method 2: _lastNonEmptyPlotRowCache — raw value array
          if (s._lastNonEmptyPlotRowCache) {
            var cache = s._lastNonEmptyPlotRowCache;
            var key = Object.keys(cache)[0];
            if (key && cache[key] && cache[key].value) {
              var vals = cache[key].value;
              var meta = s.metaInfo();
              if (meta.plots) {
                meta.plots.forEach(function(p, idx) {
                  if (vals[idx + 1] != null) result[p.id] = vals[idx + 1];
                });
              }
              if (Object.keys(result).length > 0) return result;
            }
          }
        }
        return null;
      } catch(e) { return null; }
    })()`);
  return data;
}

// ── Get all indicator entity_ids ─────────────────────────────────────────────
async function getIndicatorIds() {
  return evaluate(`
    (function() {
      try {
        var chart   = window.TradingViewApi._activeChartWidgetWV.value()._chartWidget;
        var sources = chart.model().model().dataSources();
        var result  = [];
        for (var i = 0; i < sources.length; i++) {
          var s = sources[i];
          if (!s.metaInfo) continue;
          var meta = s.metaInfo();
          var name = meta.description || meta.shortDescription || '';
          if (name && name.indexOf('TSMP Sweep') === -1) {
            result.push({ id: s._id || s.id, name: name });
          }
        }
        return result;
      } catch(e) { return []; }
    })()`);
}

// ── Hide/show indicators ─────────────────────────────────────────────────────
async function setIndicatorVisible(entityId, visible) {
  await evaluate(`
    (function() {
      try {
        var chart   = window.TradingViewApi._activeChartWidgetWV.value()._chartWidget;
        var sources = chart.model().model().dataSources();
        for (var i = 0; i < sources.length; i++) {
          var s = sources[i];
          if ((s._id || s.id) === ${JSON.stringify(entityId)}) {
            if (s.setVisible) s.setVisible(${visible});
            else if (s._pane && s._pane.setStudyVisible) s._pane.setStudyVisible(s, ${visible});
          }
        }
      } catch(e) {}
    })()`);
}

// ── Change timeframe ──────────────────────────────────────────────────────────
async function setTimeframe(tf) {
  await evaluate(`
    window.TradingViewApi._activeChartWidgetWV.value().setResolution(${JSON.stringify(tf)}, {})`);
  await sleep(1500); // wait for chart to update
}

// ── Take screenshot via CDP Page.captureScreenshot ───────────────────────────
async function takeScreenshot() {
  const c = await getCDP();
  const { data } = await c.Page.captureScreenshot({ format: 'png', quality: 100 });
  return Buffer.from(data, 'base64');
}

// ── Post sweep alert with screenshot to bot ───────────────────────────────────
async function postSweepAlert({ level, direction, price, screenshot }) {
  const form = new FormData();
  form.append('secret', SWEEP_SECRET);
  form.append('level', level);
  form.append('direction', direction);
  form.append('price', String(price));
  form.append('ticker', 'NQ');
  form.append('source', 'local');
  if (screenshot) {
    form.append('screenshot', screenshot, { filename: 'chart.png', contentType: 'image/png' });
  }

  return new Promise((resolve, reject) => {
    const url = new URL(BOT_URL + '/sweep-local');
    const opts = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: form.getHeaders(),
    };
    const req = (url.protocol === 'https:' ? https : http).request(opts, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    form.pipe(req);
  });
}

// ── ET time helpers ───────────────────────────────────────────────────────────
function nyTime() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); }
function nyHM()   { const t = nyTime(); return t.getHours() * 60 + t.getMinutes(); }

// ── State persistence ─────────────────────────────────────────────────────────
function saveState() {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify({ _swept, _lastDay })); } catch {}
}
function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const today = nyTime().toDateString();
    if (s._lastDay === today) { _swept = s._swept || {}; _lastDay = s._lastDay; }
  } catch {}
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Map Pine plot IDs → level keys ───────────────────────────────────────────
// Our indicator plots in this order: PDH PDL PWH PWL PMH PML PreMH PreML ASH ASL LOH LOL NYAH NYAL NYPH NYPL
const PLOT_ORDER = ['PDH','PDL','PWH','PWL','PMH','PML','PreMH','PreML','ASH','ASL','LOH','LOL','NYAH','NYAL','NYPH','NYPL'];

// ── Main poll loop ────────────────────────────────────────────────────────────
async function poll() {
  const today = nyTime().toDateString();
  const hm    = nyHM();

  // Daily reset
  if (_lastDay !== today) {
    _lastDay = today;
    Object.keys(_swept).filter(k =>
      ['PDH','PDL','PreM','ASH','ASL','LOH','LOL','NYA','NYP'].some(p => k.startsWith(p))
    ).forEach(k => delete _swept[k]);
    saveState();
    console.log('[sweep] Daily reset —', today);
  }

  // Get current price
  const q = await getPrice();
  if (!q || !q.high || !q.low) return;
  const { high, low, close } = q;

  // Get levels from Pine indicator data window (title → value)
  const sv = await getStudyValues();
  if (!sv || Object.keys(sv).length === 0) {
    console.warn('[sweep] No levels from indicator — is TSMP Sweep Alerts on chart?');
    return;
  }
  // sv keys are plot titles: PDH, PDL, PWH, PWL, etc. — use directly
  const levels = sv;

  // Determine current session
  const curSess = hm >= 1080 ? 'asia' : hm < 420 ? 'london' : hm < 690 ? 'nyam' : hm < 960 ? 'nypm' : null;

  const toFire = [];

  for (const [key, lvlPrice] of Object.entries(levels)) {
    if (!lvlPrice || isNaN(lvlPrice)) continue;
    if (_swept[key]) continue;

    // Session levels: only alert when session is closed
    const sessMap = { ASH: 'asia', ASL: 'asia', LOH: 'london', LOL: 'london', NYAH: 'nyam', NYAL: 'nyam', NYPH: 'nypm', NYPL: 'nypm' };
    if (sessMap[key] && sessMap[key] === curSess) continue;

    const isHigh = ['PDH','PWH','PMH','PreMH','ASH','LOH','NYAH','NYPH'].includes(key);
    if (isHigh && high > lvlPrice) {
      _swept[key] = true;
      toFire.push({ level: key, direction: 'above', price: lvlPrice });
    } else if (!isHigh && low < lvlPrice) {
      _swept[key] = true;
      toFire.push({ level: key, direction: 'below', price: lvlPrice });
    }
  }

  if (toFire.length === 0) return;

  saveState();
  console.log('[sweep] Levels swept:', toFire.map(a => a.level).join(', '), '| price:', close);

  // Take screenshot on 15m chart with indicators hidden
  let screenshot = null;
  try {
    const originalTF = '1'; // assume 1m chart running normally
    const indicators = await getIndicatorIds();

    // Hide all indicators except TSMP Sweep Alerts
    for (const ind of (indicators || [])) {
      await setIndicatorVisible(ind.id, false);
    }

    // Switch to 15m
    await setTimeframe(SCREENSHOT_TF);
    await sleep(2000); // let chart render

    screenshot = await takeScreenshot();
    console.log('[sweep] Screenshot taken:', screenshot.length, 'bytes');

    // Restore
    await setTimeframe(originalTF);
    await sleep(500);
    for (const ind of (indicators || [])) {
      await setIndicatorVisible(ind.id, true);
    }
  } catch (e) {
    console.warn('[sweep] Screenshot failed:', e.message);
  }

  // Post each alert
  for (const alert of toFire) {
    try {
      await postSweepAlert({ ...alert, screenshot });
      console.log('[sweep] Posted:', alert.level, alert.direction);
    } catch (e) {
      console.warn('[sweep] Post failed:', e.message);
    }
  }
}

// ── Check + handle screenshot-pending flag ────────────────────────────────────
async function checkScreenshotPending() {
  try {
    const url = `${BOT_URL}/screenshot-pending?secret=${encodeURIComponent(SWEEP_SECRET)}`;
    const data = await new Promise((resolve, reject) => {
      https.get(url, { timeout: 5000 }, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
      }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
    });
    if (!data?.pending) return;

    console.log('[screenshot] Test screenshot requested — capturing 15m chart...');

    // Take screenshot on 15m with inds hidden
    const indicators = await getIndicatorIds();
    for (const ind of (indicators || [])) await setIndicatorVisible(ind.id, false);
    await setTimeframe(SCREENSHOT_TF);
    await sleep(2000);
    const screenshot = await takeScreenshot();
    await setTimeframe('1');
    await sleep(500);
    for (const ind of (indicators || [])) await setIndicatorVisible(ind.id, true);

    // Clear flag
    await new Promise((resolve, reject) => {
      const body = JSON.stringify({ secret: SWEEP_SECRET });
      const urlObj = new URL(BOT_URL + '/screenshot-clear');
      const req = https.request({
        hostname: urlObj.hostname, port: 443, path: urlObj.pathname,
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': body.length }
      }, res => { res.resume(); res.on('end', resolve); });
      req.on('error', reject);
      req.write(body); req.end();
    });

    // Post to sweep channel as a test
    const form = new FormData();
    form.append('secret', SWEEP_SECRET);
    form.append('level', 'TEST');
    form.append('direction', 'above');
    form.append('price', '0');
    form.append('ticker', 'NQ');
    form.append('is_test', 'true');
    form.append('screenshot', screenshot, { filename: 'chart.png', contentType: 'image/png' });

    await new Promise((resolve, reject) => {
      const urlObj = new URL(BOT_URL + '/screenshot-test');
      const req = https.request({
        hostname: urlObj.hostname, port: 443, path: urlObj.pathname,
        method: 'POST', headers: form.getHeaders(),
      }, res => { let b = ''; res.on('data', d => b += d); res.on('end', () => { console.log('[screenshot] Posted:', b); resolve(); }); });
      req.on('error', reject);
      form.pipe(req);
    });

    console.log('[screenshot] Done.');
  } catch (e) {
    console.warn('[screenshot] Error:', e.message);
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('TSMP Local Sweep Monitor starting...');
  console.log('Connecting to TradingView Desktop on localhost:9222...');

  loadState();

  try {
    await getCDP();
    console.log('Connected to TradingView Desktop.');
  } catch (e) {
    console.error('Cannot connect:', e.message);
    console.error('Make sure TradingView Desktop is open and launched with --remote-debugging-port=9222');
    process.exit(1);
  }

  console.log(`Polling every ${POLL_MS}ms. Watching for NQ sweeps...`);

  let screenshotCheckCount = 0;
  while (true) {
    try { await poll(); }
    catch (e) { console.warn('[sweep] Poll error:', e.message); }

    // Check screenshot pending every 5 polls (~10s)
    if (++screenshotCheckCount >= 5) {
      screenshotCheckCount = 0;
      await checkScreenshotPending().catch(e => console.warn('[screenshot check] error:', e.message));
    }

    await sleep(POLL_MS);
  }
}

main();

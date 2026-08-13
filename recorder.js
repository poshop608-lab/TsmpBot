/**
 * Recording session manager.
 *
 * How this actually captures a screen-share, since Discord's bot API cannot:
 *   1. A headless-but-rendered Chromium (Playwright) logs into Discord's real
 *      WEB CLIENT using the bot token (same login flow a human uses, just
 *      automated), inside a virtual X display (Xvfb) so it has a real screen
 *      to render into even with no physical monitor.
 *   2. It navigates to the target voice channel and joins it like any
 *      participant, then opens whichever screen-share is active.
 *   3. ffmpeg captures that virtual display (x11grab) — i.e. it's recording
 *      the browser's own rendered output, not decoding Discord's video
 *      protocol — plus a virtual PulseAudio sink that Chromium's audio output
 *      is routed into (Discord's decoded call audio), muxed into one file.
 *   4. On stop, ffmpeg and the browser are torn down and the finished file is
 *      handed off for upload.
 *
 * Only one recording runs at a time (single virtual display/audio sink).
 */
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DISPLAY = process.env.DISPLAY || ':99';
const OUT_DIR = path.join(__dirname, 'recordings');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let session = null; // { browser, page, ffmpeg, filePath, startedAt, channelId, startedBy }

function isRecording() {
  return !!session;
}

function setupVirtualAudioSink() {
  // idempotent: ignore "already exists" errors on restart
  try { execSync('pactl load-module module-null-sink sink_name=discordcap', { stdio: 'ignore' }); } catch {}
  try { execSync('pactl set-default-sink discordcap', { stdio: 'ignore' }); } catch {}
}

async function startRecording({ token, channelId, startedByTag }) {
  if (session) throw new Error('Already recording. Run /stop first.');

  setupVirtualAudioSink();

  const browser = await chromium.launch({
    headless: false, // renders into Xvfb, not truly headless — that's the point
    args: [
      `--display=${DISPLAY}`,
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--window-position=0,0',
      '--window-size=1920,1080',
      '--start-fullscreen',
    ],
  });

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // log into Discord's web client via the bot token — same technique the
  // browser console token-login trick uses, applied at page-load time.
  await page.goto('https://discord.com/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((tok) => {
    function login(t) {
      setInterval(() => {
        document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage.token = `"${t}"`;
      }, 50);
      setTimeout(() => location.reload(), 2500);
    }
    login(tok);
  }, token);
  await page.waitForTimeout(4000);

  await page.goto(`https://discord.com/channels/@me`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2000);

  // jump straight to the voice channel via URL — requires the guild ID to be
  // resolvable from the channel; Discord accepts /channels/@me/<channelId>
  // for voice channels too once authenticated.
  await page.goto(`https://discord.com/channels/@me/${channelId}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3000);

  // best-effort: click a "Join Voice" affordance if one is present. Discord's
  // DOM/class names change over time — this is the most fragile part of the
  // whole pipeline and may need updating if Discord ships a redesign.
  try {
    const joinBtn = page.locator('[aria-label*="Join"], [class*="joinButton"]').first();
    if (await joinBtn.isVisible({ timeout: 5000 })) await joinBtn.click();
  } catch {}
  await page.waitForTimeout(2000);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `recording-${ts}.mp4`;
  const filePath = path.join(OUT_DIR, fileName);

  // capture the virtual display (video) + the virtual audio sink's monitor
  // (audio), encode together into one mp4.
  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'x11grab', '-video_size', '1920x1080', '-framerate', '30', '-i', DISPLAY,
    '-f', 'pulse', '-i', 'discordcap.monitor',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
    '-c:a', 'aac', '-b:a', '160k',
    '-pix_fmt', 'yuv420p',
    filePath,
  ]);

  ffmpeg.stderr.on('data', () => {}); // ffmpeg logs progress to stderr by default — swallow noise
  ffmpeg.on('error', (err) => console.error('[recorder] ffmpeg error:', err.message));

  session = {
    browser, page, ffmpeg, filePath, fileName,
    startedAt: Date.now(), channelId, startedByTag,
  };

  return { fileName };
}

async function stopRecording() {
  if (!session) throw new Error('No recording in progress.');
  const { browser, ffmpeg, filePath, fileName, startedAt } = session;

  await new Promise((resolve) => {
    ffmpeg.once('close', resolve);
    ffmpeg.stdin.write('q'); // graceful ffmpeg stop, finalizes the mp4 container properly
    setTimeout(() => { try { ffmpeg.kill('SIGKILL'); } catch {}; resolve(); }, 8000);
  });

  try { await browser.close(); } catch {}

  const durationMs = Date.now() - startedAt;
  session = null;

  if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1024) {
    throw new Error('Recording produced an empty/invalid file — the browser likely failed to join the channel or capture video. Check the join-flow selectors in recorder.js.');
  }

  return { filePath, fileName, durationMs };
}

module.exports = { startRecording, stopRecording, isRecording };

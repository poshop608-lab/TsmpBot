#!/bin/sh
# Boot sequence for the recording pipeline + bot.
#
# Chromium install runs here rather than at build time — Nixpacks caches the
# install phase whenever package.json/package-lock.json are unchanged, which
# was silently skipping "npx playwright install" on every build after the
# first one. Running it here means it executes on every boot, but it's a
# near-instant no-op once the browser is already present.
npx playwright install chromium

# Xvfb needs a moment to actually start listening before anything tries to
# render into :99, hence the sleep before pulseaudio/node.
Xvfb :99 -screen 0 1920x1080x24 &
sleep 2
pulseaudio --start --exit-idle-time=-1
node index.js

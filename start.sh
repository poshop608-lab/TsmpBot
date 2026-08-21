#!/bin/sh
# Boot sequence for the recording pipeline + bot.
#
# Chromium install runs here rather than at build time — Nixpacks caches the
# install phase whenever package.json/package-lock.json are unchanged, which
# was silently skipping "npx playwright install" on every build after the
# first one. Running it here means it executes on every boot, but it's a
# near-instant no-op once the browser is already present.
npx playwright install chromium

# Chromium needs the Nix-provided shared libs (glib, nss, mesa, xorg, etc.)
# on the linker path. Nix's actual install location varies by image/version
# (content-hashed /nix/store/<hash>-<pkg> paths, no fixed profile dir found
# to work reliably here), so resolve it at boot by finding every directory
# under /nix/store that actually contains a .so — self-configuring instead
# of hardcoding a guessed path that breaks on the next image rebuild.
export LD_LIBRARY_PATH="$(find /nix/store -maxdepth 3 -name '*.so*' -printf '%h\n' 2>/dev/null | sort -u | tr '\n' ':')$LD_LIBRARY_PATH"
echo "[start.sh] LD_LIBRARY_PATH resolved to: $LD_LIBRARY_PATH"

# Xvfb needs a moment to actually start listening before anything tries to
# render into :99, hence the sleep before pulseaudio/node.
Xvfb :99 -screen 0 1920x1080x24 &
sleep 2

# KNOWN BROKEN: pulseaudio refuses to start as root ("This program is not
# intended to be run as root"), and this container runs as root by default.
# Needs a real fix (dedicated non-root user, or a proper system-mode pulse
# config) — not yet done. Recording will fail to capture audio until this
# is resolved, even though the video/Chromium side now works.
pulseaudio --start --exit-idle-time=-1
node index.js

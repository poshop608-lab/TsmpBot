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
#
# Explicitly EXCLUDE glibc/libc/gcc-lib paths: shadowing the system's own
# libc via LD_LIBRARY_PATH is undefined behavior and was the direct cause of
# a "stack smashing detected"/SIGABRT crash — two different glibc store
# paths (stale + fresh, both 2.40-36) ended up on the path simultaneously
# and conflicted. Everything else Chromium needs (glib, nss, mesa, xorg
# libs, alsa, pulseaudio's client lib) is safe to inject.
export LD_LIBRARY_PATH="$(find /nix/store -maxdepth 3 -name '*.so*' -printf '%h\n' 2>/dev/null | grep -viE '/(glibc|gcc-[0-9]|xgcc)' | sort -u | tr '\n' ':')$LD_LIBRARY_PATH"
echo "[start.sh] LD_LIBRARY_PATH resolved to: $LD_LIBRARY_PATH"

# Xvfb's XKB keymap compile was failing ("Failed to activate virtual core
# keyboard") because it couldn't find the Nix-provided xkeyboard-config data
# dir on its own. Point it there directly instead of guessing at a fixed path.
XKB_DIR="$(find /nix/store -maxdepth 1 -name '*-xkeyboard-config-*' 2>/dev/null | head -1)"
if [ -n "$XKB_DIR" ]; then
  export XKB_CONFIG_ROOT="$XKB_DIR/share/X11/xkb"
  echo "[start.sh] XKB_CONFIG_ROOT resolved to: $XKB_CONFIG_ROOT"
fi

# Xvfb needs a moment to actually start listening before anything tries to
# render into :99, hence the sleep before pulseaudio/node.
Xvfb :99 -screen 0 1920x1080x24 &
sleep 2

# pulseaudio refuses to run as root outright. This container has no
# non-root user by default, so create one just for the pulseaudio daemon —
# but the app itself (still root, via recorder.js's `pactl` calls) needs to
# reach that SAME server instance, so export a shared XDG_RUNTIME_DIR/
# PULSE_SERVER before forking anything, rather than letting the daemon pick
# its own default that root's later pactl calls wouldn't know about.
export XDG_RUNTIME_DIR=/tmp/pulse-runtime
mkdir -p "$XDG_RUNTIME_DIR"
export PULSE_SERVER="unix:$XDG_RUNTIME_DIR/pulse/native"

if ! id pulseuser >/dev/null 2>&1; then
  useradd -M -s /usr/sbin/nologin pulseuser 2>/dev/null || adduser -D -H pulseuser 2>/dev/null || true
fi
if id pulseuser >/dev/null 2>&1; then
  chown -R pulseuser "$XDG_RUNTIME_DIR"
  su pulseuser -s /bin/sh -c "XDG_RUNTIME_DIR=$XDG_RUNTIME_DIR pulseaudio --start --exit-idle-time=-1"
else
  echo "[start.sh] Could not create a non-root user — pulseaudio will likely fail to start as root."
  pulseaudio --start --exit-idle-time=-1
fi
node index.js

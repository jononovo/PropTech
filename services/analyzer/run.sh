#!/usr/bin/env bash
# Launcher for the analyzer worker.
#
# PaddlePaddle's manylinux wheel needs the GCC runtime (libgomp/libstdc++) on
# the loader path — this Nix env doesn't expose one. But pdftoppm (the page
# renderer) needs a NEW libstdc++ (GLIBCXX >= 3.4.32), so exporting an old GCC
# runtime dir poisons it. Resolution: prefer the exact libstdc++ dir pdftoppm
# itself links (newest in the closure, backward-compatible with paddle's needs)
# provided it also ships libgomp; else fall back to any x86-64 gcc runtime dir
# carrying both at >= 3.4.32. Never hardcode a store path — GC would break it.
set -uo pipefail
cd "$(dirname "$0")"

pick=""
std="$(ldd "$(command -v pdftoppm)" 2>/dev/null | awk '/libstdc\+\+\.so/ {print $3; exit}')"
if [ -n "${std:-}" ]; then
  d="$(dirname "$std")"
  [ -e "$d/libgomp.so.1" ] && pick="$d"
fi
if [ -z "$pick" ]; then
  for f in /nix/store/*gcc*lib*/lib/libgomp.so.1 /nix/store/*gcc*/lib/libgomp.so.1; do
    [ -e "$f" ] || continue
    d="$(dirname "$f")"
    if file -bL "$f" 2>/dev/null | grep -q "x86-64" && [ -e "$d/libstdc++.so.6" ] \
       && strings "$d/libstdc++.so.6" 2>/dev/null | grep -q "GLIBCXX_3.4.32"; then
      pick="$d"; break
    fi
  done
fi
if [ -n "$pick" ]; then
  export LD_LIBRARY_PATH="$pick${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  echo "analyzer launcher: GCC runtime from $pick" >&2
else
  echo "analyzer launcher: WARNING no GCC runtime found — paddle parse will fail loudly" >&2
fi
exec python -m uvicorn app:app --host 0.0.0.0 --port 8000

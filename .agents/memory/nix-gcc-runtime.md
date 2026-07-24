---
name: Nix GCC runtime for manylinux wheels
description: How to give paddle/other manylinux wheels libgomp/libstdc++ in this Nix env without breaking Nix binaries
---

# GCC runtime (libgomp / libstdc++) in the Nix env

**Rule:** No rippkgs system package exposes the GCC runtime libs on the loader path (`gcc`, `libgcc` install but don't help; `gcc.cc.lib`, `stdenv.cc.cc.lib`, `libgomp` don't exist in the index). Manylinux wheels with native cores (PaddlePaddle etc.) need `libgomp.so.1`/`libstdc++.so.6` provided via `LD_LIBRARY_PATH`.

**How:** discover the dir at runtime — glob `/nix/store/*gcc*lib*/lib/libgomp.so.1` and filter `file -bL | grep x86-64` (first hits can be 32-bit ELFCLASS32!). Best source: the dir `pdftoppm` (or any Nix C++ binary) links, via `ldd $(command -v pdftoppm) | awk '/libstdc\+\+/{print $3}'` — newest in the closure, conflict-free by construction. Never hardcode a store path (GC breaks it).

**Poisoning gotcha:** exporting an OLD gcc dir (e.g. gcc-10) process-wide breaks Nix binaries needing newer GLIBCXX — pdftoppm requires `GLIBCXX_3.4.32` (gcc-13+). Symptom: `version GLIBCXX_3.4.31 not found`. Always pick a dir whose libstdc++ carries the newest needed version; newer is backward-compatible.

**Why:** cost a multi-hour debugging loop; ctypes `RTLD_GLOBAL` preload works for in-process loads but does NOT reach the wheel's spawned worker machinery — env var is the reliable channel.

**How to apply:** the analyzer launcher `services/analyzer/run.sh` implements the discovery; reuse the same pattern for any future native-wheel service.

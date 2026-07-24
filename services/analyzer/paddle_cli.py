"""Standalone PaddleOCR-VL parse process (spec §1.1).

parse_pages_paddle() execs this once per packet instead of running the
pipeline in-process: a native crash cannot take the worker down, and the
pipeline's memory is returned after every packet. (The 'cv worker'
std::exception saga turned out to be repeated per-page predict() calls —
fixed by batching — but process isolation stays: it is the right boundary
for a native pipeline living inside a long-running service.)

argv: md_dir elements_dir page1.png [page2.png ...]
Writes p<N>.md + p<N>.json artifacts; prints PARSE_OK on success; any failure
exits non-zero with the error on stderr — the parent surfaces it verbatim.
"""
import sys

from paddle_parse import _parse_all_sync


def main() -> int:
    args = sys.argv[1:]
    if len(args) < 3:
        print("paddle_cli usage: md_dir elements_dir page1.png [...]", file=sys.stderr)
        return 2
    md_dir, elements_dir, *pages = args
    _parse_all_sync(pages, md_dir, elements_dir)
    print("PARSE_OK", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())

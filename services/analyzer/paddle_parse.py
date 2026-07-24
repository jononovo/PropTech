"""PaddleOCR-VL 1.6 parse backend — the locked target engine (spec §1.1).

PP-DocLayoutV3 layout detection runs locally (CPU); VL recognition is sent to
the dedicated deployment's OpenAI-compatible endpoint (vllm-server backend).
Besides the p<N>.md contract artifacts, every page saves its layout-elements
JSON to elements/p<N>.json — real structure (titles, headers, footers, bboxes)
for downstream split signals and deep-scan crops.

Failure semantics: any missing artifact or backend error raises — a parse that
did not happen must never look like one that did.
"""
import asyncio
import os
import threading
from pathlib import Path

from config import PARSE_CONCURRENCY

_lock = threading.Lock()
_pipeline = None


def _preload_gcc_runtime():
    """PaddlePaddle's native core needs libgomp/libstdc++, which this Nix env
    does not put on the loader path (no rippkgs package exposes them). Locate
    an x86-64 copy in the store at runtime and preload it RTLD_GLOBAL so
    libpaddle.so resolves. Never hardcode a store path — GC would break it."""
    import ctypes
    import glob

    try:  # already resolvable (e.g. caller exported LD_LIBRARY_PATH)?
        ctypes.CDLL("libstdc++.so.6")
        ctypes.CDLL("libgomp.so.1")
        return
    except OSError:
        pass
    for pattern in ("/nix/store/*gcc*lib*/lib", "/nix/store/*gcc*/lib"):
        for d in sorted(glob.glob(pattern)):
            stdc, gomp = Path(d, "libstdc++.so.6"), Path(d, "libgomp.so.1")
            if stdc.is_file() and gomp.is_file():
                try:
                    ctypes.CDLL(str(stdc), mode=ctypes.RTLD_GLOBAL)
                    ctypes.CDLL(str(gomp), mode=ctypes.RTLD_GLOBAL)
                    return
                except OSError:
                    continue  # wrong ELF class (32-bit multilib) — keep looking
    raise RuntimeError(
        "paddle parse: GCC runtime (libgomp.so.1/libstdc++.so.6) not found in /nix/store — "
        "cannot load PaddlePaddle native core"
    )


def _get_pipeline():
    """Lazy singleton — first call downloads local models and is slow; the
    heavyweight import stays out of worker startup entirely."""
    global _pipeline
    with _lock:
        if _pipeline is None:
            _preload_gcc_runtime()
            from paddleocr import PaddleOCRVL  # deferred: heavy import chain

            # VL endpoint/model/key arrive via env from the parent (per-run
            # plan) — the CLI subprocess has no other channel.
            _pipeline = PaddleOCRVL(
                pipeline_version=os.environ.get("PADDLE_PIPELINE_VERSION", "v1.6"),
                vl_rec_backend="vllm-server",
                vl_rec_server_url=os.environ["PADDLE_VL_URL"],
                vl_rec_api_model_name=os.environ["PADDLE_VL_MODEL"],
                vl_rec_api_key=os.environ.get("PADDLE_VL_KEY", ""),
                vl_rec_max_concurrency=PARSE_CONCURRENCY,
                use_doc_orientation_classify=True,   # fixes 90/180 rotations
                use_doc_unwarping=False,             # UVDoc too heavy for v1; slight skew is fine
            )
        return _pipeline


def _parse_all_sync(page_pngs: list[str], md_dir: str, elements_dir: str) -> list[str]:
    pipe = _get_pipeline()
    # ONE predict call over all pages: repeated per-page predict() calls are
    # flaky in this pipeline (intermittent instant 'cv' worker std::exception
    # from its internal queue machinery — the same image can pass then fail).
    # Batch input is the intended usage and lets vl_rec_max_concurrency
    # parallelize across pages. Results stream back in input order.
    results = list(pipe.predict(list(page_pngs)))
    if len(results) != len(page_pngs):
        raise RuntimeError(
            f"paddle parse: {len(page_pngs)} pages in, {len(results)} results out"
        )
    mds: list[str] = []
    for i, res in enumerate(results):
        n = i + 1
        md_path = Path(md_dir, f"p{n}.md")
        el_path = Path(elements_dir, f"p{n}.json")
        res.save_to_json(save_path=str(el_path))
        res.save_to_markdown(save_path=str(md_path))
        if not md_path.is_file():
            raise RuntimeError(
                f"paddle parse: page {n} markdown missing after save; md_dir has "
                f"{sorted(p.name for p in Path(md_dir).iterdir())}"
            )
        if not el_path.is_file():
            raise RuntimeError(f"paddle parse: page {n} elements JSON missing after save")
        mds.append(md_path.read_text())
    return mds


async def parse_pages_paddle(page_pngs: list[str], md_dir: str, choice) -> list[str]:
    """Same contract as parse_document(): page PNGs in, markdown list out,
    p<N>.md saved. Runs paddle_cli.py as a subprocess per packet — a native
    crash must never take the worker down, and the pipeline's memory is
    returned when the packet is done. VL-call concurrency is handled inside
    the pipeline (vl_rec_max_concurrency)."""
    import sys

    Path(md_dir).mkdir(parents=True, exist_ok=True)
    elements_dir = str(Path(md_dir).parent / "elements")
    Path(elements_dir).mkdir(parents=True, exist_ok=True)

    here = Path(__file__).parent
    env = dict(os.environ,
               PADDLE_VL_URL=choice.base_url,
               PADDLE_VL_MODEL=choice.model,
               PADDLE_VL_KEY=choice.api_key,
               PADDLE_PIPELINE_VERSION=str(choice.extra.get("pipelineVersion") or "v1.6"))
    proc = await asyncio.create_subprocess_exec(
        sys.executable, str(here / "paddle_cli.py"), md_dir, elements_dir, *page_pngs,
        cwd=str(here), env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await proc.communicate()
    except asyncio.CancelledError:  # run-level timeout — never orphan the child
        proc.kill()
        raise
    if proc.returncode != 0 or b"PARSE_OK" not in stdout:
        tail = stderr.decode(errors="replace").strip()[-800:]
        raise RuntimeError(
            f"paddle parse subprocess failed (exit {proc.returncode}): {tail or 'no stderr'}"
        )

    mds: list[str] = []
    for i in range(len(page_pngs)):
        p = Path(md_dir, f"p{i + 1}.md")
        if not p.is_file():
            raise RuntimeError(f"paddle parse: p{i + 1}.md missing after successful subprocess")
        mds.append(p.read_text())
    return mds

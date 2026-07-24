"""Unit tests for vl_ready.ensure_vl_ready — stdlib only, no test framework.

Run:  uv run python services/analyzer/tests/test_vl_ready.py

A local stub HTTP server plays the Fireworks endpoint with a programmable
response script (e.g. two 503 DEPLOYMENT_SCALING_UP then 200). The tests only
exercise the readiness state machine; nothing here touches real providers."""
import asyncio
import json
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from vl_ready import VLDeploymentNotReady, ensure_vl_ready  # noqa: E402

SCALING_BODY = json.dumps({"error": {"code": "DEPLOYMENT_SCALING_UP", "message": "scaling up"}})
OK_BODY = json.dumps({"choices": [{"message": {"content": "."}}]})


class _StubVLServer:
    """Serves the scripted status codes in order; repeats the last one after."""

    def __init__(self, script: list[int]):
        self.script = list(script)
        self.hits = 0
        outer = self

        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):  # noqa: N802 — http.server API
                self.rfile.read(int(self.headers.get("Content-Length", 0)))
                idx = min(outer.hits, len(outer.script) - 1)
                status = outer.script[idx]
                outer.hits += 1
                body = (OK_BODY if status == 200 else SCALING_BODY if status == 503
                        else json.dumps({"error": {"message": "bad key"}}))
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(body.encode())

            def log_message(self, *_):  # keep test output clean
                pass

        self.httpd = HTTPServer(("127.0.0.1", 0), Handler)
        self.base_url = f"http://127.0.0.1:{self.httpd.server_address[1]}/v1"
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def stop(self):
        self.httpd.shutdown()


def _gate(base_url: str, poll_s: float = 0.05, timeout_s: float = 5.0) -> float:
    return asyncio.run(ensure_vl_ready(
        base_url=base_url, model="m", api_key="k", poll_s=poll_s, timeout_s=timeout_s,
    ))


def test_already_warm():
    srv = _StubVLServer([200])
    try:
        assert _gate(srv.base_url) == 0.0
        assert srv.hits == 1
    finally:
        srv.stop()
    print("PASS already-warm: single probe, zero wait")


def test_scaling_then_ready():
    srv = _StubVLServer([503, 503, 200])
    try:
        waited = _gate(srv.base_url)
        assert waited > 0.0, f"expected a wait, got {waited}"
        assert srv.hits == 3
    finally:
        srv.stop()
    print("PASS scaling-then-ready: polled through 2x503 to 200")


def test_never_ready_times_out():
    srv = _StubVLServer([503])
    try:
        try:
            _gate(srv.base_url, poll_s=0.05, timeout_s=0.3)
            raise AssertionError("expected VLDeploymentNotReady")
        except VLDeploymentNotReady as e:
            assert "not ready" in str(e)
    finally:
        srv.stop()
    print("PASS never-ready: raised VLDeploymentNotReady at deadline")


def test_real_error_fails_fast():
    srv = _StubVLServer([401])
    try:
        t0 = time.monotonic()
        try:
            _gate(srv.base_url, poll_s=1.0, timeout_s=30.0)
            raise AssertionError("expected RuntimeError")
        except VLDeploymentNotReady:
            raise AssertionError("401 must not be treated as cold start")
        except RuntimeError as e:
            assert "HTTP 401" in str(e)
        assert time.monotonic() - t0 < 0.5, "401 must fail immediately, not poll"
        assert srv.hits == 1
    finally:
        srv.stop()
    print("PASS real-error: HTTP 401 raised immediately, no retries")


def test_transport_error_retries_then_times_out():
    # Nothing listens on this port — connection refused is a retryable
    # cold-start signature, bounded by the deadline.
    try:
        asyncio.run(ensure_vl_ready(
            base_url="http://127.0.0.1:9", model="m", api_key="k",
            poll_s=0.05, timeout_s=0.3,
        ))
        raise AssertionError("expected VLDeploymentNotReady")
    except VLDeploymentNotReady as e:
        assert "transport error" in str(e)
    print("PASS transport-error: retried within window, honest timeout")


if __name__ == "__main__":
    test_already_warm()
    test_scaling_then_ready()
    test_never_ready_times_out()
    test_real_error_fails_fast()
    test_transport_error_retries_then_times_out()
    print("ALL 5 PASS")

// Local-only mirror of Replit's shared proxy: one origin that routes /api/*
// to the api-server and everything else (incl. HMR websockets) to Vite.
// Usage: node scripts/dev-proxy.mjs   (env: FRONT_PORT=3000 API_PORT=3001 WEB_PORT=5173)
import http from "node:http";
import net from "node:net";

const FRONT = Number(process.env.FRONT_PORT ?? 3000);
const API = Number(process.env.API_PORT ?? 3001);
const WEB = Number(process.env.WEB_PORT ?? 5173);

const portFor = (url) => (url === "/api" || url.startsWith("/api/") ? API : WEB);

const server = http.createServer((req, res) => {
  const port = portFor(req.url ?? "/");
  const upstream = http.request(
    { host: "127.0.0.1", port, path: req.url, method: req.method, headers: req.headers },
    (ur) => {
      res.writeHead(ur.statusCode ?? 502, ur.headers);
      ur.pipe(res);
    },
  );
  upstream.on("error", () => {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end(`upstream 127.0.0.1:${port} unreachable — is it running?`);
  });
  req.pipe(upstream);
});

// Vite HMR (and any future ws) — raw tunnel with the original handshake replayed.
server.on("upgrade", (req, socket, head) => {
  const upstream = net.connect(portFor(req.url ?? "/"), "127.0.0.1", () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
    }
    upstream.write(lines.join("\r\n") + "\r\n\r\n");
    if (head?.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
});

server.listen(FRONT, () => {
  console.log(`dev proxy on http://localhost:${FRONT}  (/api → :${API}, else → :${WEB})`);
});

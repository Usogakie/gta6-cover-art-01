// serve.ts — tiny static server for app/ (Node 22, standard library only).
// Serves on http://localhost:8080 by default, or --port <n>.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(join(here, "app"));

let port = 8080;
const portArg = process.argv.indexOf("--port");
if (portArg !== -1) {
  const n = Number.parseInt(process.argv[portArg + 1], 10);
  if (Number.isInteger(n) && n >= 1 && n <= 65535) port = n;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const rawPath = (req.url || "/").split("?")[0];
    let decoded;
    try {
      decoded = decodeURIComponent(rawPath);
    } catch {
      res.writeHead(400, { "content-type": "text/plain" });
      res.end("Bad request");
      return;
    }
    let rel = decoded;
    if (rel.endsWith("/")) rel += "index.html";
    const target = resolve(join(root, normalize(rel)));
    if (target !== root && !target.startsWith(root + sep)) {
      res.writeHead(403, { "content-type": "text/plain" });
      res.end("Forbidden");
      return;
    }
    let info;
    try {
      info = await stat(target);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not found");
      return;
    }
    if (!info.isFile()) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not found");
      return;
    }
    const body = await readFile(target);
    const type = MIME[extname(target).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "content-type": type,
      "content-length": body.length,
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("Server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Listening on http://localhost:${port}`);
});

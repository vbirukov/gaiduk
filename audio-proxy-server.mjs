/**
 * Аудио-прокси для плеера: браузер -> этот сервис -> downloader.disk.yandex.ru
 * с Referer как у веб-Диска (иначе 403 с чужого сайта).
 *
 * Локально: npm run proxy:audio
 * Прод (Yandex Cloud): собери образ из Dockerfile, задеплой в Serverless Containers,
 * выдай HTTPS URL, затем при сборке фронта: VITE_AUDIO_PROXY_BASE=https://<твой-прокси>
 * GET/HEAD / и /health без ?url= — 200 ok (health-check; curl -I шлёт HEAD).
 *
 * Внимание: у Yandex Serverless Containers лимит HTTP-ответа ~3,5 МБ — полноценный
 * стрим mp3 через их шлюз невозможен; для прокси нужна VM/Compute или другой хост без этого лимита.
 */
import http from "node:http";
import { Readable } from "node:stream";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const PREFIX = "https://downloader.disk.yandex.ru";
const rawAllow = (process.env.ALLOWED_ORIGIN || "").trim();
/** Только полный origin (https://host) или *; иначе — *, иначе CORS ломается */
const CORS_ORIGIN =
  !rawAllow || rawAllow === "*" || !/^https?:\/\/.+/i.test(rawAllow)
    ? "*"
    : rawAllow;

function acaoFor(req) {
  if (CORS_ORIGIN === "*") return "*";
  const o = req.headers.origin;
  if (typeof o === "string" && o === CORS_ORIGIN) return o;
  return CORS_ORIGIN;
}

/** ORB + CORS; для preflight обязательны Allow-Headers (в т.ч. под Range) */
function corsHeaders(req, extra = {}) {
  return {
    "Access-Control-Allow-Origin": acaoFor(req),
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers":
      "Range, Content-Type, Accept, If-Range, If-Match, If-None-Match",
    "Access-Control-Expose-Headers":
      "Content-Length, Content-Range, Accept-Ranges",
    "Cross-Origin-Resource-Policy": "cross-origin",
    ...extra,
  };
}

function webReadableToNode(webStream) {
  const reader = webStream.getReader();
  return new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        this.push(done ? null : Buffer.from(value));
      } catch (err) {
        this.destroy(err);
      }
    },
  });
}

http
  .createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        ...corsHeaders(req),
        "Access-Control-Max-Age": "86400",
      });
      res.end();
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, corsHeaders(req));
      res.end();
      return;
    }
    let parsed;
    try {
      parsed = new URL(
        req.url || "/",
        `http://${req.headers.host || "localhost"}`,
      );
    } catch {
      res.writeHead(400, corsHeaders(req));
      res.end();
      return;
    }
    const target = parsed.searchParams.get("url");
    if (parsed.pathname === "/health" || (parsed.pathname === "/" && !target)) {
      const body = "ok";
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        ...corsHeaders(req),
      });
      if (req.method === "HEAD") res.end();
      else res.end(body);
      return;
    }
    if (!target || !target.startsWith(PREFIX)) {
      res.writeHead(400, corsHeaders(req));
      res.end("expected ?url=https://downloader.disk.yandex.ru/...");
      return;
    }
    const upstreamHeaders = {
      Referer: "https://disk.yandex.ru/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
      Accept: "audio/*,*/*",
    };
    const range = req.headers.range;
    if (range) upstreamHeaders.Range = range;

    let r;
    try {
      r = await fetch(target, {
        method: req.method,
        headers: upstreamHeaders,
        redirect: "follow",
      });
    } catch (e) {
      res.writeHead(502, corsHeaders(req));
      res.end(String(e));
      return;
    }

    if (!r.ok) {
      res.writeHead(r.status, corsHeaders(req));
      res.end();
      return;
    }

    const forward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
    ];
    const out = {};
    for (const k of forward) {
      const v = r.headers.get(k);
      if (v) out[k] = v;
    }
    const pathOnly = target.split("?")[0].toLowerCase();
    let ct = String(out["content-type"] || "").toLowerCase();
    if (!ct.startsWith("audio/") || ct.includes("octet-stream")) {
      if (pathOnly.endsWith(".mp3")) out["content-type"] = "audio/mpeg";
      else if (pathOnly.endsWith(".m4a")) out["content-type"] = "audio/mp4";
      else if (pathOnly.endsWith(".ogg")) out["content-type"] = "audio/ogg";
      else if (pathOnly.endsWith(".wav")) out["content-type"] = "audio/wav";
    }
    res.writeHead(r.status, {
      ...out,
      ...corsHeaders(req),
      "Cache-Control": "public, max-age=120",
    });
    if (req.method === "HEAD") {
      if (r.body) void r.body.cancel();
      res.end();
      return;
    }
    if (!r.body) {
      res.end();
      return;
    }
    const nodeStream = webReadableToNode(r.body);
    nodeStream.on("error", () => {
      if (!res.writableEnded) res.destroy();
    });
    nodeStream.pipe(res);
  })
  .listen(PORT, HOST, () => {
    console.error(`audio-proxy listening http://${HOST}:${PORT}`);
  });

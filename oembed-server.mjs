/**
 * oEmbed для VK / Telegram: GET /oembed?url=...&format=json
 * Локально: npm run proxy:oembed (порт 8789)
 * Nginx: location /oembed { proxy_pass http://127.0.0.1:8789; }
 */
import http from "node:http";
import { handleOembedHttp } from "./scripts/oembed-core.mjs";

const PORT = Number(process.env.OEMBED_PORT || 8789);
const HOST = process.env.HOST || "0.0.0.0";

http
  .createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      });
      res.end();
      return;
    }
    if (req.method !== "GET") {
      res.writeHead(405);
      res.end();
      return;
    }
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");
      return;
    }
    handleOembedHttp(req, res);
  })
  .listen(PORT, HOST, () => {
    console.error(`oembed-api listening http://${HOST}:${PORT}`);
  });

import path from "node:path";
import { createReadStream, existsSync, statSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const mediaRoot = path.resolve("data/media");

function mediaDevPlugin(): Plugin {
  return {
    name: "local-media",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.startsWith("/media/")) return next();
        const rel = decodeURIComponent(url.slice("/media/".length));
        const file = path.normalize(path.join(mediaRoot, rel));
        if (!file.startsWith(mediaRoot)) {
          res.statusCode = 403;
          res.end();
          return;
        }
        if (!existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404;
          res.end();
          return;
        }
        const ext = path.extname(file).toLowerCase();
        const types: Record<string, string> = {
          ".mp3": "audio/mpeg",
          ".m4a": "audio/mp4",
          ".ogg": "audio/ogg",
          ".wav": "audio/wav",
          ".json": "application/json",
        };
        res.setHeader("Content-Type", types[ext] ?? "application/octet-stream");
        res.setHeader("Accept-Ranges", "bytes");
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), mediaDevPlugin()],
});

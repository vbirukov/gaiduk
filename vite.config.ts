import path from "node:path";
import { createReadStream, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
const rootDir = path.dirname(fileURLToPath(import.meta.url));

const mediaRoot = path.resolve("data/media");

function oembedDevPlugin(): Plugin {
  return {
    name: "oembed-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (url !== "/oembed") return next();
        import("./scripts/oembed-core.mjs")
          .then(({ handleOembedHttp }) => handleOembedHttp(req, res))
          .catch(next);
      });
    },
  };
}

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
          ".mp4": "video/mp4",
          ".webm": "video/webm",
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
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
    // Единый React во всём графе — иначе «Invalid hook call»
    // из-за дублированного react/react-dom (движок + хост).
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // Пакет публикует исходники .ts — явно включаем для предобработки.
    // NB: dev-сервер падает на внутреннем `?worker`-импорте пакета
    // (src/lib/catalogWorker.ts) — «No matching export ...?worker».
    // Это баг @vbirukov/player@0.4.4 (см. PLAYER_TS_ERRORS.md), production
    // build при этом проходит.
    include: ["@vbirukov/player", "@tanstack/react-virtual"],
  },
  ssr: {
    noExternal: ["@vbirukov/player"],
  },
  plugins: [react(), mediaDevPlugin(), oembedDevPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "index.html"),
        embed: path.resolve(rootDir, "embed.html"),
      },
    },
  },
});

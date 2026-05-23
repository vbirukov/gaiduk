/**
 * Генерирует /share/*.html с Open Graph для VK, Telegram и др.
 * Источник: MEDIA_ROOT/catalog.json или data/media/catalog.json
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function utf8ShareSlug(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shareDescriptionTrack(track) {
  const series = track.folder?.trim();
  if (series) {
    return `Сказка «${track.title}» · ${series} — Дмитрий Гайдук`;
  }
  return `Сказка «${track.title}» — Дмитрий Гайдук`;
}

function shareDescriptionFolder(folder, trackCount) {
  const n = trackCount > 0 ? `${trackCount} сказок` : "аудиосказки";
  return `Альбом «${folder}» — ${n}. Дмитрий Гайдук`;
}

function shareDescriptionCatalog(trackCount, albumCount) {
  const albums =
    albumCount > 0 ? ` · ${albumCount} альбомов` : "";
  return `Каталог Haiduk — ${trackCount} записей${albums}. Дмитрий Гайдук`;
}

function resolveCatalogPath() {
  const envRoot = process.env.MEDIA_ROOT?.trim();
  const candidates = [
    envRoot ? join(envRoot, "catalog.json") : null,
    join(root, "data", "media", "catalog.json"),
    join(root, "dist", "media", "catalog.json"),
  ].filter(Boolean);
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function resolveSiteOrigin() {
  const o = (
    process.env.VITE_SITE_ORIGIN ||
    process.env.OG_SITE_ORIGIN ||
    "https://xn--80afepl7c.xn--p1ai"
  ).trim();
  return o.replace(/\/$/, "");
}

function renderShareHtml({ title, description, shareUrl, appBase, origin, coverPath }) {
  const image = `${origin}${coverPath}`;

  return `<!DOCTYPE html>
<html lang="ru" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — Haiduk</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(shareUrl)}" />
  <meta property="og:site_name" content="Haiduk — аудиосказки Дмитрия Гайдука" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(shareUrl)}" />
  <meta property="og:locale" content="ru_RU" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(appBase)}" />
</head>
<body>
  <p><a href="${escapeHtml(appBase)}">${escapeHtml(title)}</a></p>
  <script>
    (function () {
      var app = new URL(${JSON.stringify(appBase)});
      var t = new URL(location.href).searchParams.get("t");
      if (t) app.searchParams.set("t", t);
      location.replace(app.pathname + app.search);
    })();
  </script>
</body>
</html>
`;
}

async function main() {
  const catalogPath = resolveCatalogPath();
  const outDir = join(root, "dist", "share");
  const albumDir = join(outDir, "album");
  const origin = resolveSiteOrigin();
  const coverPath = "/images/cover-default.png";

  const FALLBACK_TRACKS = [
    {
      id: "stub-1",
      title: "Демо: Растаманская сказка",
      folder: "01 RASTAMANSKIE SKAZKI 1995 - 1997",
    },
    {
      id: "stub-2",
      title: "Демо: Jah Buddha",
      folder: "02 JAH BUDDHA I EGO JAHTAKI",
    },
    {
      id: "stub-3",
      title: "Демо: Сказка народов мира",
      folder: "03 SKAZKI NARODOV MIRA",
    },
  ];

  let tracks = FALLBACK_TRACKS;
  if (catalogPath) {
    const raw = await readFile(catalogPath, "utf8");
    const catalog = JSON.parse(raw);
    if (catalog.tracks?.length) tracks = catalog.tracks;
  } else {
    console.warn(
      "[share-og] catalog.json не найден — только демо-страницы (задайте MEDIA_ROOT для полного каталога)",
    );
  }
  if (!tracks.length) {
    console.warn("[share-og] 0 треков");
    return;
  }

  await mkdir(outDir, { recursive: true });
  await mkdir(albumDir, { recursive: true });

  let trackPages = 0;
  for (const track of tracks) {
    if (!track?.id || !track?.title) continue;
    const slug = utf8ShareSlug(track.id);
    const title = track.title;
    const description = shareDescriptionTrack(track);
    const shareUrl = `${origin}/share/${slug}.html`;
    const appBase = `${origin}/?track=${encodeURIComponent(track.id)}`;
    const html = renderShareHtml({
      title,
      description,
      shareUrl,
      appBase,
      origin,
      coverPath,
    });
    await writeFile(join(outDir, `${slug}.html`), html, "utf8");
    trackPages++;
  }

  const folderCounts = new Map();
  for (const track of tracks) {
    const folder = track?.folder?.trim();
    if (!folder) continue;
    folderCounts.set(folder, (folderCounts.get(folder) ?? 0) + 1);
  }

  let albumPages = 0;
  for (const [folder, count] of folderCounts) {
    const slug = utf8ShareSlug(folder);
    const title = folder;
    const description = shareDescriptionFolder(folder, count);
    const shareUrl = `${origin}/share/album/${slug}.html`;
    const appBase = `${origin}/?album=${encodeURIComponent(slug)}`;
    const html = renderShareHtml({
      title,
      description,
      shareUrl,
      appBase,
      origin,
      coverPath,
    });
    await writeFile(join(albumDir, `${slug}.html`), html, "utf8");
    albumPages++;
  }

  const catalogTitle = "Каталог аудиосказок";
  const catalogDescription = shareDescriptionCatalog(
    tracks.length,
    folderCounts.size,
  );
  const catalogShareUrl = `${origin}/share/catalog.html`;
  const catalogAppBase = `${origin}/?catalog=1`;
  await writeFile(
    join(outDir, "catalog.html"),
    renderShareHtml({
      title: catalogTitle,
      description: catalogDescription,
      shareUrl: catalogShareUrl,
      appBase: catalogAppBase,
      origin,
      coverPath,
    }),
    "utf8",
  );

  console.error(
    `[share-og] ${trackPages} треков, ${albumPages} альбомов, каталог → dist/share/ (origin: ${origin})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { API_ROOT, PUBLIC_KEY } from "../config";
import type { Track } from "../types/catalog";

const diskDownloadHrefByPath = new Map<string, string>();
const diskDownloadInflight = new Map<string, Promise<string>>();

export const isStubTrack = (t: Track) => t.id.startsWith("stub-");

export async function fetchDiskDownloadHref(path: string): Promise<string> {
  const cached = diskDownloadHrefByPath.get(path);
  if (cached) return cached;
  const inflight = diskDownloadInflight.get(path);
  if (inflight) return inflight;

  const promise = (async () => {
    const apiUrl = `${API_ROOT}/download?public_key=${encodeURIComponent(PUBLIC_KEY)}&path=${encodeURIComponent(path)}`;
    let lastErr: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) {
        await new Promise((r) =>
          setTimeout(r, Math.min(8000, 400 * 2 ** (attempt - 1))),
        );
      }
      try {
        const res = await fetch(apiUrl);
        if (res.status === 429) {
          lastErr = new Error("429");
          continue;
        }
        if (!res.ok) throw new Error(String(res.status));
        const dl = (await res.json()) as { href?: string };
        const href = String(dl.href || "");
        if (!href) throw new Error("empty href");
        diskDownloadHrefByPath.set(path, href);
        return href;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  })();

  diskDownloadInflight.set(path, promise);
  return promise.finally(() => {
    diskDownloadInflight.delete(path);
  });
}

export function playbackSrc(diskHref: string): string {
  const raw = import.meta.env.VITE_AUDIO_PROXY_BASE;
  const base = typeof raw === "string" ? raw.trim().replace(/\/$/, "") : "";
  if (!base) return diskHref;
  return `${base}?url=${encodeURIComponent(diskHref)}`;
}

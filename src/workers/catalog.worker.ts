import { buildDiskCatalog } from "../lib/diskCatalog";
import { loadLocalCatalog } from "../lib/localCatalog";

type WorkerIn = { type: "build" };

function wantServerMedia(): boolean {
  const env =
    typeof import.meta.env.VITE_MEDIA_BASE === "string"
      ? import.meta.env.VITE_MEDIA_BASE.trim()
      : "";
  return Boolean(env);
}
type WorkerOut =
  | { type: "done"; catalog: Awaited<ReturnType<typeof buildDiskCatalog>> }
  | { type: "error"; message: string };

self.onmessage = async (ev: MessageEvent<WorkerIn>) => {
  if (ev.data?.type !== "build") return;
  try {
    let catalog;
    if (wantServerMedia()) {
      try {
        catalog = await loadLocalCatalog();
      } catch {
        catalog = await buildDiskCatalog();
      }
    } else {
      catalog = await buildDiskCatalog();
    }
    const out: WorkerOut = { type: "done", catalog };
    self.postMessage(out);
  } catch (e) {
    const out: WorkerOut = {
      type: "error",
      message: e instanceof Error ? e.message : String(e),
    };
    self.postMessage(out);
  }
};

export {};

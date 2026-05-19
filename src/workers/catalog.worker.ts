import { buildDiskCatalog } from "../lib/diskCatalog";
import { loadLocalCatalog } from "../lib/localCatalog";
import { useLocalMedia } from "../lib/mediaUrl";

type WorkerIn = { type: "build" };
type WorkerOut =
  | { type: "done"; catalog: Awaited<ReturnType<typeof buildDiskCatalog>> }
  | { type: "error"; message: string };

self.onmessage = async (ev: MessageEvent<WorkerIn>) => {
  if (ev.data?.type !== "build") return;
  try {
    const catalog = useLocalMedia()
      ? await loadLocalCatalog()
      : await buildDiskCatalog();
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

import CatalogWorkerCtor from "../workers/catalog.worker?worker";
import type { Catalog } from "../types/catalog";

type CatalogWorkerOut =
  | { type: "done"; catalog: Catalog }
  | { type: "error"; message: string };

export function runCatalogWorker(): Promise<Catalog | null> {
  return new Promise((resolve) => {
    const w = new CatalogWorkerCtor();
    const finish = (cat: Catalog | null) => {
      w.terminate();
      resolve(cat);
    };
    w.onmessage = (ev: MessageEvent<CatalogWorkerOut>) => {
      const d = ev.data;
      if (d?.type === "done") finish(d.catalog);
      else if (d?.type === "error") finish(null);
    };
    w.onerror = () => finish(null);
    w.postMessage({ type: "build" });
  });
}

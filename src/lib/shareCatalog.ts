import {
  albumSharePageUrl,
  catalogSharePageUrl,
  resolveSiteOrigin,
  shareDescriptionForCatalog,
  shareDescriptionForFolder,
  shareTitleForCatalog,
  shareTitleForFolder,
} from "./shareOg";
import { shareViaWebOrClipboard, type ShareLinkResult } from "./shareLink";

export type { ShareLinkResult };

export function buildFolderShareUrl(folder: string): string {
  return albumSharePageUrl(folder, resolveSiteOrigin());
}

export function buildCatalogShareUrl(): string {
  return catalogSharePageUrl(resolveSiteOrigin());
}

export async function shareFolder(opts: {
  folder: string;
  trackCount: number;
}): Promise<ShareLinkResult> {
  const url = buildFolderShareUrl(opts.folder);
  const title = shareTitleForFolder(opts.folder);
  const text = shareDescriptionForFolder(opts.folder, opts.trackCount);
  return shareViaWebOrClipboard({
    title,
    text,
    url,
    promptLabel: "Ссылка на альбом:",
  });
}

export async function shareCatalog(opts: {
  trackCount: number;
  albumCount?: number;
}): Promise<ShareLinkResult> {
  const url = buildCatalogShareUrl();
  const title = shareTitleForCatalog();
  const text = shareDescriptionForCatalog(opts.trackCount, opts.albumCount);
  return shareViaWebOrClipboard({
    title,
    text,
    url,
    promptLabel: "Ссылка на каталог:",
  });
}

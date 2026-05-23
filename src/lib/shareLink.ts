export type ShareLinkResult = "shared" | "copied" | "cancelled" | "failed";

export async function shareViaWebOrClipboard(opts: {
  title: string;
  text: string;
  url: string;
  promptLabel?: string;
}): Promise<ShareLinkResult> {
  const { title, text, url, promptLabel = "Ссылка:" } = opts;

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    const ok = window.prompt(promptLabel, url);
    return ok === null ? "cancelled" : "copied";
  }
}

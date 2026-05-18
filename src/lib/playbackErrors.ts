export function formatPlaybackError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "429")
    return "Слишком много запросов к Яндекс.Диску — подождите и повторите.";
  if (msg === "403")
    return "Доступ к аудио запрещён. Проверьте VITE_AUDIO_PROXY_BASE и прокси на сервере.";
  if (msg === "empty href") return "Не удалось получить ссылку на файл.";
  if (/^\d+$/.test(msg)) return `Ошибка загрузки (HTTP ${msg}).`;
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError")
      return "Браузер заблокировал воспроизведение — нажмите «Слушать» ещё раз.";
    if (err.name === "AbortError") return "Воспроизведение прервано.";
  }
  return "Не удалось воспроизвести. Попробуйте ещё раз.";
}

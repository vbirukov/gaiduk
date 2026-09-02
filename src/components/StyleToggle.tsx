import { useEffect, useState } from "react";

const STORAGE_KEY = "gaiduk-player-style-toggle-v1";
const ROOT_CLASS = "gaiduk-core-styles";

function readInitial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "original";
  } catch {
    return false;
  }
}

/**
 * Флажок для локальной разработки (Vite).
 * Переключает оформление плей-бара между:
 *  - «Локальными» стилями (styles*.css) — по умолчанию;
 *  - «Оригинальным» рендером ядра @vbirukov/player
 *    (styles-player-original.css, css-переменные shadcn/ui).
 *
 * Состояние сохраняется в localStorage и восстанавливается при старте.
 * Класс навешивается на <html>, поэтому сравнение видно мгновенно
 * без перезагрузки.
 */
export function StyleToggle() {
  const [original, setOriginal] = useState(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(ROOT_CLASS, original);
    try {
      localStorage.setItem(STORAGE_KEY, original ? "original" : "local");
    } catch {
      /* ignore */
    }
  }, [original]);

  return (
    <button
      type="button"
      className="gaiduk-style-toggle"
      aria-pressed={original}
      onClick={() => setOriginal((v) => !v)}
      title="Переключить стили плеера: локальные / оригинальные (ядро)"
    >
      <span
        className="gaiduk-style-toggle__label"
        aria-hidden
      >
        {original
          ? "Стили: ядро"
          : "Стили: локальные"}
      </span>
      <span className="gaiduk-style-toggle__sw" aria-hidden>
        <span className="gaiduk-style-toggle__knob" />
      </span>
    </button>
  );
}

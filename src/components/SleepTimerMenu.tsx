import { useCallback, useEffect, useRef, useState } from "react";
import { useSleepTimer, type SleepTimerOption } from "../hooks/useSleepTimer";

/**
 * Компонент управления sleep-timer.
 * Рендерит кнопку с иконкой луны и выпадающее меню.
 */
export function SleepTimerMenu() {
  const {
    state,
    remainingSec,
    selectedMinutes,
    startTimer,
    cancelTimer,
    options,
  } = useSleepTimer();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню по клику вне.
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Закрытие по Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  const handleSelect = useCallback(
    (opt: SleepTimerOption) => {
      if (opt.minutes === 0) {
        cancelTimer();
      } else {
        startTimer(opt.minutes);
      }
      setMenuOpen(false);
    },
    [cancelTimer, startTimer],
  );

  const handleCancel = useCallback(() => {
    cancelTimer();
    setMenuOpen(false);
  }, [cancelTimer]);

  // Форматирование оставшегося времени.
  const formatRemaining = (sec: number): string => {
    if (sec <= 0) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}с`;
  };

  const isActive = state !== "off";
  const isFading = state === "fading";
  const timeLabel = formatRemaining(remainingSec);

  // Иконка луны (SVG inline, без зависимостей).
  const moonIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  return (
    <div className="sleep-timer" ref={menuRef}>
      <button
        type="button"
        className={`sleep-timer__trigger ${isActive ? "is-active" : ""} ${
          isFading ? "is-fading" : ""
        }`}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={
          isActive
            ? `Таймер сна: ${timeLabel}`
            : "Таймер сна"
        }
        title={
          isActive
            ? `Таймер сна: ${timeLabel} (нажмите для отмены)`
            : "Установить таймер сна"
        }
      >
        {moonIcon}
        {isActive && timeLabel && (
          <span className="sleep-timer__badge">{timeLabel}</span>
        )}
      </button>

      {menuOpen && (
        <div className="sleep-timer__menu" role="menu">
          {isActive ? (
            <button
              type="button"
              className="sleep-timer__menu-item is-cancel"
              role="menuitem"
              onClick={handleCancel}
            >
              <span className="sleep-timer__menu-icon">✕</span>
              Отменить ({timeLabel})
            </button>
          ) : null}
          {options.map((opt) => {
            const isCurrent =
              !isActive && selectedMinutes === opt.minutes;
            return (
              <button
                key={opt.minutes}
                type="button"
                className={`sleep-timer__menu-item ${
                  isCurrent ? "is-selected" : ""
                }`}
                role="menuitem"
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import type { PlayerHeaderSlotProps, AppSkin } from "@vbirukov/player";
import { SleepTimerMenu } from "./SleepTimerMenu";

/**
 * Хост-хедер плеера.
 * Использует только публичный слот PlayerHeaderSlotProps — БЕЗ импорта
 * внутренних компонентов движка (IconButtonIcon/ThemeSwitcher), которых
 * нет в публичном API @vbirukov/player@0.4.4.
 */
export function MainHeader({
  onOpenNav,
  installPrompt,
  onInstall,
  showIosInstallHint,
  onDismissIosHint,
  skin,
  onSkinChange,
}: PlayerHeaderSlotProps) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="menu-toggle"
        onClick={onOpenNav}
        aria-label="Открыть меню"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="toolbar topbar-toolbar">
        <select
          className="skin-switcher"
          value={skin}
          onChange={(e) => onSkinChange(e.target.value as AppSkin)}
          aria-label="Тема оформления"
        >
          <option value="rastaman">Раста тёмная</option>
          <option value="rastaman-light">Раста светлая</option>
          <option value="jaipur">Джайпур</option>
          <option value="moon-dub">Лунная даб-библиотека</option>
        </select>
        <SleepTimerMenu />
        {installPrompt ? (
          <button type="button" className="ghost" onClick={onInstall}>
            Установить
          </button>
        ) : null}
        {showIosInstallHint ? (
          <button
            type="button"
            className="ghost"
            onClick={onDismissIosHint}
            title="Закрыть подсказку"
          >
            iOS: Поделиться → На экран «Домой»
          </button>
        ) : null}
      </div>
    </header>
  );
}

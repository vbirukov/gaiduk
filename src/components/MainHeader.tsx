import type { PlayerHeaderSlotProps } from "@vbonline/player";
import { IconButtonIcon } from "@vbonline/player/src/components/IconButton";
import { ThemeSwitcher } from "@vbonline/player/src/components/ThemeSwitcher";

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
      <IconButtonIcon
        className="menu-toggle"
        icon="menu"
        iconSize={22}
        onClick={onOpenNav}
        aria-label="Открыть меню"
      />
      <div className="toolbar topbar-toolbar">
        <ThemeSwitcher skin={skin} onSkinChange={onSkinChange} />
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

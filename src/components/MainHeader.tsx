import { PUBLIC_KEY } from "../config";
import type { AppSkin } from "../themes";
import { Icon } from "./icons/Icon";
import { ThemeSwitcher } from "./ThemeSwitcher";

type Props = {
  onOpenNav: () => void;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstall: () => void;
  showIosInstallHint: boolean;
  onDismissIosHint: () => void;
  loadingCatalog: boolean;
  onRefreshCatalog: () => void;
  skin: AppSkin;
  onSkinChange: (skin: AppSkin) => void;
};

export function MainHeader({
  onOpenNav,
  installPrompt,
  onInstall,
  showIosInstallHint,
  onDismissIosHint,
  loadingCatalog,
  onRefreshCatalog,
  skin,
  onSkinChange,
}: Props) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="ghost menu-toggle"
        onClick={onOpenNav}
        aria-label="Открыть меню"
      >
        <Icon name="menu" size={22} />
      </button>
      <div>
        <div className="eyebrow">Публичная коллекция Дмитрия Гайдука</div>
        <div className="source desktop-source">Источник: {PUBLIC_KEY}</div>
      </div>
      <div className="toolbar">
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
        <button type="button" className="ghost" onClick={onRefreshCatalog}>
          {loadingCatalog ? "Обновляю…" : "Обновить каталог"}
        </button>
      </div>
    </header>
  );
}

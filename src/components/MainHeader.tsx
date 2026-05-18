import { PUBLIC_KEY } from "../config";

type Props = {
  onOpenNav: () => void;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstall: () => void;
  showIosInstallHint: boolean;
  onDismissIosHint: () => void;
  loadingCatalog: boolean;
  onRefreshCatalog: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function MainHeader({
  onOpenNav,
  installPrompt,
  onInstall,
  showIosInstallHint,
  onDismissIosHint,
  loadingCatalog,
  onRefreshCatalog,
  theme,
  onToggleTheme,
}: Props) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="ghost menu-toggle"
        onClick={onOpenNav}
        aria-label="Открыть меню"
      >
        ☰
      </button>
      <div>
        <div className="eyebrow">Публичная коллекция Дмитрия Гайдука</div>
        <div className="source desktop-source">Источник: {PUBLIC_KEY}</div>
      </div>
      <div className="toolbar">
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
        <button type="button" className="ghost" onClick={onToggleTheme}>
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </header>
  );
}

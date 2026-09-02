# Интеграция @vbirukov/player — сверка с инструкцией + исправления

Дата: 2026-09-01
Пакет: @vbirukov/player@0.4.4 (GitHub Packages)

## Статус: ✅ все 8 расхождений исправлены

Код приведён к API 0.4.4 по инструкции. Ниже — что было и что стало.

### 1. vite.config.ts — optimizeDeps/dedupe/ssr ✅
Добавлены:
- `resolve.dedupe: ["react", "react-dom"]`
- `optimizeDeps.include: ["@vbirukov/player", "@tanstack/react-virtual"]`
- `ssr.noExternal: ["@vbirukov/player"]`
- Убран хрупкий alias `@vbirukov/player/src` (больше не нужен).

### 2. haidukConfig.ts — branding + features ✅
- `appName` → `branding: { appTitle, siteName, siteDescription }`
- `features` дополнен `video: true, text: true`

### 3-4. Типы + fallback: sections/kind/section ✅
- `Catalog` + поле `sections: string[]`
- `Track` + поля `section?`, `kind?: MediaKind`
- `MediaKind = "audio" | "video" | "text"`
- `fallbackCatalog` дополнен `sections: []` и `kind: "audio"` у стабов.

### 5-6. Setup + StrictMode ✅
- Создан `src/player/setup.ts` (`setPlayerConfig` единажды)
- `main.tsx` и `embed.tsx` импортируют setup ПЕРВОЙ строкой + обёрнуты в `<StrictMode>`.

### 7. CSS движка ✅
- В `main.tsx` добавлен `import "@vbirukov/player/layout.css"`.

### 8. Медиа-типы ✅
- В `mediaDevPlugin` добавлены `.mp4` / `.webm` → `video/*`.

## ⚠️ Важно: убраны ВСЕ внутренние (не-публичные) импорты движка

Старый код полагался на суб-пути, которых нет в публичном API 0.4.4:
- `@vbirukov/player/src/components/IconButton` → заменён на свой SVG в `MainHeader.tsx`
- `@vbirukov/player/src/components/ThemeSwitcher` → заменён на свой `<select>` темы
- `@vbirukov/player/lib/buttonRipple` → убран (риски анимации внутренних кнопок)
- `@vbirukov/player/lib/gridColumns` → продублирован локально в `useFeedGridDesktop.ts`

Публичный API 0.4.4 (по инструкции), который теперь используется:
```
PlayerApp, EmbedApp,
setPlayerConfig, getPlayerConfig, storageKey,
DEFAULT_THEME_OPTIONS, getThemeOptions, applyDocumentTheme,
типы: PlayerConfig, PlayerFeatures, PlayerHeaderSlotProps, PlayerHeroSlotProps, AppSkin
subpath: @vbirukov/player/layout.css, lib/shareOg, themes
```

## Осталось проверить ПОСЛЕ установки пакета

1. `npm install` (нужен токен) — появится node_modules/@vbirukov/player@0.4.4.
2. `npm run typecheck` — должно быть чисто (кроме preexisting TS7016 для oembed-core.mjs).
3. `npm run dev` — проверить, что layout.css резолвится и движок рендерится.
4. Проверить реальное содержимое `@vbirukov/player/layout.css` — совпадает ли BEM-классы
   с нашими styles-*.css (иначе возможны коллизии стилей хедера/темы).

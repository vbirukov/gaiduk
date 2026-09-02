# Ошибки типизации в @vbirukov/player (для ответственного за пакет)

Версия: 0.4.5 (обновлено после фикса)
Референс: github.com/vbirukov/web-media-player
Как воспроизвести: `tsc --noEmit` в хост-проекте с `"strict": true`.

Пакет публикует исходники `.ts` (files: ["src"], exports: {".": "./src/index.ts"}), поэтому
transpilation-ошибки внутри пакета всплывают в typecheck хоста. `skipLibCheck: true`
не гасит их, т.к. это `.ts`-файлы, а не `.d.ts`.

Всего ошибок: 7 (в 5 файлах). Все — мелкие, типизации, runtime не ломают.

### ✅ Статус по 0.4.5
- **Исправлено в 0.4.5:** ошибки №1-2 (Sidebar.tsx), №4-5 (useCatalog.ts), №6 (useDeferredVideoLoad.ts), №7 (gridColumns.ts) — **6 из 7 ушли**.
- **Осталась 1 (№3):** `useAudioPlayer.ts:208` — TS2322 (`Timeout` vs `number`), конфликт @types/node + DOM setTimeout.
- **Dev-сервер:** worker-баг `?worker` (описан ниже) — **исправлен**, `vite dev` стартует и работает.
- **Наш код:** 0 ошибок. `vite build` — ✅ чисто (1957 модулей, catalog.worker бандлится).


---

## 1. Sidebar.tsx:295 — некорректный type predicate в `.filter()`

```ts
const extraViews = [
  resumeCount > 0 ? (["resume", `Продолжить · ${resumeCount}`] as const) : null,
  likeCount > 0 ? (["liked", `Лайки · ${likeCount}`] as const) : null,
].filter(
  (item): item is readonly ["resume" | "liked", string] => item != null
);
```

**Ошибка TS2677:** type predicate объявляет тип `readonly ["resume" | "liked", string]`,
но реальный union — два *разных* кортежа:
- `readonly ["resume", \`Продолжить · ${number}\`]`
- `readonly ["liked", \`Лайки · ${number}\`]`

У них разный литерал позиции 0 (`"resume"` vs `"liked"`), а predicate сливает их
в `"resume" | "liked"` — такой кортеж **не assignable** к фактическому union
(контравариантность позиции 0).

**Следствие:** на строке 346 `extraViews.map(([id, label]) => ...)` тоже ломается —
TS2488 («must have a [Symbol.iterator]()»), потому что из-за неверного predicate
итоговый тип `extraViews` выведен как пересечение кортежей, у которого нет итератора.

**Как исправить (любой вариант):**

Вариант A — сузить predicate к точному union:
```ts
type ExtraView = readonly ["resume", `Продолжить · ${number}`]
  | readonly ["liked", `Лайки · ${number}`];
const extraViews: ExtraView[] = [
  resumeCount > 0 ? (["resume", `Продолжить · ${resumeCount}`] as const) : null,
  likeCount > 0 ? (["liked", `Лайки · ${likeCount}`] as const) : null,
].filter((item): item is ExtraView => item != null);
```

Вариант B — проще, без predicate:
```ts
const extraViews = [
  resumeCount > 0 ? { id: "resume" as const, label: `Продолжить · ${resumeCount}` } : null,
  likeCount > 0 ? { id: "liked" as const, label: `Лайки · ${likeCount}` } : null,
].filter((item) => item != null);
// ... extraViews.map(({ id, label }) => ...)
```

---

## 2. useAudioPlayer.ts:208 — `setTimeout` возвращает `number`, а присваивается в `Timeout`

```ts
prefetchTimerRef.current = window.setTimeout(() => { ... }, 0);
```

**Ошибка TS2322:** `prefetchTimerRef.current` типизирован как `Timeout`
(тип из Node.js `@types/node`), а `window.setTimeout` возвращает `number`.

**Причина:** в проекте подключены DOM-типы И `@types/node`, из-за чего
глобальный `setTimeout`/`clearTimeout` резолвятся неоднозначно. Тип рефа
объявлен как `Timeout` (Node), а вызов — `window.setTimeout` (number).

**Как исправить:**
- Использовать `ReturnType<typeof window.setTimeout>` для типа рефа, ИЛИ
- Использовать `number` для рефа (т.к. в браузере setTimeout всегда number), ИЛИ
- Заменить `window.setTimeout` на глобальный `setTimeout`, а тип рефа на
  `ReturnType<typeof setTimeout>`.

Рекомендуемый минимальный фикс:
```ts
prefetchTimerRef.current = window.setTimeout(() => { ... }, 0) as unknown as ReturnType<typeof setTimeout>;
```
либо объявить `prefetchTimerRef` как `useRef<number | undefined>(undefined)`.

---

## 3. useCatalog.ts:353 — `scope.level === "section"` сужается до `never`

```ts
const sectionTitle = useMemo(() => {
  const scope = filters.feedScope;               // тип FeedScope
  if (scope.level === "folder") return scope.folder;
  if (scope.level === "section") return scope.sectionId;   // строка 338
  if (scope.level === "selection") { ... }
  if (folderFilter.length === 1) return folderFilter[0]!;
  ...
  if (feedMode === "sections") return "Каталог";
  if (feedMode === "folders") {
    return scope.level === "section" ? scope.sectionId : "Каталог";  // строка 353
  }
  ...
});
```

**Ошибки TS2367 + TS2339:** на строке 353 TypeScript считает, что
`scope.level === "section"` не имеет пересечения с уже суженным типом `scope`
(после ранних `if` осталась ветвь `{ level: "catalog" }`), поэтому
`scope` сужается до `never`, и `scope.sectionId` не существует.

**Причина:** control-flow анализ «съедает» дискриминант внутри замыкания
`useMemo`. `scope` — локальная `const`, вычисленная из `filters.feedScope`,
но из-за ранних `return` по `scope.level` TS к строке 353 уже считает `scope`
покрытым всеми ветками, кроме `catalog`. Повторная проверка `scope.level === "section"`
оказывается «невозможной» (never).

**Как исправить:** не полагаться на повторное сужение `scope` после цепочки ранних
returns. Переписать, используя отдельный прямой доступ к полю:

```ts
if (feedMode === "folders") {
  const level = (filters.feedScope as FeedScope).level;
  return level === "section"
    ? (filters.feedScope as { level: "section"; sectionId: string }).sectionId
    : "Каталог";
}
```

или чище — вынести `feedScope` в отдельную переменную, не «прожжённую» ранними return:

```ts
const scopeLevel = filters.feedScope.level;
const sectionId = filters.feedScope.level === "section"
  ? filters.feedScope.sectionId
  : undefined;
```

---

## 4. useDeferredVideoLoad.ts:4 — `navigator.connection` не в типе `Navigator`

```ts
const c = navigator.connection as
  | { saveData?: boolean; effectiveType?: string }
  | undefined;
```

**Ошибка TS2339:** `navigator.connection` (NetworkInformation API) отсутствует
в стандартном DOM-типе `Navigator` (это нестандартное/экспериментальное API,
доступно только с расширенными lib типа `@types/web` или кастомной декларацией).

**Причина:** API `NetworkInformation` (saveData/effectiveType) — это
Chromium-специфика, не входящая в `lib.dom.d.ts`. `as`-приведение не помогает,
потому что ошибка возникает при доступе к `navigator.connection`, до приведения.

**Как исправить:** привести сам `navigator` к расширенному типу:

```ts
const nav = navigator as Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
};
const c = nav.connection;
```

или объявить глобальную декларацию в `.d.ts`:

```ts
interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}
interface Navigator {
  connection?: NetworkInformation;
}
```

---

## 5. gridColumns.ts:29 — `node` возможно null в цикле

```ts
for (const node of [feed, main, anchor]) {
  const w = node.getBoundingClientRect().width;   // строка 29
  if (w > 0) return w;
}
```

**Ошибка TS18047:** `feed` и `main` объявлены как `HTMLElement | null` (строки 26-27),
поэтому массив `[feed, main, anchor]` имеет тип `(HTMLElement | null)[]`, и
`node.getBoundingClientRect()` на возможно-`null` — ошибка.

**Причина:** `anchor.closest()` возвращает `Element | null`, приведение через
`as HTMLElement | null` сохраняет `null`. Защита в цикле не проверяет `node`.

**Как исправить:** добавить проверку на null в начале итерации:

```ts
for (const node of [feed, main, anchor]) {
  if (!node) continue;
  const w = node.getBoundingClientRect().width;
  if (w > 0) return w;
}
```

или отфильтровать null заранее:

```ts
for (const node of [feed, main, anchor].filter((n): n is HTMLElement => n != null)) {
  const w = node.getBoundingClientRect().width;
  if (w > 0) return w;
}
```

---

## Сводная таблица

| # | Файл | Строка | Ошибка | Суть |
|---|------|--------|--------|------|
| 1 | components/Sidebar.tsx | 295 | TS2677 | Type predicate сужает к несовместимому union кортежей |
| 2 | components/Sidebar.tsx | 346 | TS2488 | Следствие №1: пересечение кортежей без Symbol.iterator |
| 3 | hooks/useAudioPlayer.ts | 208 | TS2322 | `Timeout` (Node) vs `number` (window.setTimeout) |
| 4 | hooks/useCatalog.ts | 353 | TS2367 | Сравнение `"catalog"` vs `"section"` без пересечения (never) |
| 5 | hooks/useCatalog.ts | 353 | TS2339 | `sectionId` не существует на `never` |
| 6 | hooks/useDeferredVideoLoad.ts | 4 | TS2339 | `navigator.connection` не в DOM lib |
| 7 | lib/gridColumns.ts | 29 | TS18047 | `node` возможно null |

---

## Примечание для ответственного

Все 7 ошибок — **только типизация**, не влияют на runtime (Vite/esbuild
компилирует пакет без строгой проверки типов). Они блокируют только
`tsc --noEmit` в хост-проектах, у которых включён `strict` и подключены
`@types/node` + DOM libs одновременно.

Рекомендация вдолгую: добавить в пакет собственный `tsc --noEmit` в CI
(сейчас в package.json только `node --import tsx --test`, тестов, но не typecheck),
чтобы ловить эти регрессии до публикации.

---

## ⚠️ Дополнение: dev-сервер Vite падает (ОТДЕЛЬНЫЙ баг, не типизация)

**Симптом:** `vite dev` (Vite 4.5) крашится с:
```
X [ERROR] No matching export in "node_modules/@vbirukov/player/src/workers/catalog.worker.ts?worker" for import "default"
  node_modules/@vbirukov/player/src/lib/catalogWorker.ts:1:7:
    1 │ import CatalogWorkerCtor from "../workers/catalog.worker?worker";
```
Процесс Node завершается с `Error: Build failed` (краш, не предупреждение).

**Причина:** `src/lib/catalogWorker.ts` (строка 1) делает
`import CatalogWorkerCtor from "../workers/catalog.worker?worker"` — это
Vite-специфичный `?worker`-импорт. Пакет публикует исходники `.ts`, и когда
Vite на dev-сервере встречает этот импорт ВНУТРИ node_modules-пакета,
он не резолвит его корректно (esbuild-препроцесс оптимизированных зависимостей
не понимает `?worker`).

**Важные детали:**
- `vite build` (production) при этом **проходит** — worker обрабатывается иначе.
- Убирание `@vbirukov/player` из `optimizeDeps.include` **не** помогло — ошибка остаётся.
- `%VITE_YM_COUNTER_ID%` в index.html также предупреждается (не критично).

**Что блокирует:** хост не может развивать `vite dev` (HMR, тепло: проверка
UI в браузере). Production-сборка и деплой работают.

**Рекомендация ответственному:** не публиковать raw `.ts` через
`files: ["src"]` без пре-сборки, ЛИБО импортировать worker иначе (например,
через новый URL `new Worker(new URL("./x", import.meta.url))`), либо добавить
`.d.ts`/дистрибутив вместо исходников. Минимальный хак (на стороне хоста):
`.env`/алиас для подмены `catalogWorker.ts`.


# Установка зависимостей для Tailwind CSS, shadcn/ui и GitHub Packages

## 🔐 Доступ к GitHub Packages (@vbirukov/player)

Пакет плеера теперь загружается из GitHub Packages (`@vbirukov/player`), а не из публичного npm реестра. Для установки нужен токен с правами `read:packages`.

### Локально — задайте токен перед `npm install`

**PowerShell (Windows):**
```powershell
$env:NPM_AUTH_TOKEN="<ВАШ_PAT_ТОКЕН>"
npm install
```

**Bash:**
```bash
export NPM_AUTH_TOKEN="<ВАШ_PAT_ТОКЕН>"
npm install
```

Как создать токен: GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → галка `read:packages`. Токен уже подставлен в `.npmrc` через переменную `NPM_AUTH_TOKEN` (строка `//npm.pkg.github.com/:_authToken=${NPM_AUTH_TOKEN}`).

### CI (GitHub Actions)

В `deploy.yml` токен подставляется автоматически: `secrets.GITHUB_TOKEN` (для пакета в том же репозитории) или `secrets.NPM_AUTH_TOKEN` (для пакета в другом репозитории/организации).

## Проблема с npm cache

Если вы получаете ошибку `EPERM: operation not permitted` при установке пакетов, это связано с блокировкой доступа к npm cache (обычно антивирусом или другим процессом).

## Решение

### Вариант 1: Запуск от имени администратора

1. Откройте PowerShell или Command Prompt **от имени администратора**
2. Перейдите в директорию проекта: `cd C:\git\gaiduk`
3. Выполните установку: `npm install`

### Вариант 2: Временное отключение антивируса

1. Временно отключите антивирусную защиту
2. Выполните: `npm install`
3. Включите антивирус обратно

### Вариант 3: Очистка npm cache вручную

1. Закройте все процессы Node.js
2. Удалите директорию: `C:\Users\vbiru\AppData\Local\npm-cache`
3. Выполните: `npm install`

### Вариант 4: Использование yarn (если установлен)

```bash
yarn install
```

## Необходимые пакеты

После решения проблемы с правами доступа, выполните:

```bash
npm install
```

Это установит следующие новые зависимости:

**DevDependencies:**
- tailwindcss@^4.0.0
- postcss@^8.5.1
- autoprefixer@^10.4.20

**Dependencies:**
- @radix-ui/react-slot@^1.1.1
- class-variance-authority@^0.7.1
- clsx@^2.1.1
- tailwind-merge@^2.6.0

## Проверка установки

После успешной установки проверьте работу:

```bash
npm run dev
```

Откройте http://localhost:5173 и убедитесь, что приложение запускается без ошибок.

## Добавление новых компонентов shadcn/ui

После установки зависимостей, вы можете добавлять компоненты командой:

```bash
npx shadcn@latest add [component-name]
```

Например:
```bash
npx shadcn@latest add input label select dialog
```

## Интеграция с существующими стилями

Tailwind CSS интегрирован через `src/index.css`. Этот файл уже импортирует:
- Tailwind базовые стили
- CSS переменные для тем shadcn/ui
- Базовые глобальные стили

Существующие CSS файлы (`styles.css`, `styles-motion.css`, и т.д.) продолжают работать параллельно с Tailwind.

## Использование Tailwind классов

Теперь вы можете использовать Tailwind utility классы в компонентах:

```tsx
<div className="flex items-center justify-center p-4 bg-primary text-primary-foreground">
  Пример использования Tailwind
</div>
```

Или использовать утилиту `cn()` для комбинирования классов:

```tsx
import { cn } from "@/lib/utils"

<div className={cn("base-class", condition && "conditional-class", customClass)} />
```

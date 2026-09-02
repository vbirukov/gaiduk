# Tailwind CSS + shadcn/ui Integration Guide

## ✅ Что было добавлено

### 1. Конфигурационные файлы
- `tailwind.config.js` - конфигурация Tailwind с темами shadcn/ui
- `postcss.config.js` - настройка PostCSS плагинов
- `components.json` - конфигурация shadcn/ui
- `src/index.css` - базовые стили Tailwind и CSS переменные

### 2. Утилиты
- `src/lib/utils.ts` - функция `cn()` для комбинирования классов

### 3. Компоненты
- `src/components/ui/button.tsx` - Button компонент с вариантами
- `src/components/ui/card.tsx` - Card компонент (Card, CardHeader, CardTitle, etc.)
- `src/components/ui/demo.tsx` - пример использования (можно удалить)

### 4. Обновления
- `tsconfig.json` - добавлены path aliases (`@/*` → `./src/*`)
- `vite.config.ts` - добавлен alias для `@`
- `main.tsx` - импортирует `src/index.css`
- `package.json` - добавлены новые зависимости

## 📦 Необходимые зависимости

**Перед запуском установите зависимости:**

```bash
npm install
```

Новые пакеты:
- `tailwindcss` - фреймворк utility-first CSS
- `postcss` - процессор CSS
- `autoprefixer` - автодобавление vendor префиксов
- `class-variance-authority` - управление вариантами компонентов
- `clsx` - условные классы
- `tailwind-merge` - умное объединение Tailwind классов
- `@radix-ui/react-slot` - base для composition компонентов

## 🎨 Использование

### Базовое использование Tailwind

```tsx
<div className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg">
  Hello World
</div>
```

### Использование утилиты cn()

```tsx
import { cn } from "@/lib/utils"

function MyComponent({ className, isActive }: { className?: string, isActive: boolean }) {
  return (
    <div className={cn(
      "base-style padding-4 rounded",
      isActive && "active-style",
      className
    )}>
      Content
    </div>
  )
}
```

### Использование shadcn/ui компонентов

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Card content</p>
        <Button variant="default">Click me</Button>
      </CardContent>
    </Card>
  )
}
```

## 🎯 Варианты Button компонента

```tsx
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Размеры
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

## 🌈 Темы и цвета

shadcn/ui использует CSS переменные для тем. Переменные определены в `src/index.css`:

**Светлая тема:**
```css
--background: 0 0% 100%
--foreground: 222.2 84% 4.9%
--primary: 222.2 47.4% 11.2%
```

**Тёмная тема:**
```css
.dark {
  --background: 222.2 84% 4.9%
  --foreground: 210 40% 98%
  --primary: 210 40% 98%
}
```

Использование:
```tsx
<div className="bg-background text-foreground">Themed content</div>
<div className="bg-primary text-primary-foreground">Primary themed</div>
```

## 📚 Добавление новых компонентов

После установки зависимостей, добавляйте компоненты через CLI:

```bash
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add tabs
```

Или вручную создавайте компоненты в `src/components/ui/`.

## 🔧 Интеграция с существующими стилями

Tailwind работает параллельно с существующими CSS файлами:
- `styles.css` (72KB) - основные стили приложения
- `styles-motion.css` - анимации
- `styles-*.css` - темы

Вы можете постепенно мигрировать на Tailwind или использовать оба подхода.

## ⚠️ Важные замечания

1. **CSS порядок**: `src/index.css` импортируется первым, поэтому существующие стили имеют приоритет при конфликтах
2. **Specificity**: Tailwind utility классы имеют высокую специфичность
3. **Purge**: В production сборке неиспользуемые Tailwind классы будут удалены автоматически
4. **Алиасы**: Используйте `@/` для импортов из `src/` директории

## 🚀 Следующие шаги

1. Установите зависимости: `npm install`
2. Запустите dev сервер: `npm run dev`
3. Проверьте работу компонентов
4. Начните использовать Tailwind в новых компонентах
5. Постепенно рефакторите старые компоненты

## 📖 Ресурсы

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/components)
- [class-variance-authority](https://cva.style/)
- [Radix UI Primitives](https://www.radix-ui.com/)

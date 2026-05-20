# «Pink City Jaipur» – Индийская тема для аудиоплеера

Версия: 1.0  
Автор: Vitaliy + AI‑art director

---

## 1. Концепция

Вторая тема стилизует плеер под Джайпур – «розовый город» Раджастана, с отсылками к фасадам Хава‑Махал и дворцов старого города, построенных из розового и красного песчаника.[web:35] Основные мотивы: терракотово‑розовые стены, белая декоративная обводка, резные jali‑решётки и ажурные арки.[web:39][web:42]

Атмосфера: дневной, солнечный, архитектурный вайб – как будто плеер встроен в фасад дворца.

---

## 2. Бренд‑палитра Jaipur

### 2.1. Основные цвета фасада

Опираемся на сочетание розового песчаника и красного/розового, которым покрыты здания Джайпура.[web:35][web:41]

```text
Jaipur Facade      #C5796D  – основной терракотово‑розовый (стены, крупные фоны)
Jaipur Clay        #B65C4A  – более тёмный кирпично‑красный (хедеры, панели, кнопки)
Jaipur Blush       #F5BCB9  – светлый розовый (подсветки, светлые карточки, hover)
```  

`Jaipur Facade` берём как основной цвет темы – это тёплый «розовый песчаник».[web:43][web:30]

### 2.2. Белая обводка и резьба

```text
Havelis White      #F9F4ED  – основной цвет линий‑узоров, рамок и света
Marble Sand        #E1D5C7  – фон для светлых блоков, плитка пола, колонны
Outline Bright     #FFFFFF  – акцентно‑белый для контраста (тонкие линии по краю)
```

Белой обводкой обрисовываем карточки, кнопки и контуры блоков – как декоративные профили на фасаде.

### 2.3. Акцентные цвета (окна и детали)

На фасадах Джайпура часто встречаются зелёные створки, золотые детали и небесный фон.[web:38][web:41]

```text
Emerald Jharokha   #0F6A55  – зелёные окна, иконки воспроизведения, второстепенный CTA
Saffron Gold       #D89B2C  – декоративные элементы, иконки, маленькие бейджи
Turquoise Inlay    #3BA7A3  – детали в узорах, лёгкие акценты на контролах
Sky Over Jaipur    #B6DDF4  – мягкий голубой для фонов пустых состояний
```

Акценты использовать дозировано, чтобы не превратить интерфейс в «кич».

### 2.4. Текст и нейтрали

```text
Text Palace Dark   #3D2521  – главный текст на светлых фонах (Marble Sand, Jaipur Blush)
Text Facade Light  #FDF7F1  – текст на тёмных терракотовых фонах (Jaipur Clay)
Text Muted         #B6998C  – вторичный текст, подписи, системная информация
Border Soft        #E6C7B5  – мягкие бордеры, деления, раскладка решётки
Shadow Deep        #7D3F35  – тёплые тени под панелями и карточками
```

---

## 3. Семантика и состояния

```text
Success            #2E8B57  – зелёный, родственный Emerald Jharokha
Warning            #F3B257  – тёплый шафрановый, близкий к Saffron Gold
Error              #C4473E  – тёмный красный на базе Jaipur Clay
Info               #4F9AD9  – голубой на базе Sky Over Jaipur
```

Состояния кнопок:
- **Default:** заливка Jaipur Clay, текст Text Facade Light, белая обводка 1–1.5px.
- **Hover:** переходим к более светлому Jaipur Facade + лёгкий inner‑shadow.
- **Pressed:** затемняем до ~Jaipur Clay −10% яркости, усиливаем тень Shadow Deep.

---

## 4. Градиенты и архитектурные панели

### 4.1. Градиенты

**Facade Wash** – основной фон:

- вертикальный: `#D38B77` → `#C5796D` → `#B65C4A` (сверху вниз).

**Courtyard Light** – внутренние панели/карточки:

- радиальный: центр `#F9F4ED` → `#F5BCB9` → край `rgba(197, 121, 109, 0.6)`.

**Sky Arch** – верхние области, шапки:

- вертикальный: `#B6DDF4` → `#F5BCB9`.

### 4.2. Отступы и бордеры

Арки и панели строим за счёт комбинации фона, обводки и внутренней тени:

```css
.panel-arch {
  background: var(--color-bg-panel); /* Jaipur Facade / Blush */
  border: 1.5px solid #F9F4ED; /* Havelis White */
  box-shadow: 0 4px 10px rgba(125, 63, 53, 0.35);
  border-radius: 24px 24px 0 0; /* верхняя арка */
}
```

---

## 5. SVG‑узоры и jali‑решётки

Важная часть темы – традиционные jali‑решётки: ажурные геометрические и растительные орнаменты в арках, окнах и панелях.[web:36][web:39]

### 5.1. Общие принципы

- Цвет линий: `Havelis White` (#F9F4ED) или `Outline Bright` (#FFFFFF).
- Толщина линий: 1–1.5 px на базовом масштабе (можно масштабировать с viewport).
- Типы мотивов: 
  - геометрические «соты» (шестигранники);
  - цветочные мотивы с лепестками и листочками;
  - волнистые и арочные рамки вокруг блоков.
- Заполнение: фон панели (`Jaipur Facade`/`Jaipur Blush`), узор – stroke без заливки или с лёгким полупрозрачным fill (`rgba(249,244,237,0.15)`).

### 5.2. Промт для генерации SVG‑бордеров (midjourney / другое)

```text
thin line vector border inspired by Jaipur Hawa Mahal and Rajasthani jali screens, 
continuous rectangular frame with scalloped arches on the top, intricate floral and geometric lattice, 
white lines on transparent background, no fill, symmetrical, suitable as SVG border for UI cards, 
flat 2d illustration, minimal variation in stroke width, high resolution
```

### 5.3. Промт для генерации повторяющегося jali‑паттерна

```text
seamless 2d vector pattern inspired by Indian jali lattice from Jaipur, 
small repeating hexagonal and floral motifs, thin white lines, no background, 
transparent SVG, evenly spaced grid, simple enough to read at small sizes, 
for use as overlay pattern on UI panels
```

### 5.4. Промт для декоративных арочных порталов

```text
front view 2d vector illustration of a Rajasthani palace archway, 
layered scalloped arches with Jaipur pink sandstone colors, 
white ornamental outlines and floral details, centered composition, 
no shading, flat colors, exportable as SVG for app UI header background
```

---

## 6. Цветовые токены (CSS)

```css
:root {
  /* База */
  --color-jaipur-facade: #C5796D;
  --color-jaipur-clay: #B65C4A;
  --color-jaipur-blush: #F5BCB9;

  --color-bg-panel: var(--color-jaipur-facade);
  --color-bg-elevated: #B65C4A;
  --color-bg-light: #F9F4ED;

  /* Белая резьба */
  --color-outline-main: #F9F4ED;
  --color-outline-bright: #FFFFFF;
  --color-marble-sand: #E1D5C7;

  /* Акценты */
  --color-emerald-jharokha: #0F6A55;
  --color-saffron-gold: #D89B2C;
  --color-turquoise-inlay: #3BA7A3;
  --color-sky-over-jaipur: #B6DDF4;

  /* Текст */
  --color-text-palace-dark: #3D2521;
  --color-text-facade-light: #FDF7F1;
  --color-text-muted: #B6998C;

  --color-border-soft: #E6C7B5;
  --color-shadow-deep: #7D3F35;

  /* Статусы */
  --color-status-success: #2E8B57;
  --color-status-warning: #F3B257;
  --color-status-error: #C4473E;
  --color-status-info: #4F9AD9;
}
```

### 6.1. Theme‑объект для React/TypeScript

```ts
export const jaipurTheme = {
  colors: {
    bg: {
      facade: "#C5796D",
      clay: "#B65C4A",
      light: "#F9F4ED",
    },
    accent: {
      emerald: "#0F6A55",
      saffron: "#D89B2C",
      turquoise: "#3BA7A3",
      sky: "#B6DDF4",
    },
    outline: {
      main: "#F9F4ED",
      bright: "#FFFFFF",
    },
    text: {
      dark: "#3D2521",
      light: "#FDF7F1",
      muted: "#B6998C",
    },
    border: {
      soft: "#E6C7B5",
    },
    status: {
      success: "#2E8B57",
      warning: "#F3B257",
      error: "#C4473E",
      info: "#4F9AD9",
    },
    shadow: {
      deep: "#7D3F35",
    },
  },
};
```

---

## 7. Применение палитры по зонам UI

### 7.1. Главный экран

- Фон: градиент Facade Wash.
- Карточки сказок: `Jaipur Facade` + белая обводка + лёгкий jali‑паттерн как overlay.
- Текст: название – Text Facade Light, мета – Text Muted.
- Кнопка Play: заливка `Emerald Jharokha`, иконка – Havelis White, обводка – Outline Bright.

### 7.2. Экран плеера

- Верхняя часть: Sky Arch, поверх – декоративная SVG‑арка.
- Центральная зона: крупный «портал» в виде арки, внутри – обложка сказки.
- Прогресс‑бар: тонкая полоса `Saffron Gold` на фоне `Jaipur Clay`.

### 7.3. Мини‑плеер

- Фон: `Jaipur Clay` с прозрачностью и blur.
- Текст: Text Facade Light.
- Маленькая рамка/арка вокруг блока мини‑плеера – Outline Main.

### 7.4. Настройки / профиль

- Фон: Marble Sand.
- Карточки секций: Jaipur Blush + мягкая Border Soft.
- Переключатели: активный – Emerald Jharokha, неактивный – Text Muted.

---

## 8. Чек‑лист для реализации

1. Вынести все цвета в отдельный `jaipurTheme` и переключать его с «растаманской» темой по toggle.
2. Реализовать базовый SVG‑pattern jali (hex/flower) для background карточек.
3. Подготовить несколько SVG‑бордеров‑арок согласно промтам и использовать их для хедеров.
4. Строго соблюдать белую обводку по контуру карточек и кнопок.
5. Проверить читаемость Text Facade Light на Jaipure Clay (контраст).
6. Избегать более трёх насыщенных цветов на одном экране.

Тему можно развивать дальше через анимации (медленное появление узоров, «открывающиеся» арки) и отдельный сет иконок в стиле резьбы.

# Theme Pack — «Лунная даб-библиотека» для аудиоприложения Дмитрия Гайдука

## Концепт

Основная тема приложения — **«Лунная даб-библиотека»**: ночная архивная радиотека с духом аналогового звука, тропического нуара, устной сказки и найденных аудиозаписей. Вместо прямолинейной «раста-комедии» визуальный язык строится вокруг ощущений вечернего эфира, катушечного магнитофона, лунного света, пальмовых силуэтов, дымки, теплых баночных огней и выцветшей постерной фактуры, что лучше соответствует музыкально-сказочной атмосфере и более устойчиво для длительного использования интерфейса.[cite:79]

Такой подход согласуется с brief по material-эффектам: наиболее выразительные решения должны концентрироваться в hero, splash, player bar и акцентных состояниях, а каталог и навигация оставаться функциональными и читаемыми.[cite:79]

## Tone of voice

Тема должна ощущаться как:
- архив редких голосов;
- ночная медиатека путешествий и сказок;
- тёплый аналоговый эфир;
- немного мистики, немного иронии, без клоунады;
- premium, but dusty — дорого, но не стерильно.[cite:79]

Ключевая формула стиля: **dub folklore + moonlit archive + tropical noir + analog warmth**.

## Палитра

Базовая палитра темы строится не на чистой раста-триаде, а на приглушённых, состаренных и ночных оттенках, чтобы интерфейс не утомлял при длительном прослушивании и лучше сочетался с grain, glow и frosted glass.[cite:79]

### Основные цвета

| Токен | Цвет | Назначение |
|---|---|---|
| `--color-bg` | `#12100E` | Главный фон, deep soot |
| `--color-surface` | `#1B1612` | Основная поверхность панелей |
| `--color-surface-2` | `#241A14` | Приподнятые карточки |
| `--color-surface-offset` | `#2C2119` | Более плотные слои интерфейса |
| `--color-text` | `#F1E5C9` | Основной текст |
| `--color-text-muted` | `#BDAF90` | Вторичный текст |
| `--color-primary` | `#D79A3B` | Главный янтарный акцент |
| `--color-accent-2` | `#9C5B2E` | Smoked orange |
| `--color-accent-3` | `#5A6B4B` | Moss green |
| `--color-accent-4` | `#2F5F63` | Moon teal |
| `--color-paper` | `#E8D6A8` | Aged paper / мягкие светлые вставки |

### Градиенты

- **Hero glow gradient:** `radial-gradient(circle at 65% 35%, rgba(215,154,59,.28), transparent 36%), radial-gradient(circle at 78% 22%, rgba(47,95,99,.20), transparent 30%), linear-gradient(180deg, #1c1612 0%, #12100e 100%)`
- **Cover amber gradient:** `linear-gradient(180deg, #2b1d14 0%, #9c5b2e 38%, #d79a3b 100%)`
- **Moon tropical gradient:** `linear-gradient(180deg, #234f55 0%, #1a2d2d 35%, #12100e 100%)`

## Типографика

Шрифты должны поддерживать ощущение редакционного, архивного и немного кинематографичного интерфейса.

### Рекомендованная пара

- **Display:** `Boska` или `Zodiak` — для hero и крупных заголовков.
- **Body/UI:** `Satoshi` или `General Sans` — для всего интерфейса, карточек, навигации и controls.

### Правила

- Hero headline — display serif с легким воздухом и контрастом.
- Весь UI ниже `24px` — только body sans.
- Никаких хипповых декоративных шрифтов и буквальных reggae/display-font clichés.

## Материалы и фактуры

### Основные surface-мотивы

- тёмный бакелит / лакированный корпус аудиотехники;
- состаренная бумага и выцветший постер;
- дымка и пленочное зерно;
- мягкое стекло player bar и overlay-слоев.[cite:79]

### Разрешенные material-эффекты

- frosted glass — player bar, modal, splash overlay;[cite:79]
- controlled glow — hero, play button, active cover, logo;[cite:79]
- grain / noise — hero, covers, splash, ambient backgrounds;[cite:79]
- controlled gradients — hero, covers, splash, art panels.[cite:79]

### Запреты

- кислотные неоновые градиенты;
- стекло на всем интерфейсе подряд;
- визуальный перегруз карточек каталога;
- повсеместный tilt и яркое свечение.[cite:79]

## Hero

Hero — это вход в «ночной архив». Он должен работать как главная эмоциональная сцена приложения и сразу задавать мир: луна, дым, пальмы, магнитофон, теплое свечение, далекий островной горизонт, радиошум, ощущение найденной записи.[cite:79]

### Композиция

- Desktop: текст слева, иллюстрация справа.
- Mobile: иллюстрация сверху, текст ниже.
- Под текстом — safety-gradient `linear-gradient(to top, var(--bg), transparent)`.
- Иллюстрация не буквальная, а poster-like: больше атмосферы, меньше нарратива.

### Возможные hero-мотивы

1. Катушечный магнитофон как тотем архива.
2. Луна и пальмы сквозь дым.
3. Световой портал звука / аналоговая радиоволна.
4. Ночной остров и далекий свет, как место, откуда приходит сказка.

## Sidebar

Sidebar — это не арт-объект, а “тихий каталог студии”. Он должен ощущаться как архивный пульт: темный, устойчивый, аккуратный, с минимальным световым акцентом на active item.[cite:79]

### Стиль

- Тёмная поверхность с мягким контрастом.
- Brand-mark вместо буквенного logo-box.
- Active nav item — через color-mix с янтарным акцентом и тонкий inner glow.
- Секции выглядят как вкладки архива, а не как bright SaaS sidebar.

## Карточки

Карточки треков — рабочая зона, поэтому они должны быть спокойнее hero. Их красота строится на поверхности, обложке и аккуратном hover, а не на обилии эффектов.[cite:79]

### Стиль карточек

- Фон: `surface` / `surface-2`.
- Thumbnail слева: 64×64, `border-radius: 16px`.
- Обложки — иллюстративные, poster-like, с baked-in grain.
- Hover: небольшой lift и мягкое усиление тени.
- Playing state: тонкая теплая подсветка thumbnail или outline-ореол.

### Featured block

Если появится блок “Продолжить прослушивание”, его можно делать более выразительным:
- увеличенная обложка;
- слабый amber glow;
- background art blur;
- hint на tilt только на desktop.[cite:79]

## Player bar

Player bar — стеклянный floating-слой, самый «материальный» элемент интерфейса. Он должен ощущаться как тёплый медиа-контрол поверх ночного архива, а не как стандартный bottom bar.[cite:79]

### Стиль

- Полупрозрачный amber-tinted glass.
- Сильно приглушенный blur от текущей обложки на фоне.
- Кнопка Play — самый теплый акцент.
- Mini-cover 44×44 — более контрастная и плотная, чем обычный thumbnail.
- Timeline и metadata всегда важнее декоративных слоев.

### CSS-направление

- `backdrop-filter: blur(18px) saturate(1.08);`
- border через low-opacity warm line;
- слой noise `opacity: 0.03–0.04`;
- glow на play button только в dark theme.[cite:79]

## Splash

Splash — короткий, атмосферный, почти как экран запуска старого музыкального приложения или загрузка кассетного архива. Он нужен не для шоу, а для мягкого входа в мир приложения.[cite:79]

### Сцена

- Темный фон.
- В центре — магнитофон, луна, бренд-символ или звуковой знак.
- Мягкое янтарное свечение.
- Очень слабое зерно и дымка.
- Длительность 1.0–1.2 секунды.

## Brand system

### Название темы

- Русский: **Лунная даб-библиотека**
- Английский внутренний shorthand: **Moon Dub Archive**

### Logo / mark идеи

1. Луна внутри катушки магнитофона.
2. Пальма, превращающаяся в звуковую волну.
3. Круг-луна с дорожкой винила и дымным разрезом.
4. Баночный огонь как точка-сигнал радиостанции.

### Характер логотипа

- Не буквальный reggae-символ.
- Не хипповый clipart.
- Графичный, теплый, слегка мистический, архивный.

## Арт-система для изображений

### Что должно повторяться

- черный или глубокий темный фон;
- лунный/янтарный свет;
- пальмы, дым, катушки, старые усилители, пленка, островные силуэты;
- живописная или постерная фактура;
- ощущение ручной печати или состаренного плаката.

### Что не должно повторяться

- один и тот же старик на байке как единственный мотив;
- комедийная cartoon-эстетика;
- белые стерильные фоны;
- слишком цифровой glossy sci-fi.

## Набор промтов для генерации

Ниже — стартовый пакет промтов под новую тему. Все промты предполагают: без текста, без водяных знаков, cinematic poster texture, moody analog atmosphere.

### 1. Hero — магнитофон

```text
A cinematic poster-like illustration for a music storytelling app hero. A vintage reel-to-reel tape recorder stands like a sacred object in the center, glowing with warm amber light. Behind it, layered moonlit waves of smoke and tropical dusk radiate outward in muted gold, tobacco brown, moss green, and deep teal. The atmosphere feels like a forgotten night archive of oral tales and dub sound. Dark background, aged paper texture, subtle grain, no text, premium and mystical, wide 16:9.
```

### 2. Hero — луна и пальмы

```text
A moody tropical night illustration for an audio folklore library. Tall palm silhouettes stand against a huge warm moon, with soft smoke drifting across the sky and faint glowing particles like dust on old film. The palette is dark teal, amber, smoked orange, and deep brown. The composition leaves negative space for interface text, with a premium vintage poster feel, no text, wide 16:9.
```

### 3. Default cover

```text
Square cover art for an audio tale library. A glowing analog tape recorder in a dark room, surrounded by soft smoke and warm moonlit haze. The image should feel archival, mystical, tropical, and musical at once. Use a restrained palette of amber, moss green, deep soot, and aged paper highlights. Large readable shapes, no text, square 1:1.
```

### 4. Folder cover — island night

```text
Square cover illustration of a mysterious tropical island at night, with palm silhouettes, a low glowing moon, drifting smoke, and distant warm lights across the water. The scene feels like a hidden archive of stories and music. Vintage poster texture, dark background, amber and teal palette, no text, square 1:1.
```

### 5. Folder cover — archive machine

```text
Square poster-like artwork of an old analog machine, part tape recorder and part radio altar, glowing softly in a dark room with smoke and textured shadows. Warm amber lights, muted greens, tobacco browns, subtle grain, handcrafted and atmospheric, no text, square 1:1.
```

### 6. Player bar ambient background

```text
A blurred atmospheric background for a premium audio player bar, based on warm moonlit archive colors. Soft amber glow, dark teal haze, tobacco shadows, drifting smoke, no sharp objects, no text, abstract but cinematic, horizontal 16:9.
```

### 7. Splash screen

```text
A minimal but atmospheric splash screen for an audio storytelling app. In the center, a glowing symbolic object combining a moon, a reel-to-reel tape shape, and a sound wave. The background is deep black-brown with subtle smoke, amber light bloom, and a faint vintage grain texture. Premium, quiet, mysterious, no text, vertical 9:16.
```

### 8. Brand mark exploration

```text
A minimalist square emblem for an audio folklore archive, combining a moon, analog tape reel geometry, and a tropical palm silhouette into one simple symbol. Warm amber on dark background, mystical and archival rather than corporate, clean graphic composition, no text, square 1:1.
```

### 9. Continue listening card art

```text
A cinematic illustration for a featured 'continue listening' card in an audio tale app. A warm glowing road disappears into a smoky tropical night, with silhouettes of palms and distant archive lights. The mood is calm, mysterious, and analog, with premium poster texture and restrained colors. No text, wide 4:3.
```

### 10. Media Session artwork

```text
Premium square artwork for mobile lock screen and media session metadata. A moonlit analog archive scene with a softly glowing tape recorder, drifting smoke, and a tropical night aura. The image must read clearly at small size and still feel rich at large size. Dark background, warm amber highlights, muted teal shadows, no text, square 1:1.
```

## Практический пакет ассетов

Рекомендуемый минимальный набор генерации для первой версии:

- `hero-tape-recorder.png`
- `hero-palm-moon.png`
- `cover-default.png`
- `cover-island-night.png`
- `cover-archive-machine.png`
- `player-ambient.png`
- `splash-archive.png`
- `brand-mark.png`
- `continue-listening.png`
- `media-session-cover.png`

## Краткий дизайн-манифест

Это приложение должно ощущаться не как очередной музыкальный каталог, а как **ночной архив сказок, найденных между тропическим эфиром, катушечным звуком и лунной дорогой**. Его задача — не копировать literal reggae imagery, а создать цельный, взрослый и атмосферный мир прослушивания, в котором материалы, свет, обложки и звук работают как одна система.[cite:79]

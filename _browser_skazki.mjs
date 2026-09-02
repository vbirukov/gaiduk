import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', msg => {
  if (msg.type() === 'error') console.log(`[ERROR] ${msg.text().slice(0, 200)}`);
});

// Сначала проверим секцию SKAZKI NARODOV MIRA (18 треков) — пользователь сказал там 1 трек
console.log('Opening page...');
await page.goto('https://xn--80afepl7c.xn--p1ai', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);

// Найдём секцию "03 SKAZKI NARODOV MIRA" по заголовку
const allSections = await page.$$('.catalog-section-block');
console.log('Sections:', allSections.length);

for (const section of allSections) {
  const title = await section.$eval('.catalog-section-block__title', el => el.textContent).catch(() => '');
  if (title.includes('SKAZKI NARODOV MIRA')) {
    console.log(`\nFound section: "${title}"`);
    const openBtn = await section.$('.catalog-section-block__open');
    await openBtn.click();
    await page.waitForTimeout(3000);
    break;
  }
}

// Мы на уровне папок внутри секции
const folders = await page.$$('.folder-card');
console.log('Folders in section:', folders.length);

// Кликнем на папку "03 SKAZKI NARODOV MIRA"
for (const folder of folders) {
  const name = await folder.$eval('[class*="name"]', el => el.textContent).catch(() => 
    folder.$eval('h3', el => el.textContent).catch(() => '?'));
  console.log(`Folder: "${name}"`);
  await folder.click();
  await page.waitForTimeout(3000);
  break;
}

// Сделаем скриншот
await page.screenshot({ path: 'C:\\git\\gaiduk\\_debug_skazki.png', fullPage: true });
console.log('Screenshot saved.');

// Дампнем main
const mainText = await page.$eval('main', el => el.textContent?.slice(0, 3000)).catch(() => '?');
console.log('\n=== Main content ===');
console.log(mainText);

// Посчитаем треки — ищем кнопки Play
const playButtons = await page.$$('[aria-label*="Воспроизвести"], [aria-label*="Play"], button[class*="play"]');
console.log(`\nPlay buttons: ${playButtons.length}`);

// Ищем строки треков
const allButtons = await page.$$('main button');
console.log(`All buttons in main: ${allButtons.length}`);

// Проверим, что в DOM есть список треков
const trackList = await page.$('[class*="track-list"], [class*="TrackList"], [class*="feed"]');
console.log(`Track list container: ${trackList ? 'found' : 'NOT FOUND'}`);

// Получим все элементы с data-track-id
const trackItems = await page.$$('[data-track-id]');
console.log(`Elements with data-track-id: ${trackItems.length}`);

await browser.close();
console.log('Done.');
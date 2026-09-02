import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Ловим консольные сообщения
page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    console.log(`[${msg.type()}] ${msg.text().slice(0, 200)}`);
  }
});

// Ловим ошибки
page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

console.log('Opening page...');
await page.goto('https://xn--80afepl7c.xn--p1ai', { waitUntil: 'networkidle', timeout: 30000 });

// Ждём загрузки каталога
console.log('Waiting for catalog...');
await page.waitForTimeout(5000);

// Проверяем localStorage
const cacheRaw = await page.evaluate(() => localStorage.getItem('gayduk-catalog-cache-v1'));
const cache = cacheRaw ? JSON.parse(cacheRaw) : null;
console.log('\n=== localStorage catalog cache ===');
if (cache) {
  console.log('tracks:', cache.tracks?.length);
  console.log('sections:', cache.sections);
  console.log('folders:', cache.folders?.length);
  console.log('loaded:', cache.loaded);
  // Покажем первые 3 трека
  if (cache.tracks) {
    console.log('Sample tracks:');
    cache.tracks.slice(0, 5).forEach(t => {
      console.log(`  folder="${t.folder}" section="${t.section}" title="${t.title?.slice(0, 50)}"`);
    });
  }
  // Сгруппируем по section
  const bySection = {};
  cache.tracks?.forEach(t => {
    const s = t.section || 'NONE';
    if (!bySection[s]) bySection[s] = {};
    if (!bySection[s][t.folder]) bySection[s][t.folder] = 0;
    bySection[s][t.folder]++;
  });
  console.log('\nBy section:');
  for (const [s, folders] of Object.entries(bySection)) {
    console.log(`  "${s}":`);
    for (const [f, c] of Object.entries(folders)) {
      console.log(`    ${c} tracks: ${f}`);
    }
  }
} else {
  console.log('NO CACHE');
}

// Проверяем DOM — какие секции и папки видны
console.log('\n=== DOM: sections ===');
const sections = await page.$$('.catalog-section-block');
console.log('Section blocks found:', sections.length);
for (const section of sections) {
  const title = await section.$eval('.catalog-section-block__title', el => el.textContent).catch(() => '?');
  const count = await section.$eval('.catalog-section-block__count', el => el.textContent).catch(() => '?');
  const folders = await section.$$('.folder-card');
  console.log(`\n  "${title}" — ${count}`);
  for (const card of folders) {
    const name = await card.$eval('[class*="folder-card__name"]', el => el.textContent).catch(() => '?');
    const trackCount = await card.$eval('[class*="folder-card__count"]', el => el.textContent).catch(() => '?');
    console.log(`    ${name} — ${trackCount}`);
  }
}

// Проверяем, есть ли секция с id="section-..."
console.log('\n=== DOM: section headings ===');
const headings = await page.$$('h2[id^="section-"]');
for (const h of headings) {
  console.log(`  ${await h.getAttribute('id')}: ${await h.textContent()}`);
}

// Скриншот для отладки
await page.screenshot({ path: 'C:\\git\\gaiduk\\_debug_screenshot.png', fullPage: true });
console.log('\nScreenshot saved to _debug_screenshot.png');

await browser.close();
console.log('Done.');
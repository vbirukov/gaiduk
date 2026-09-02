import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', msg => {
  if (msg.type() === 'error') console.log(`[ERROR] ${msg.text().slice(0, 200)}`);
});
page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

console.log('Opening page...');
await page.goto('https://xn--80afepl7c.xn--p1ai', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);

// Кликаем на первую папку в секции "01 RASTAMANSKIE SKAZKI"
// Найдём кнопку "Открыть" в первой секции
console.log('\n=== Clicking "Открыть" on first section ===');
const openButtons = await page.$$('.catalog-section-block__open');
console.log('Open buttons found:', openButtons.length);
if (openButtons.length > 0) {
  await openButtons[0].click();
  await page.waitForTimeout(3000);
  
  // Теперь мы должны быть на уровне папок
  const cards = await page.$$('.folder-card');
  console.log('Folder cards found:', cards.length);
  
  // Кликнем на первую папку
  if (cards.length > 0) {
    console.log('Clicking first folder card...');
    await cards[0].click();
    await page.waitForTimeout(3000);
    
    // Теперь должны быть видны треки
    const trackCards = await page.$$('[class*="track"]');
    console.log('Track elements found:', trackCards.length);
    
    // Ищем любые элементы с классом содержащим track
    const allTrackElements = await page.$$('[class*="track"], [class*="Track"], [class*="card"]');
    console.log('All track/card elements:', allTrackElements.length);
    
    // Посмотрим на breadcrumbs
    const breadcrumbs = await page.$$eval('[class*="breadcrumb"]', els => els.map(e => e.textContent));
    console.log('Breadcrumbs:', breadcrumbs);
    
    // Посмотрим на заголовок секции
    const sectionTitle = await page.$eval('[class*="section-title"], [class*="feed-title"], h2', el => el.textContent).catch(() => '?');
    console.log('Section title:', sectionTitle);
    
    // Сделаем скриншот
    await page.screenshot({ path: 'C:\\git\\gaiduk\\_debug_folder.png', fullPage: true });
    console.log('Screenshot saved to _debug_folder.png');
    
    // Дампнем весь видимый текст
    const bodyText = await page.$eval('main', el => el.textContent?.slice(0, 2000)).catch(() => '?');
    console.log('\n=== Main content ===');
    console.log(bodyText);
  }
}

await browser.close();
console.log('Done.');
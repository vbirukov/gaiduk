import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', msg => {
  if (msg.type() === 'error') console.log(`[ERROR] ${msg.text().slice(0, 200)}`);
});

console.log('Opening page...');
await page.goto('https://xn--80afepl7c.xn--p1ai', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);

// Проходим по всем секциям и проверяем треки в каждой папке
const sections = await page.$$('.catalog-section-block');
console.log(`Found ${sections.length} sections\n`);

for (let i = 0; i < sections.length; i++) {
  // Перезагружаем страницу для каждого теста
  await page.goto('https://xn--80afepl7c.xn--p1ai', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const openButtons = await page.$$('.catalog-section-block__open');
  if (i >= openButtons.length) break;
  
  const sectionTitle = await openButtons[i].evaluate(el => el.closest('.catalog-section-block')?.querySelector('.catalog-section-block__title')?.textContent);
  const sectionCount = await openButtons[i].evaluate(el => el.closest('.catalog-section-block')?.querySelector('.catalog-section-block__count')?.textContent);
  console.log(`=== Section ${i+1}: "${sectionTitle}" (${sectionCount}) ===`);
  
  await openButtons[i].click();
  await page.waitForTimeout(2000);
  
  const folders = await page.$$('.folder-card');
  console.log(`  Folders: ${folders.length}`);
  
  for (let j = 0; j < Math.min(folders.length, 3); j++) {
    // Получаем имя папки и количество треков из карточки
    const folderName = await folders[j].evaluate(el => {
      const name = el.querySelector('[class*="name"]')?.textContent || el.querySelector('h3')?.textContent || '';
      const count = el.querySelector('[class*="count"]')?.textContent || '';
      return `${name} (${count})`;
    });
    console.log(`    Folder: ${folderName}`);
    
    await folders[j].click();
    await page.waitForTimeout(2000);
    
    // Считаем треки
    const trackItems = await page.$$('[class*="track-item"], [class*="TrackItem"], [class*="track-row"]');
    // Ищем любой список треков
    const trackTexts = await page.$$eval('[class*="track"]', els => els.slice(0, 5).map(e => e.textContent?.slice(0, 80)));
    const listItems = await page.$$eval('main li, main [role="listitem"]', els => els.length);
    
    // Breadcrumb для понимания где мы
    const breadcrumb = await page.$eval('[class*="breadcrumb"]', el => el.textContent?.replace(/\s+/g, ' ').trim()).catch(() => '?');
    console.log(`      Breadcrumb: ${breadcrumb?.slice(0, 100)}`);
    console.log(`      Track items found: ${trackItems.length}, list items: ${listItems}`);
    if (trackTexts.length > 0) {
      trackTexts.slice(0, 5).forEach(t => console.log(`        ${t}`));
    }
    
    // Возвращаемся назад
    await page.goBack({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
}

await browser.close();
console.log('\nDone.');
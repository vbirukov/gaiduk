import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const tests = [
  { section: 'INDIYSKIY POKOYNIK', folder: '05 INDIYSKIY POKOYNIK', expected: 12 },
  { section: 'DEVYANOSTO MESYACEV', folder: '06 DEVYANOSTO MESYACEV', expected: 16 },
  { section: 'POVEST', folder: "04 POVEST' PRO CHUJIE GLAZA", expected: 36 },
];

for (const test of tests) {
  console.log(`\n=== Testing: ${test.section} (expected ${test.expected} tracks) ===`);
  
  await page.goto('https://xn--80afepl7c.xn--p1ai', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  // Найти секцию
  const sections = await page.$$('.catalog-section-block');
  let found = false;
  for (const section of sections) {
    const title = await section.$eval('.catalog-section-block__title', el => el.textContent).catch(() => '');
    if (title.includes(test.section)) {
      const openBtn = await section.$('.catalog-section-block__open');
      await openBtn.click();
      await page.waitForTimeout(2000);
      found = true;
      break;
    }
  }
  if (!found) { console.log('  Section NOT found'); continue; }
  
  const folders = await page.$$('.folder-card');
  for (const folder of folders) {
    const name = await folder.evaluate(el => {
      const h = el.querySelector('h3');
      return h ? h.textContent : '';
    });
    if (name === test.folder) {
      await folder.click();
      await page.waitForTimeout(2000);
      break;
    }
  }
  
  const trackItems = await page.$$('[data-track-id]');
  console.log(`  Tracks found: ${trackItems.length} / ${test.expected}`);
  if (trackItems.length !== test.expected) {
    console.log('  MISMATCH!');
  }
}

await browser.close();
console.log('\nDone.');
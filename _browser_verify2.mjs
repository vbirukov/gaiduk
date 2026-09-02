import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const tests = [
  { section: 'INDIYSKIY POKOYNIK', expected: 12 },
  { section: 'DEVYANOSTO MESYACEV', expected: 16 },
  { section: 'POVEST', expected: 36 },
  { section: 'BOLSHOE PUTESHESTVIE', expected: 29 },
  { section: 'KONOPLYANAYA DEMONOLOGIYA', expected: 14 },
];

for (const test of tests) {
  console.log(`\n=== ${test.section} (expected ${test.expected}) ===`);
  
  try {
    await page.goto('https://xn--80afepl7c.xn--p1ai', { waitUntil: 'load', timeout: 20000 });
  } catch {
    await page.goto('https://xn--80afepl7c.xn--p1ai', { waitUntil: 'load', timeout: 20000 });
  }
  await page.waitForTimeout(6000);
  
  const sections = await page.$$('.catalog-section-block');
  let found = false;
  for (const section of sections) {
    const title = await section.$eval('.catalog-section-block__title', el => el.textContent).catch(() => '');
    if (title.includes(test.section)) {
      await section.$eval('.catalog-section-block__open', btn => btn.click());
      await page.waitForTimeout(2500);
      found = true;
      break;
    }
  }
  if (!found) { console.log('  Section NOT found'); continue; }
  
  const folders = await page.$$('.folder-card');
  if (folders.length > 0) {
    await folders[0].click();
    await page.waitForTimeout(2500);
  }
  
  const trackItems = await page.$$('[data-track-id]');
  console.log(`  Tracks: ${trackItems.length} / ${test.expected} ${trackItems.length === test.expected ? 'OK' : 'MISMATCH'}`);
}

await browser.close();
console.log('\nDone.');
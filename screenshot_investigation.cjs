const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Go to app
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Try to find a button to navigate to the investigation/workspace
  const buttons = await page.$$eval('button, a', els => els.map(el => ({ text: el.textContent?.trim(), id: el.id })));
  console.log('Buttons found:', JSON.stringify(buttons.slice(0, 30)));

  // Click the "Open Investigation" or "Investigate" or "View Dashboard" button
  const clickedNav = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('button, a'));
    const target = candidates.find(el => {
      const t = el.textContent?.trim().toLowerCase();
      return t?.includes('investigate') || t?.includes('open investigation') || t?.includes('view demo') || t?.includes('try live demo') || t?.includes('dashboard');
    });
    if (target) {
      target.click();
      return target.textContent?.trim();
    }
    return null;
  });
  console.log('Clicked:', clickedNav);
  await new Promise(r => setTimeout(r, 2500));

  // Screenshot the full page
  await page.screenshot({
    path: '/Users/salma/SafeGuard-AI/investigation_panel.png',
    fullPage: false
  });

  // Also try to find the workspace by URL hash or clicking investigate
  const url = page.url();
  console.log('Current URL:', url);

  await browser.close();
  console.log('Done');
})();

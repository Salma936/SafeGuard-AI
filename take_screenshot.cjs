const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, a'));
      const target = candidates.find(el => el.textContent?.trim().toLowerCase().includes('analyze an incident'));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 2500));

    await page.evaluate(() => {
      const btn = document.getElementById('btn-toggle-technical-details');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 900));

    // Scroll to show the full constellation
    await page.evaluate(() => window.scrollBy(0, 1800));
    await new Promise(r => setTimeout(r, 700));

    await page.screenshot({ path: '/Users/salma/SafeGuard-AI/screen_constellation_full.png', fullPage: false });
    console.log('Done');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (browser) await browser.close();
  }
})();

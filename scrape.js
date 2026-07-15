// Course-page scraper: drives the system Chrome via puppeteer-core.
// Usage: node scrape.js <slug> <url> [waitMs]
// Writes /tmp/shots/<slug>.png and prints rendered visible text (trimmed).
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = '/usr/bin/google-chrome';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

(async () => {
  const [,, slug, url, waitMsArg] = process.argv;
  if (!slug || !url) { console.error('usage: node scrape.js <slug> <url> [waitMs]'); process.exit(2); }
  const waitMs = parseInt(waitMsArg || '3500');
  fs.mkdirSync('/tmp/shots', { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--window-size=1366,2200'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1366, height: 2200, deviceScaleFactor: 1 });
    let status = 'n/a';
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      status = resp ? resp.status() : 'no-response';
    } catch (e) {
      status = 'goto-error: ' + e.message.split('\n')[0];
    }
    await new Promise(r => setTimeout(r, waitMs));
    const shot = `/tmp/shots/${slug}.png`;
    await page.screenshot({ path: shot, fullPage: true }).catch(e => console.error('shot err', e.message));
    // Pull visible text, collapse whitespace
    const text = await page.evaluate(() => (document.body ? document.body.innerText : '')).catch(() => '');
    const clean = text.replace(/\n{2,}/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
    console.log(`### ${slug} | HTTP ${status} | shot ${shot}`);
    console.log(`### title: ${await page.title().catch(()=>'')}`);
    console.log('----- TEXT START -----');
    console.log(clean.slice(0, 6000));
    console.log('----- TEXT END -----');
  } finally {
    await browser.close();
  }
})();

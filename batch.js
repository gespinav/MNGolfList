// Batch scraper — reuses one Chrome, visits many URLs, writes text + screenshot per slug.
// Usage: node batch.js targets.json   (array of {slug,url,waitMs})
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const CHROME = '/usr/bin/google-chrome';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

(async () => {
  const targets = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--window-size=1366,2200'],
  });
  for (const t of targets) {
    const page = await browser.newPage();
    try {
      await page.setUserAgent(UA);
      await page.setViewport({ width: 1366, height: 2200, deviceScaleFactor: 1 });
      let status = 'n/a';
      try {
        const resp = await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 40000 });
        status = resp ? resp.status() : 'no-resp';
      } catch (e) { status = 'goto-err:' + e.message.split('\n')[0]; }
      await new Promise(r => setTimeout(r, t.waitMs || 3000));
      await page.screenshot({ path: `/tmp/shots/${t.slug}.png`, fullPage: true }).catch(()=>{});
      const text = await page.evaluate(() => document.body ? document.body.innerText : '').catch(()=> '');
      const clean = text.replace(/\n{2,}/g,'\n').replace(/[ \t]{2,}/g,' ').trim();
      console.log(`\n###### ${t.slug} | HTTP ${status} | ${t.url}`);
      console.log(clean.slice(0, t.cap || 2500));
    } catch (e) {
      console.log(`\n###### ${t.slug} | FATAL ${e.message}`);
    } finally { await page.close().catch(()=>{}); }
  }
  await browser.close();
})();

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = { runtime: 'nodejs20.x', maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { target, selector, click, wait = 'table', html = '0', hint = 'PTS' } = req.query;

  const defaultUrl = 'https://www.rfef.es/es/competiciones/segunda-federacion';
  const url = target || defaultUrl;

  let browser;
  const logs = [];
  try {
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    if (click) {
      const parts = String(click).split('|').map(s => s.trim()).filter(Boolean);
      for (const txt of parts) {
        logs.push('clicking: ' + txt);
        await page.evaluate((t) => {
          const needle = t.toLowerCase();
          const nodes = Array.from(document.querySelectorAll('a,button,[role="tab"],[role="button"],li,div,span'));
          const el = nodes.find(e => (e.textContent || '').toLowerCase().includes(needle));
          if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }, txt);
        await page.waitForTimeout(700);
      }
    }

    const waitSelector = selector || wait || 'table';
    try { await page.waitForSelector(waitSelector, { timeout: 20000 }); } catch {}

    const htmlOut = await page.evaluate(({ selector, hint }) => {
      const OUTER = n => (n && n.outerHTML) || '';
      const up = s => (s || '').toUpperCase();

      if (selector) {
        const node = document.querySelector(selector);
        if (node) {
          node.querySelectorAll('img[src^="/"]').forEach(img => {
            try { img.src = new URL(img.getAttribute('src'), location.origin).href; } catch {}
          });
          node.classList.add('standings-table');
          return OUTER(node);
        }
      }

      const tables = Array.from(document.querySelectorAll('table'));
      for (const t of tables) {
        const txt = up(t.textContent);
        if (!hint || txt.includes(up(hint))) {
          t.querySelectorAll('img[src^="/"]').forEach(img => {
            try { img.src = new URL(img.getAttribute('src'), location.origin).href; } catch {}
          });
          t.classList.add('standings-table');
          return OUTER(t);
        }
      }

      const cont = document.querySelector('[class*="clasif"], [class*="tabla"], [id*="clasif"], [id*="tabla"]');
      if (cont) {
        cont.classList.add('standings-table');
        cont.querySelectorAll('img[src^="/"]').forEach(img => {
          try { img.src = new URL(img.getAttribute('src'), location.origin).href; } catch {}
        });
        return OUTER(cont);
      }

      return '';
    }, { selector, hint });

    const style = `
<style>
.standings-table{width:100%;border-collapse:collapse;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
.standings-table th,.standings-table td{padding:8px;border-bottom:1px solid #eee;font-size:14px;text-align:left}
.standings-table thead th{position:sticky;top:0;background:#fafafa;z-index:1}
.standings-table img{width:22px;height:22px;border-radius:4px;vertical-align:middle}
</style>`;

    if (!htmlOut) {
      return res.status(404).json({ error: 'no-node-found', logs });
    }

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=86400');
    if (html === '1') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(style + htmlOut);
    } else {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).json({ html: style + htmlOut });
    }
  } catch (e) {
    logs.push('error:' + (e?.message || String(e)));
    return res.status(500).json({ error: e?.message || String(e), logs });
  } finally {
    try { await browser?.close(); } catch {}
  }
}

import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import maskCheck from './integrations/mask-check.mjs';

// canonical・sitemap・robots.txt・OGP のURLはここから作られる
const site = 'https://sagi-sms.com';

// 事例の一覧を載せているページ(トップ・事例一覧・対策ガイド)の更新日(lastmod)は、事例の最新の受信日
// 先に dist に出力される sitemap-cases.xml から読む。運営者情報などの固定ページは、ビルドのたびに日付が変わらないよう付けない
const LIST_PAGES = ['/', '/cases/', '/guide/'];
function latestCaseDate() {
  try {
    const xml = fs.readFileSync(new URL('./dist/sitemap-cases.xml', import.meta.url), 'utf-8');
    return [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]).sort().at(-1);
  } catch {
    return undefined;
  }
}

export default defineConfig({
  site,
  // 事例ページ(/cases/〇〇/)は更新日つきの src/pages/sitemap-cases.xml.ts に出すので、ここでは除外する
  // customSitemaps で sitemap-index.xml に載せる(Search Console には sitemap-index.xml だけ送信すれば事例ページも伝わる)
  integrations: [
    sitemap({
      filter: (page) => !/\/cases\/[^/]+\/$/.test(page),
      customSitemaps: [new URL('sitemap-cases.xml', site).href],
      serialize: (item) => {
        const lastmod = LIST_PAGES.includes(new URL(item.url).pathname) ? latestCaseDate() : undefined;
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    maskCheck(),
  ],
});

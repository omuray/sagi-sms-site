import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import phoneCheck from './integrations/phone-check.mjs';

// canonical・sitemap・robots.txt・OGP のURLはここから作られる
const site = 'https://sagi-sms.com';

export default defineConfig({
  site,
  // 事例ページ(/cases/〇〇/)は更新日つきの src/pages/sitemap-cases.xml.ts に出すので、ここでは除外する
  // customSitemaps で sitemap-index.xml に載せる(Search Console には sitemap-index.xml だけ送信すれば事例ページも伝わる)
  integrations: [
    sitemap({
      filter: (page) => !/\/cases\/[^/]+\/$/.test(page),
      customSitemaps: [new URL('sitemap-cases.xml', site).href],
    }),
    phoneCheck(),
  ],
});

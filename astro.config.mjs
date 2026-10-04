import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import phoneCheck from './integrations/phone-check.mjs';

export default defineConfig({
  // 独自ドメインを取得したら書き換える
  site: 'https://sagi-sms-site.pages.dev',
  // 事例ページ(/cases/〇〇/)は更新日つきの src/pages/sitemap-cases.xml.ts に出すので、ここでは除外する
  integrations: [sitemap({ filter: (page) => !/\/cases\/[^/]+\/$/.test(page) }), phoneCheck()],
});

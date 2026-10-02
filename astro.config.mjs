import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 独自ドメインを取得したら書き換える
  site: 'https://sagi-sms-site.pages.dev',
  integrations: [sitemap()],
});

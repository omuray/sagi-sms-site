import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 手口ごとの共通解説(見分け方・対処法など)
// ファイル名 = ページのURL名(例:sagawa-delivery.md)
// 該当ファイルがない手口は default.md を使う
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    summary: z.string(),
  }),
});

export const collections = { guides };

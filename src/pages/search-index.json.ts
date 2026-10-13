import type { APIRoute } from 'astro';
import { getGroups } from '../lib/sheet';
import type { SearchEntry } from '../lib/search';

// サイト内検索の索引。検索窓(src/components/SearchBox.astro)が入力時に読み込む
// 本文は事例ページと同じ、無害化済みのもの
export const GET: APIRoute = async () => {
  const entries: SearchEntry[] = (await getGroups()).map((g) => ({
    slug: g.slug,
    spoof: g.spoof,
    method: g.method,
    media: g.media,
    total: g.total,
    bodies: g.cases.map((c) => c.body),
  }));
  return new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};

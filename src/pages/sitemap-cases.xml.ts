import type { APIRoute } from 'astro';
import { getGroups } from '../lib/sheet';

// 事例ページの sitemap。更新日(lastmod)は、そのページで最新の受信日
// ほかのページは @astrojs/sitemap が sitemap-index.xml に出す(astro.config.mjs の filter で事例ページを除外)
export const GET: APIRoute = async ({ site }) => {
  const urls = (await getGroups()).map((g) => {
    const loc = new URL(`/cases/${g.slug}/`, site).href;
    const lastmod = Number.isNaN(g.latest.getTime()) ? '' : `<lastmod>${g.latest.toISOString()}</lastmod>`;
    return `  <url><loc>${loc}</loc>${lastmod}</url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

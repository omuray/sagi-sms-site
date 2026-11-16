import type { APIRoute } from 'astro';

// sitemap の場所は astro.config.mjs の site から作る(独自ドメインに変えると自動で追従)
// /cdn-cgi/ は Cloudflare が自動で作るURL(メールアドレスの難読化など)で、ページではないのでクロールさせない
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /cdn-cgi/\n\nSitemap: ${new URL('sitemap-index.xml', site)}\nSitemap: ${new URL('sitemap-cases.xml', site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

import type { APIRoute, GetStaticPaths } from 'astro';
import { adsenseClient } from '../lib/adsense';

// ads.txt(AdSense の販売者の宣言)。PUBLIC_ADSENSE_CLIENT が未設定のときはファイル自体を作らない
// (中身が空の ads.txt は「販売を許可した事業者なし」の意味になり、広告が配信されなくなるため)
export const getStaticPaths: GetStaticPaths = () => (adsenseClient ? [{ params: { file: 'ads' } }] : []);

export const GET: APIRoute = () =>
  new Response(`google.com, ${adsenseClient!.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

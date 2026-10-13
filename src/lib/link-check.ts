// 公式注意喚起のリンク切れを調べる(サイトを作るときに src/lib/sheet.ts から呼ぶ)
// 「切れている」と言い切れるものだけを外す。アクセス拒否(403)や時間切れは、
// 機械的なアクセスや海外からのアクセスを断っているだけのことが多いので、切れているとはみなさない

export type LinkStatus = 'ok' | 'dead' | 'unknown';
export type LinkResult = { url: string; status: LinkStatus; reason: string };

const TIMEOUT_MS = 10000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
// ステータスは200なのに中身が「見つかりません」のページ(タイトルで判定)
const NOT_FOUND_TITLE = /404|not\s*found|見つかりません|表示できません|存在しません|お探しのページ/i;
// 転送先がエラーページ(例:/error/404.htm)
const ERROR_PATH = /\/(?:error|errors|404|notfound|not-found)(?:[\/.]|$)/i;

function titleOf(html: string): string {
  return (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim();
}

export async function checkLink(url: string): Promise<LinkResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ja,en;q=0.8', Accept: 'text/html,application/pdf,*/*;q=0.8' },
    });
  } catch (e) {
    return { url, status: 'unknown', reason: `接続できず(${e instanceof Error ? e.name : '不明'})` };
  }
  if (res.status === 404 || res.status === 410) return { url, status: 'dead', reason: `${res.status}` };
  if (!res.ok) return { url, status: 'unknown', reason: `${res.status}` };

  // 個別のページがなくなり、トップページへ転送されている
  const from = new URL(url);
  const to = new URL(res.url);
  if (from.pathname.length > 1 && to.pathname === '/' && to.search === '') {
    return { url, status: 'dead', reason: 'トップページへ転送' };
  }
  if (to.href !== from.href && ERROR_PATH.test(to.pathname) && !ERROR_PATH.test(from.pathname)) {
    return { url, status: 'dead', reason: `エラーページへ転送(${to.pathname})` };
  }

  if ((res.headers.get('content-type') ?? '').includes('html')) {
    try {
      const bytes = new Uint8Array(await res.arrayBuffer()).slice(0, 65536);
      // 文字コードはヘッダー、なければページ内の指定(Shift_JIS のページがある)から決める
      const charset =
        res.headers.get('content-type')?.match(/charset=["']?([\w-]+)/i)?.[1] ??
        new TextDecoder('latin1').decode(bytes).match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ??
        'utf-8';
      let html: string;
      try {
        html = new TextDecoder(charset).decode(bytes);
      } catch {
        html = new TextDecoder().decode(bytes);
      }
      const title = titleOf(html);
      if (NOT_FOUND_TITLE.test(title)) return { url, status: 'dead', reason: `タイトルが「${title.slice(0, 40)}」` };
    } catch {
      // 本文が読めなくても、ステータスが200なら生きているとみなす
    }
  }
  return { url, status: 'ok', reason: `${res.status}` };
}

export async function checkLinks(urls: string[]): Promise<Map<string, LinkResult>> {
  const unique = [...new Set(urls.filter((u) => u !== ''))];
  const results = await Promise.all(unique.map(checkLink));
  return new Map(results.map((r) => [r.url, r]));
}

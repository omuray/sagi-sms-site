import Papa from 'papaparse';
import fs from 'node:fs/promises';
import { SPOOF_SLUGS, METHOD_SLUGS, EXCLUDED_METHODS, toSlug } from './slugs';

// 公開用シートの見出し名(シート側で変えたらここも変える)
const COL = {
  date: 'タイムスタンプ',
  media: '媒体',
  spoof: 'なりすまし先',
  method: '手口',
  body: '本文',
  url: 'URL(無害化)',
  official: '公式注意喚起',
  count: '受信回数',
};

export type Case = {
  date: Date;
  media: string;
  spoof: string;
  method: string;
  body: string;
  url: string;
  official: string;
  count: number;
};

export type CaseGroup = {
  slug: string;
  spoof: string;
  method: string;
  media: string;
  cases: Case[];
  total: number;
  latest: Date;
  official: string;
};

// URLをリンクにならない形にする
// ドメインに装飾文字(ⓦ 𝕪 など)が混ざっていても最後まで無害化する。無害化済み(hxxp)の残りの「.」も直す
export function defang(text: string): string {
  return text.replace(/h(?:tt|xx)ps?:\/\/[!-~\p{L}\p{N}\p{S}]+/gu, (u) =>
    u.replace(/^http/, 'hxxp').replace(/(?<!\[)\.(?!\])/g, '[.]'),
  );
}

// URLに含まれる受信者固有の値(ログインID・パスワード・メールアドレスを符号化した文字列など)を伏せる
// 12桁以上の数字(送信ごとに変わる追跡番号の可能性がある)は先頭4桁だけ残す(例:2026**********)
export function maskUrlParams(text: string): string {
  return text
    .replace(/([?&;](?:id|uid|mid|user|userid|login|pass|pw|passwd|password|email|mail|token|key|code|dst)=)[^\s&#]+/gi, '$1***')
    .replace(/\?[A-Za-z0-9+\/_%-]{20,}={0,2}/g, '?***')
    .replace(/(?<!\d)(\d{4})(\d{8,})(?!\d)/g, (_, head, rest) => head + '*'.repeat(rest.length));
}

// 電話番号(区切りあり・なし、国際表記を含む)
// 3つ目は区切りなしの日本の国際表記(例:818054699501、+818054699501)
const PHONE = /(?:\+\d{1,3}[\s\-‑]?)?\(?0?\d{1,4}\)?[\s\-‑]\d{2,4}[\s\-‑]\d{3,4}(?!\d)|(?<!\d)0\d{9,10}(?!\d)|(?<![\d+])\+?81\d{9,10}(?!\d)/g;

// 公開用に本文を整える(URLの無害化より先に実行する)
export function sanitize(text: string): string {
  return text
    // 見えない文字(フィルタ回避用に挟まれているもの)を除去
    .replace(/[\u200B-\u200F\u2060-\u2064\uFEFF\u034F]/g, '')
    // HTMLタグ・CSSの記述・装飾記号の混入を除去
    .replace(/<[^>]+>/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(?:[#.@\w-][\w\s,.#:>*()-]*)?\{[^{}]*[:;][^{}]*\}/g, ' ')
    .replace(/(?:[#.@\w-][\w\s,.#:>*()-]*)?\{[^{}]*[:;][^{}]*\}/g, ' ')
    .replace(/@media[^{]*\{\s*\}/g, ' ')
    .replace(/\*\*/g, '')
    // URLのログインID・パスワードや、メールアドレスを符号化した値を伏せる
    .replace(/h(?:tt|xx)ps?:\/\/[!-~\p{L}\p{N}\p{S}]+/gu, maskUrlParams)
    // メールアドレスを伏せる(URLの一部は対象外)
    .replace(/(^|[^\/\w.-])[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '$1[メールアドレス]')
    // 見えない文字で分割されていたアドレスの前半も消す
    .replace(/[\w.+-]+ +\[メールアドレス\]/g, '[メールアドレス]')
    // 全角の数字・記号を半角にそろえる(全角で書かれた電話番号も伏せるため)
    .replace(/[０-９＋－]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    // 電話番号は丸ごと伏せる(括弧で囲まれていればそのまま「電話番号」、例:{818054699501} → {電話番号})
    .replace(PHONE, '[電話番号]')
    .replace(/([{(\[（【「])\[電話番号\]([})\]）】」])/g, '$1電話番号$2')
    .replace(/[ \t\u3000]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// シートの日時は日本時間。ビルドする環境(Cloudflare は UTC)のタイムゾーンに関係なく、日本時間として読む
const JST_OFFSET = 9 * 60 * 60 * 1000;

export function parseJst(text: string): Date {
  const m = text.match(/(\d{4})\D(\d{1,2})\D(\d{1,2})(?:\D+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return new Date(NaN);
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) - JST_OFFSET);
}

async function loadCsv(): Promise<string> {
  const url = import.meta.env.SHEET_CSV_URL;
  if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`シートの読み込みに失敗しました(${res.status})`);
    return await res.text();
  }
  return await fs.readFile('data/sample.csv', 'utf-8');
}

let cache: Case[] | null = null;

export async function getCases(): Promise<Case[]> {
  if (cache) return cache;
  const csv = await loadCsv();
  const { data } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  cache = data
    .filter((r) => (r[COL.body] ?? '').trim() !== '' && !EXCLUDED_METHODS.has(r[COL.method] ?? ''))
    .map((r) => ({
      date: parseJst(r[COL.date] ?? ''),
      media: r[COL.media] || 'SMS',
      spoof: r[COL.spoof] || 'その他',
      method: r[COL.method] || 'その他',
      body: defang(sanitize(r[COL.body])),
      url: r[COL.url] ? defang(maskUrlParams(r[COL.url])) : '',
      official: (r[COL.official] ?? '').trim(),
      count: Number(r[COL.count]) || 1,
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  return cache;
}

// なりすまし先×手口で1ページにまとめる
export async function getGroups(): Promise<CaseGroup[]> {
  const cases = await getCases();
  const map = new Map<string, CaseGroup>();
  for (const c of cases) {
    const slug = `${toSlug(SPOOF_SLUGS, c.spoof)}-${toSlug(METHOD_SLUGS, c.method)}`;
    let g = map.get(slug);
    if (!g) {
      g = { slug, spoof: c.spoof, method: c.method, media: c.media, cases: [], total: 0, latest: c.date, official: '' };
      map.set(slug, g);
    }
    g.cases.push(c);
    g.total += c.count;
    if (!g.official && c.official) g.official = c.official;
  }
  return [...map.values()].sort((a, b) => b.latest.getTime() - a.latest.getTime());
}

export function formatDate(d: Date): string {
  const jst = new Date(d.getTime() + JST_OFFSET);
  return `${jst.getUTCFullYear()}年${jst.getUTCMonth() + 1}月${jst.getUTCDate()}日`;
}

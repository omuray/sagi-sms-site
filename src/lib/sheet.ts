import Papa from 'papaparse';
import fs from 'node:fs/promises';
import { SPOOF_SLUGS, METHOD_SLUGS, EXCLUDED_METHODS, toSlug } from './slugs';
import { OFFICIAL_LINKS } from './officials';
import { checkLinks } from './link-check';

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
// メッセージアプリの友だち追加・招待リンク(line.me/ti/p/〇〇、t.me/〇〇 など)は、ドメインより後ろのアカウント部分を丸ごと伏せる
export function maskUrlParams(text: string): string {
  return text
    .replace(INVITE_URL, '$1***')
    .replace(/([?&;](?:id|uid|mid|user|userid|login|pass|pw|passwd|password|email|mail|token|key|code|dst)=)[^\s&#]+/gi, '$1***')
    .replace(/\?[A-Za-z0-9+\/_%-]{20,}={0,2}/g, '?***')
    .replace(/(?<!\d)(\d{4})(\d{8,})(?!\d)/g, (_, head, rest) => head + '*'.repeat(rest.length));
}

// 友だち追加・招待リンクのドメイン。後ろの英数字・記号の部分がアカウントを表す
// 例:line.me/ti/p/〇〇、lin.ee/〇〇、t.me/〇〇、wa.me/〇〇、chat.whatsapp.com/〇〇、discord.gg/〇〇、instagram.com/〇〇
const INVITE_DOMAINS = [
  'line.me', 'lin.ee', 't.me', 'telegram.me', 'telegram.org', 'wa.me', 'chat.whatsapp.com', 'discord.gg', 'discord.com',
  'm.me', 'instagram.com', 'x.com', 'twitter.com', 'tiktok.com', 'facebook.com', 'signal.me', 'qm.qq.com', 'u.wechat.com',
];
// 無害化済みの「[.]」にも合うようにする
const INVITE_URL = new RegExp(
  `^(h(?:tt|xx)ps?:\\/\\/(?:www\\[?\\.\\]?)?(?:${INVITE_DOMAINS.map((d) => d.replace(/\./g, '\\[?\\.\\]?')).join('|')})\\/)[!-~]+`,
  'i',
);

// メッセージアプリの名前に続くID(例:LINE:wl4281 → LINE:***、Telegram:@abc → Telegram:***)
// 「ライン」はホットラインなどと紛らわしいので対象にしない。LINE ID:〇〇 は下の ID の規則で伏せる
const APP_ID = /((?<![A-Za-z])(?:LINE|Line|Telegram|テレグラム|WhatsApp|Signal|WeChat|微信|Instagram|インスタ(?:グラム)?|Discord|KakaoTalk|Kakao|カカオトーク|Skype|Viber|TikTok|Facebook|Messenger|QQ|Zalo|Snapchat|Potato)\s*(?:アカウント)?\s*[=:：＝]\s*)@?[A-Za-z0-9][\w.-]*/g;

// 電話番号(区切りあり・なし、国際表記を含む)
// 3つ目は区切りなしの日本の国際表記(例:819012345678、+819012345678)
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
    // メッセージアプリのIDと、見出しのない @〇〇(Telegram や X のアカウント名)を伏せる。メールアドレスは上で伏せ済み
    .replace(APP_ID, '$1***')
    .replace(/(?<![\w.@\/\[])@[A-Za-z0-9_][\w.]{2,}/g, '@***')
    // IDを伏せる(例:ID=98893885 → ID=***、LINE ID:abc123 → LINE ID:***)
    .replace(/((?<![A-Za-z])(?:ID|Id|id|ＩＤ)\s*[=:：＝]\s*)[A-Za-z0-9][\w.@-]*/g, '$1***')
    // 英字の短い見出しに続く識別番号も伏せる(例:CL=37731562597282 → CL=***)
    .replace(/((?<![A-Za-z0-9])[A-Za-z]{1,4}\s*[=＝]\s*)\d{6,}/g, '$1***')
    // 「〇〇番号」に続く値も伏せる(お問い合わせ番号・受付番号・注文番号・請求書番号など。値が次の行にあるものも含む)
    .replace(/(番号\s*[=:：＝]\s*)[A-Za-z0-9][A-Za-z0-9-]{3,}/g, '$1***')
    // 電話番号は丸ごと伏せる(括弧で囲まれていればそのまま「電話番号」、例:{819012345678} → {電話番号})
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

let deadLinkCache: Promise<Set<string>> | null = null;

// リンク切れの公式注意喚起ページを調べる(ビルド1回につき1度だけ。結果はビルドのログに出す)
// 開発中(npm run dev)は調べない
function deadLinks(urls: string[]): Promise<Set<string>> {
  if (import.meta.env.DEV) return Promise.resolve(new Set());
  return (deadLinkCache ??= checkLinks(urls).then((results) => {
    const all = [...results.values()];
    const dead = all.filter((r) => r.status === 'dead');
    const unknown = all.filter((r) => r.status === 'unknown');
    console.log(`[link-check] 公式注意喚起のリンク:${all.length}件中、リンク切れ${dead.length}件、確認できず${unknown.length}件`);
    for (const r of dead) console.warn(`[link-check] リンク切れのため表示しません(${r.reason}): ${r.url}`);
    for (const r of unknown) console.log(`[link-check] 確認できないため表示を続けます(${r.reason}): ${r.url}`);
    return new Set(dead.map((r) => r.url));
  }));
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
  // 公式注意喚起は、シートの入力 → 対応表(officials.ts)の順で、リンク切れでないものを使う。どちらも切れていれば出さない
  const candidates = new Map([...map.values()].map((g) => [g, [g.official, OFFICIAL_LINKS[g.spoof] ?? ''].filter((u) => u !== '')]));
  const dead = await deadLinks([...candidates.values()].flat());
  for (const [g, urls] of candidates) g.official = urls.find((u) => !dead.has(u)) ?? '';
  return [...map.values()].sort((a, b) => b.latest.getTime() - a.latest.getTime());
}

export function formatDate(d: Date): string {
  const jst = new Date(d.getTime() + JST_OFFSET);
  return `${jst.getUTCFullYear()}年${jst.getUTCMonth() + 1}月${jst.getUTCDate()}日`;
}

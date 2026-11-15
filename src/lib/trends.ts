import type { Case, CaseGroup } from './sheet';
import { spoofCategory } from './slugs';

// 「データで見る傾向」(/trends/)の集計。ビルドのたびに、公開している事例から数え直す
// 件数は受信回数の合計(同じ文面が2回届けば2件)。事例ページの「確認した件数」と同じ数え方

const JST_OFFSET = 9 * 60 * 60 * 1000;
const monthKey = (d: Date) => {
  const j = new Date(d.getTime() + JST_OFFSET);
  return `${j.getUTCFullYear()}-${String(j.getUTCMonth() + 1).padStart(2, '0')}`;
};

export type Row = { label: string; n: number; href?: string };

function ranking(cases: Case[], key: (c: Case) => string, href?: (k: string) => string): Row[] {
  const m = new Map<string, number>();
  for (const c of cases) m.set(key(c), (m.get(key(c)) ?? 0) + c.count);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n, href: href?.(label) }));
}

// 無害化したURL(hxxps://example[.]com/...)からホスト名を取り出す
export function hostsOf(url: string): string[] {
  return [...new Set([...url.matchAll(/h(?:tt|xx)ps?:\/\/([^\/\s?#]+)/g)].map((m) => m[1].replace(/\[\.\]/g, '.').toLowerCase()))];
}

// リンク先の種類。上から順に当てはめる
const LINK_KINDS: { label: string; test: (h: string) => boolean; note: string }[] = [
  {
    label: 'Amazon S3(クラウドストレージ)',
    test: (h) => h.endsWith('.amazonaws.com'),
    note: 'Amazon のクラウドストレージに置いたページです。誰でも借りられるため、会社の公式サイトではありません。',
  },
  {
    label: '「.cn」で終わる、意味のない文字列のドメイン',
    test: (h) => h.endsWith('.cn'),
    note: '「gbbdbbe.cn」のような、読めない文字の並びのドメインです。使い捨てにするため次々に取り直されます。',
  },
  {
    label: 'メッセージアプリ(LINE など)',
    test: (h) => /(^|\.)(line\.me|lin\.ee|t\.me|wa\.me)$/.test(h),
    note: '偽サイトではなく、LINE などの友だち追加に誘導して、やりとりの中でお金をだまし取ります。',
  },
];

const PRESSURE = /期限|本日中|至急|緊急|以内|までに|お早めに/;
const THREAT = /停止|制限|無効|失効|ロック|凍結|解約/;

export function buildTrends(cases: Case[], groups: CaseGroup[]) {
  const total = cases.reduce((s, c) => s + c.count, 0);
  const first = cases.reduce((a, c) => (c.date < a ? c.date : a), cases[0].date);
  const last = cases[0].date;

  // 月ごと(直近12か月。事例のない月も0件で出す)
  const byMonthMap = new Map<string, number>();
  for (const c of cases) byMonthMap.set(monthKey(c.date), (byMonthMap.get(monthKey(c.date)) ?? 0) + c.count);
  const months: Row[] = [];
  const end = new Date(last.getTime() + JST_OFFSET);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    const k = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (d.getTime() + 31 * 86400000 < first.getTime() + JST_OFFSET) continue; // 最初の事例より前の月は出さない
    months.push({ label: `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月`, n: byMonthMap.get(k) ?? 0 });
  }

  const media = ranking(cases, (c) => c.media);
  const methods = ranking(cases, (c) => c.method);
  const spoofs = ranking(cases, (c) => c.spoof).map((r) => ({ ...r, label: spoofCategory(r.label), href: `/cases/#${encodeURIComponent(r.label)}` }));

  // リンク先:URL欄に入力がある事例(文面の数)で数える
  const withUrl = cases.filter((c) => hostsOf(c.url).length > 0);
  const links = LINK_KINDS.map((k) => ({ label: k.label, note: k.note, n: withUrl.filter((c) => hostsOf(c.url).some(k.test)).length }));
  const otherLinks = withUrl.filter((c) => !hostsOf(c.url).some((h) => LINK_KINDS.some((k) => k.test(h)))).length;

  // 急がせる・脅す言葉(文面の数で数える)
  const n = cases.length;
  const pressure = cases.filter((c) => PRESSURE.test(c.body)).length;
  const threat = cases.filter((c) => THREAT.test(c.body)).length;
  const both = cases.filter((c) => PRESSURE.test(c.body) && THREAT.test(c.body)).length;

  // 直近30日に初めて届いた手口(なりすまし先×手口のページ)
  const since = last.getTime() - 30 * 86400000;
  const firstDate = (g: CaseGroup) => Math.min(...g.cases.map((c) => c.date.getTime()));
  const fresh = groups.filter((g) => firstDate(g) >= since).sort((a, b) => firstDate(b) - firstDate(a));

  return { total, variants: n, first, last, months, media, methods, spoofs, withUrl: withUrl.length, links, otherLinks, pressure, threat, both, fresh };
}

export const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

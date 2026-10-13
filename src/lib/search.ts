// サイト内検索の照合(ブラウザで動かす。索引は src/pages/search-index.json.ts が出力)

export type SearchEntry = {
  slug: string;
  spoof: string;
  method: string;
  media: string;
  total: number;
  bodies: string[];
};

// exact: 同じ文面を含む / meta: なりすまし先・手口の名前に一致 / words: 入力した語をすべて含む / similar: 似た文面
export type MatchKind = 'exact' | 'meta' | 'words' | 'similar';

export type SearchHit = {
  entry: SearchEntry;
  kind: MatchKind;
  score: number;
  // 一致した文面(meta のときは最新の文面)
  body: string;
};

// これより短い入力は検索しない
export const MIN_QUERY = 2;
// 似た文面とみなす下限(入力の3文字の並びのうち、掲載文面にも現れる割合)
// 短い入力は決まり文句だけで多くの文面に当たるので、厳しくする
const SIMILAR_MIN = 0.5;
const SIMILAR_MIN_SHORT = 0.75;
const SHORT_QUERY = 40;
// 似た文面の判定に必要な入力の長さ
const SIMILAR_MIN_LENGTH = 10;

// 照合用に文字をそろえる
// URL・伏せ字は掲載時に書き換えているので、届いた原文と食い違わないよう両方から取り除く
export function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/h(?:tt|xx)ps?:\/\/\S+/g, '')
    .replace(/\[(?:電話番号|メールアドレス)\]/g, '')
    .replace(/[\s​-‏⁠-⁤﻿͏]+/g, '');
}

function trigrams(text: string): Set<string> {
  const chars = [...text];
  const out = new Set<string>();
  for (let i = 0; i < chars.length - 2; i++) out.add(chars[i] + chars[i + 1] + chars[i + 2]);
  return out;
}

type Prepared = {
  entry: SearchEntry;
  meta: string;
  bodies: { raw: string; text: string; grams: Set<string> }[];
};

export function prepare(entries: SearchEntry[]): Prepared[] {
  return entries.map((entry) => ({
    entry,
    meta: normalize(`${entry.spoof} ${entry.method} ${entry.media}`),
    bodies: entry.bodies.map((raw) => {
      const text = normalize(raw);
      return { raw, text, grams: trigrams(text) };
    }),
  }));
}

// 索引の並び(新しい順)を保ったまま、一致の強い順に返す
export function search(index: Prepared[], query: string): SearchHit[] {
  const q = normalize(query);
  const length = [...q].length;
  if (length < MIN_QUERY) return [];
  const words = query.split(/\s+/).map(normalize).filter((w) => w !== '');
  const qGrams = trigrams(q);
  const similarMin = length < SHORT_QUERY ? SIMILAR_MIN_SHORT : SIMILAR_MIN;
  const hits: SearchHit[] = [];

  for (const p of index) {
    const exact = p.bodies.find((b) => b.text.includes(q));
    if (exact) {
      hits.push({ entry: p.entry, kind: 'exact', score: 1, body: exact.raw });
      continue;
    }
    if (p.meta.includes(q)) {
      hits.push({ entry: p.entry, kind: 'meta', score: 0.95, body: p.entry.bodies[0] ?? '' });
      continue;
    }
    if (words.length > 1) {
      const body = p.bodies.find((b) => words.every((w) => b.text.includes(w) || p.meta.includes(w)));
      if (body) {
        hits.push({ entry: p.entry, kind: 'words', score: 0.9, body: body.raw });
        continue;
      }
    }
    if (length < SIMILAR_MIN_LENGTH) continue;
    let best = 0;
    let bestRaw = '';
    for (const b of p.bodies) {
      let shared = 0;
      for (const g of qGrams) if (b.grams.has(g)) shared++;
      // 入力が掲載文面より長い場合(前後の文も貼った場合)にも拾えるよう、短いほうを基準にする
      const rate = shared / Math.min(qGrams.size, b.grams.size || 1);
      if (rate > best) {
        best = rate;
        bestRaw = b.raw;
      }
    }
    if (best >= similarMin) hits.push({ entry: p.entry, kind: 'similar', score: best * 0.8, body: bestRaw });
  }

  return hits.sort((a, b) => b.score - a.score);
}

// 結果に出す抜粋。入力がそのまま含まれていればその前後を、なければ書き出しを返す
export function snippet(body: string, query: string, length = 70): { before: string; match: string; after: string } {
  const text = body.replace(/\s+/g, ' ').trim();
  const needle = query.replace(/\s+/g, ' ').trim();
  const at = needle === '' ? -1 : text.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0 || needle.length >= length) {
    const chars = [...text];
    return { before: chars.length > length ? `${chars.slice(0, length).join('')}…` : text, match: '', after: '' };
  }
  const room = Math.floor((length - needle.length) / 2);
  const start = Math.max(0, at - room);
  const end = Math.min(text.length, at + needle.length + room);
  return {
    before: (start > 0 ? '…' : '') + text.slice(start, at),
    match: text.slice(at, at + needle.length),
    after: text.slice(at + needle.length, end) + (end < text.length ? '…' : ''),
  };
}

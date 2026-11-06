import fs from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getGroups, type CaseGroup } from '../../../lib/sheet';
import { caseTitleParts } from '../../../lib/slugs';

// 事例ページごとのOGP画像(1200×630)。/og/cases/〇〇.png に出力し、事例ページの og:image と構造化データの image で使う
// デザインはサイト共通の public/og.png(scripts/make-og-image.py)に合わせる
// フォントは fonts/ の Noto Serif JP / Noto Sans JP(太字・JIS第1・第2水準のみ。作り方は scripts/make-og-fonts.py)

export async function getStaticPaths() {
  const groups = await getGroups();
  return groups.map((g) => ({ params: { slug: g.slug }, props: { group: g } }));
}

const W = 1200, H = 630;
const PAPER = '#F4F1EA', INK = '#1C1F24', BODY = '#3C4148', ALERT = '#B4471F';
const LEFT = 96;

const fontDir = path.resolve(process.cwd(), 'fonts');
const fonts = [
  { name: 'Serif', data: fs.readFileSync(path.join(fontDir, 'NotoSerifJP-Bold.ttf')), weight: 700 as const, style: 'normal' as const },
  { name: 'Sans', data: fs.readFileSync(path.join(fontDir, 'NotoSansJP-Bold.ttf')), weight: 700 as const, style: 'normal' as const },
];
// フォントに入っている文字。ない文字はビルド時に警告する(scripts/make-og-fonts.py で足せる)
const covered = new Set(fs.readFileSync(path.join(fontDir, 'og-chars.txt'), 'utf-8'));

// サイトのロゴと同じ盾の形(src/layouts/Base.astro のヘッダーのSVG)
const shield = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>`,
)}`;

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

// 文字の幅のおおよその合計(全角を1、半角を0.6として数える)。見出しの文字の大きさを決めるのに使う
const units = (s: string) => [...s].reduce((n, c) => n + (/[\x20-\x7E]/.test(c) ? 0.6 : 1), 0);

export const GET: APIRoute = async ({ props }) => {
  const group = (props as { group: CaseGroup }).group;
  const { spoof, method, methodShort, tail } = caseTitleParts(group);
  // 見出しは「なりすまし先」と「手口」の2行(なりすまし先がないページは手口だけ)
  const lines = [spoof, method || methodShort].filter(Boolean);
  const missing = [...new Set([...lines.join('') + tail].filter((c) => !/\s/.test(c) && !covered.has(c)))];
  if (missing.length) console.warn(`[og-image] ${group.slug}: フォントにない文字があります(画像では表示されません): ${missing.join(' ')}`);

  const size = Math.min(96, Math.floor((W - LEFT - 72) / Math.max(...lines.map(units))));
  const tree = el('div', { width: W, height: H, display: 'flex', flexDirection: 'column', backgroundColor: PAPER, position: 'relative' }, [
    // 左の縦帯
    el('div', { position: 'absolute', left: 0, top: 0, width: 18, height: H, backgroundColor: ALERT }),
    // ロゴとサイト名
    el('div', { display: 'flex', alignItems: 'center', marginTop: 64, marginLeft: LEFT - 6 }, [
      el('img', { width: 72, height: 72 }, undefined, { src: shield, width: 72, height: 72 }),
      el('div', { fontFamily: 'Serif', fontSize: 40, color: INK, marginLeft: 18 }, '詐欺SMS実録ノート'),
    ]),
    // 見出し(なりすまし先・手口)と、その下の「詐欺〇〇の文面と見分け方」
    el('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, marginLeft: LEFT, marginBottom: 120 }, [
      // 行頭の「は字形の左半分が空白なので、半文字分左に出して上の行と頭をそろえる
      ...lines.map((l, i) => el('div', { fontFamily: 'Serif', fontSize: size, lineHeight: 1.2, color: i === lines.length - 1 ? ALERT : INK, marginLeft: l.startsWith('「') ? -size / 2 : 0 }, l)),
      el('div', { fontFamily: 'Sans', fontSize: 40, color: BODY, marginTop: 20 }, tail),
    ]),
    // 下の帯
    el('div', { position: 'absolute', left: 18, bottom: 0, width: W - 18, height: 120, backgroundColor: INK, display: 'flex', alignItems: 'center', paddingLeft: LEFT - 18 }, [
      el('div', { fontFamily: 'Sans', fontSize: 36, color: PAPER }, 'メッセージのURLは開かない。公式アプリで確かめる。'),
    ]),
  ]);

  const svg = await satori(tree as Parameters<typeof satori>[0], { width: W, height: H, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};

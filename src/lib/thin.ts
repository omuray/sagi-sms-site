import type { CaseGroup } from './sheet';

// AdSense の「有用性の低いコンテンツ」への対応(2026-11-24)

// 事例ページで本文を全文で載せる件数(新しい順)。これより前の文面は受信日と1行目だけの一覧にする
export const FULL_TEXT_CASES = 5;

// 事例が1件だけのページは検索結果に出さない(noindex にして sitemap からも外す)
// 2件目が届けば、次のビルドで自動的に検索に戻る
// ただし、検索から実際に訪問があるページ(直近28日に1クリック以上)は例外として検索に残す(KEEP_INDEXED)
// 数字は 2026-10-26〜11-22 の28日間(クリック/表示)
export const KEEP_INDEXED = new Set([
  'takarakuji-prize', // 8 / 561
  'u-next-payment', // 6 / 245
  'eplus-payment', // 6 / 84
  'rakuten-card-verify', // 5 / 148
  'amex-upgrade', // 2 / 31
  'eplus-prize', // 1 / 178
  'rakuten-card-upgrade', // 1 / 104
  'nhk-payment', // 1 / 89
  'jre-point-points', // 1 / 59
  'v-point-points', // 2026-11-25 追加:11/17〜23の7日間で3クリック・102回表示。送信元アドレス「ptmag@mc.tsite.jp」で検索されている
]);

export function isThinGroup(group: CaseGroup): boolean {
  return group.total <= 1 && !KEEP_INDEXED.has(group.slug);
}

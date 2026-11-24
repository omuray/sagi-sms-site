import type { CaseGroup } from './sheet';

// AdSense の「有用性の低いコンテンツ」への対応(2026-11-24)

// 事例ページで本文を全文で載せる件数(新しい順)。これより前の文面は受信日と1行目だけの一覧にする
export const FULL_TEXT_CASES = 5;

// 事例が1件だけのページは検索結果に出さない(noindex にして sitemap からも外す)
// 2件目が届けば、次のビルドで自動的に検索に戻る
// ただし、検索から実際に訪問があるページは例外として検索に残す(KEEP_INDEXED)
// rakuten-card-verify:直近28日で5クリック・138回表示(2026-11-19時点)
// u-next-payment:2026-11-13〜19の7日間で4クリック・142回表示
export const KEEP_INDEXED = new Set(['rakuten-card-verify', 'u-next-payment']);

export function isThinGroup(group: CaseGroup): boolean {
  return group.total <= 1 && !KEEP_INDEXED.has(group.slug);
}

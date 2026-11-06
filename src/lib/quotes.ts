import type { CaseGroup } from './sheet';

// 事例ページの導入文と説明文(検索結果に出る文)で引用する文面の選び方
// ふだんは最新の事例の1行目(メールなら件名)。QUOTE_PICKS に書いたページだけ、指定した事例の1行目にする

// slug → そのページの事例の1行目に含まれる文字列(空白は無視して探す)
// 含む事例のうち一番新しいものの1行目を引用する。ここに書いた文字列そのものは使わないので、引用は必ず実際に届いた文面になる
// 選び方:Search Console で、そのページが表示されている検索語に近い件名を選ぶ
// 見つからない(その事例が非公開になった など)ときは、ビルドのログに [quote] の警告を出し、最新の事例の1行目に戻す
export const QUOTE_PICKS: Record<string, string> = {
  // 「プライム会費」を含む検索が多い。今の最新の件名(Prime会費決済未完了のお知らせ)には Amazon の名前もない
  'amazon-payment': 'Amazonプライム会費の決済手続きに未完了の項目があります',
  // 「お支払い方法」の更新を求める件名で検索されている。最新の件名(iCloud+ お支払い…)とは言い回しが違う
  'apple-payment': 'ご登録お支払い方法の有効期限が切れたご連絡',
};

// 引用に使う行:伏せ字([メールアドレス]、CL=*** など)と、< > だけの行(<楽天サポート> などの見出し)は除き、1行目が短いときは2行目もつなげる
export function headLine(body: string): string {
  const lines = body
    .replace(/\[[^\]\n]*\]|[A-Za-z]+\s*[=:]\s*\*{3}/g, '')
    .split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l && !/^<[^<>]*>$/.test(l));
  // 私用領域の文字(Apple のロゴ U+F8FF など)は多くの端末で空白や□になるので外す
  return ([...(lines[0] ?? '')].length < 12 ? lines.slice(0, 2).join(' ') : lines[0])
    .replace(/[-]/g, '').replace(/\s+/g, ' ').trim();
}

const squash = (s: string) => s.replace(/\s+/g, '');

// そのページで引用する行(cases は新しい順に並んでいる)
export function quoteHead(group: CaseGroup): string {
  const latest = headLine(group.cases[0].body);
  const pick = QUOTE_PICKS[group.slug];
  if (!pick) return latest;
  const hit = group.cases.map((c) => headLine(c.body)).find((h) => squash(h).includes(squash(pick)));
  if (!hit) console.warn(`[quote] ${group.slug}: 「${pick}」を1行目に含む事例が見つからないため、最新の事例の1行目を引用します(src/lib/quotes.ts)`);
  return hit ?? latest;
}

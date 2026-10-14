// 事例ページの「関連する事例」を、全ページ分まとめて選ぶ
// 似た事例(同じなりすまし先 → 同じ手口)を3件まで選び、残りの2件は、それまでに選ばれた回数が少ない事例から選ぶ
// 似た事例だけで埋めると、なりすまし先も手口もほかと重ならない事例(有名人なりすまし など)がほとんどリンクされないため
// どちらも、新しい順の並びでそのページの次から数える(一巡したら先頭に戻る)。新しいページにリンクが偏らないようにするため
import { getGroups, type CaseGroup } from './sheet';

const COUNT = 5;
const SIMILAR = 3;

let cache: Promise<Map<string, CaseGroup[]>> | null = null;

// slug → そのページに出す関連する事例
export function getRelated(): Promise<Map<string, CaseGroup[]>> {
  return (cache ??= build());
}

async function build() {
  const all = await getGroups();
  const picked = new Map(all.map((g) => [g.slug, 0]));
  const result = new Map<string, CaseGroup[]>();
  all.forEach((g, at) => {
    const others = [...all.slice(at + 1), ...all.slice(0, at)];
    const similar = [
      ...others.filter((o) => o.spoof === g.spoof),
      ...others.filter((o) => o.spoof !== g.spoof && o.method === g.method),
    ].slice(0, SIMILAR);
    // sort は安定なので、選ばれた回数が同じならページの次に近い順のまま
    const rest = others
      .filter((o) => !similar.includes(o))
      .sort((a, b) => picked.get(a.slug)! - picked.get(b.slug)!);
    const related = [...similar, ...rest].slice(0, COUNT);
    for (const o of related) picked.set(o.slug, picked.get(o.slug)! + 1);
    result.set(g.slug, related);
  });
  return result;
}

// Google AdSense のパブリッシャーID。環境変数 PUBLIC_ADSENSE_CLIENT に「ca-pub-」で始まるIDを入れる
// 未設定(または形が違う)のときは null になり、広告のタグも ads.txt も出さない
const raw = (import.meta.env.PUBLIC_ADSENSE_CLIENT ?? '').trim();
export const adsenseClient: string | null = /^ca-pub-\d{10,20}$/.test(raw) ? raw : null;
if (raw && !adsenseClient) console.warn(`[adsense] PUBLIC_ADSENSE_CLIENT の形が違うため無視しました(ca-pub-数字 の形で入れてください): ${raw}`);

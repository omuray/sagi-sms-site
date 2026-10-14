// スプレッドシートのプルダウンの選択肢 → URL用の英字名
// 選択肢を増やしたら、ここにも1行追加する(未登録のものは "other" になる)
export const SPOOF_SLUGS: Record<string, string> = {
  // 通販・IT
  'Amazon': 'amazon',
  'Apple': 'apple',
  'Nintendo': 'nintendo',
  '楽天': 'rakuten',
  'WhatsApp': 'whatsapp',
  // クレジットカード
  'Visa': 'visa',
  'Mastercard': 'mastercard',
  'JCB': 'jcb',
  'セゾンカード': 'saison',
  '楽天カード': 'rakuten-card',
  'オリコカード': 'orico',
  'イオンカード': 'aeon-card',
  'エポスカード': 'epos',
  'PayPayカード': 'paypay-card',
  'アメリカン・エキスプレス': 'amex',
  // 銀行・証券・保険
  '三井住友銀行': 'smbc',
  '海外の銀行(BNI)': 'bni',
  '楽天証券': 'rakuten-sec',
  '野村證券': 'nomura',
  '第一生命保険': 'dai-ichi-life',
  // ポイント・マイル・交通
  'ANA': 'ana',
  'JAL': 'jal',
  'JRE POINT': 'jre-point',
  'Vポイント': 'v-point',
  'えきねっと(JR東日本)': 'ekinet',
  'ETC利用照会サービス': 'etc',
  // 公共料金・行政
  '東京ガス': 'tokyo-gas',
  '東京電力': 'tepco',
  '国税庁': 'nta',
  '自治体(国民健康保険)': 'health-insurance',
  // 配送
  '佐川急便': 'sagawa',
  'ヤマト運輸': 'yamato',
  '日本郵便': 'japanpost',
  // その他
  '宝くじ公式サイト': 'takarakuji',
  '有名人(芸能人)': 'celebrity',
  '求人・副業(企業名かたり)': 'job',
  '不明(有料サイト)': 'paid-site',
  '不明(サービス名なし)': 'unknown',
  'その他': 'other',
};

export const METHOD_SLUGS: Record<string, string> = {
  '料金未払い・支払い情報の更新': 'payment',
  '本人確認・情報更新': 'verify',
  '不正利用の検知': 'fraud-alert',
  'アカウント停止・利用制限': 'account-lock',
  'ポイント・マイルの失効・未加算': 'points',
  '不在通知・配達確認': 'delivery',
  '限度額引き上げ・カード優待': 'upgrade',
  '税金・保険料の未納': 'tax',
  '投資LINE勧誘': 'invest-line',
  '副業・在宅ワーク勧誘': 'side-job',
  '有名人なりすまし': 'impersonation',
  '当選・プレゼント': 'prize',
  '架空請求': 'fake-bill',
  'その他': 'other',
};

// ページのタイトル・説明文で使う、なりすまし先の表示名。未登録のものは選択肢の名前をそのまま使う
// 空文字のものは、タイトルなどで「〇〇を装った」を書かない
export const SPOOF_DISPLAY: Record<string, string> = {
  '不明(有料サイト)': '有料サイト',
  '不明(サービス名なし)': '',
  'その他': '',
  '有名人(芸能人)': '有名人',
  '求人・副業(企業名かたり)': '求人・副業',
  '自治体(国民健康保険)': '国民健康保険',
};

// ページのタイトル用の短い呼び名(検索されやすい言い方)。未登録の手口は選択肢の名前をそのまま使う
export const METHOD_SHORT: Record<string, string> = {
  '料金未払い・支払い情報の更新': '支払い情報の更新',
  '本人確認・情報更新': '本人確認',
  'ポイント・マイルの失効・未加算': 'ポイント失効',
  'アカウント停止・利用制限': 'アカウント停止',
  '不在通知・配達確認': '不在通知',
  '限度額引き上げ・カード優待': '限度額引き上げ',
  '税金・保険料の未納': '税金の未納',
  '副業・在宅ワーク勧誘': '副業勧誘',
  '当選・プレゼント': '当選',
};

// ページごとのタイトルの上書き(キーは事例ページの slug)。上の2つの呼び名が内容と合わないページだけ書く
// spoof はタイトルの先頭に置く言葉、method は手口の短い呼び名(パンくずにも使う)
export const TITLE_OVERRIDES: Record<string, { spoof?: string; method?: string }> = {
  'dai-ichi-life-tax': { method: '保険料の未納' },
  'health-insurance-tax': { method: '保険料の未納' },
  'job-side-job': { spoof: '企業名をかたる' },
};

// 「〇〇を装った」の言い方。事例ページの導入文・説明文と、一覧やリンクの呼び名で使う
// 表示名がないもの(サービス名なし など)、手口の名前に含まれるもの(有名人なりすまし)は空文字
export function spoofPhrase(g: { slug: string; spoof: string; method: string }): string {
  const name = SPOOF_DISPLAY[g.spoof] ?? g.spoof;
  return TITLE_OVERRIDES[g.slug]?.spoof ?? (name && !g.method.includes(name) ? `${name}を装った` : '');
}

// 一覧やリンクで使う事例の呼び名。例:Amazonを装った「料金未払い・支払い情報の更新」、企業名をかたる「副業・在宅ワーク勧誘」
export function caseLabel(g: { slug: string; spoof: string; method: string }): string {
  return `${spoofPhrase(g)}「${g.method}」`;
}

// 事例ページを作らない手口(正規の通知など)
export const EXCLUDED_METHODS = new Set(['正規の通知']);

export function toSlug(map: Record<string, string>, label: string): string {
  return map[label] ?? 'other';
}

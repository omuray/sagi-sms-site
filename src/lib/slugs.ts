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

// 事例ページを作らない手口(正規の通知など)
export const EXCLUDED_METHODS = new Set(['正規の通知']);

export function toSlug(map: Record<string, string>, label: string): string {
  return map[label] ?? 'other';
}

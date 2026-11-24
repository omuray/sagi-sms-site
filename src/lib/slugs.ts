// スプレッドシートのプルダウンの選択肢 → URL用の英字名
// 選択肢を増やしたら、ここにも1行追加する(未登録のものは "other" になり、ほかの未登録のものと同じページにまとめられる。ビルドのログに警告が出る)
export const SPOOF_SLUGS: Record<string, string> = {
  // 通販・IT
  'Amazon': 'amazon',
  'Apple': 'apple',
  'Nintendo': 'nintendo',
  '楽天': 'rakuten',
  'WhatsApp': 'whatsapp',
  'Mercari': 'mercari',
  'ヨドバシカメラ': 'yodobashi',
  // 動画配信・チケット
  'Netflix': 'netflix',
  'U-NEXT': 'u-next',
  'イープラス': 'eplus',
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
  'UCSカード': 'ucs-card',
  'タカシマヤカード': 'takashimaya-card',
  '三井住友カード': 'smbc-card',
  // 後払い・プリペイド
  'Paidy': 'paidy',
  'バンドルカード': 'vandle-card',
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
  'NHK': 'nhk',
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
  '不明(クレジットカード)': 'unknown-card',
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
  '無料トライアル': 'free-trial',
  '与信承認': 'credit-auth',
  'その他': 'other',
};

// ページのタイトル・説明文で使う、なりすまし先の表示名。未登録のものは選択肢の名前をそのまま使う
// 空文字のものは、タイトルなどで「〇〇を装った」を書かない
export const SPOOF_DISPLAY: Record<string, string> = {
  '不明(有料サイト)': '有料サイト',
  '不明(クレジットカード)': 'クレジットカード会社',
  '不明(サービス名なし)': '',
  'その他': '',
  '有名人(芸能人)': '有名人',
  '求人・副業(企業名かたり)': '求人・副業',
  '自治体(国民健康保険)': '国民健康保険',
  'Mercari': 'メルカリ',
  // 詐欺メールはどれも「Visaカード」を名乗っている(Visa は国際ブランドで、カードを発行するのはカード会社)
  'Visa': 'Visaカード',
};

// 分類としてのなりすまし先の表示名(事例一覧の見出し、パンくず、タグ、なりすまし先から探す など)。未登録のものは選択肢の名前をそのまま使う
// 事例一覧の見出しの id(/cases/#〇〇 のリンク先)は選択肢の名前のままにする
export const SPOOF_CATEGORY: Record<string, string> = {
  '不明(有料サイト)': '有料サイト',
  '不明(クレジットカード)': 'クレジットカード(会社名なし)',
  '不明(サービス名なし)': 'サービス名なし',
  '有名人(芸能人)': '有名人',
  '求人・副業(企業名かたり)': '求人・副業',
  '自治体(国民健康保険)': '国民健康保険',
  'Mercari': 'メルカリ',
};

export function spoofCategory(spoof: string): string {
  return SPOOF_CATEGORY[spoof] ?? spoof;
}

// 事例ページのタイトルの部品。ページ(src/pages/cases/[slug].astro)とOGP画像(src/pages/og/cases/[slug].png.ts)で同じものを使う
// 例:Amazon「支払い情報の更新」詐欺メールの文面と見分け方 → spoof: Amazon / method: 「支払い情報の更新」 / tail: 詐欺メールの文面と見分け方
// なりすまし先は表示名を使い、手口の名前に含まれる場合(有名人「有名人なりすまし」など)は省く
// 呼び名が内容と合わないページは TITLE_OVERRIDES で上書きする
export function caseTitleParts(g: { slug: string; spoof: string; method: string; media: string }) {
  const override = TITLE_OVERRIDES[g.slug] ?? {};
  const methodShort = override.method ?? METHOD_SHORT[g.method] ?? g.method;
  const method = g.method === 'その他' ? '' : `「${methodShort}」`;
  const spoofName = SPOOF_DISPLAY[g.spoof] ?? g.spoof;
  const spoofLabel = spoofName && !g.method.includes(spoofName) ? spoofName : '';
  const spoof = override.spoof ?? spoofLabel;
  const tail = g.media === '電話' ? '詐欺電話の内容と見分け方' : `詐欺${g.media}の文面と見分け方`;
  return { spoof, method, methodShort, tail, title: `${spoof}${method}${tail}` };
}

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
  // 「与信承認」だけでは何の知らせかわからない。文面は与信承認のエラーを理由にカードの再登録を求めるもの
  '与信承認': '与信承認エラー',
};

// ページごとのタイトルの上書き(キーは事例ページの slug)。上の2つの呼び名が内容と合わないページや、検索される言葉と合わないページだけ書く
// spoof はタイトルの先頭に置く言葉、method は手口の短い呼び名(パンくずと説明文にも使う)
export const TITLE_OVERRIDES: Record<string, { spoof?: string; method?: string }> = {
  'dai-ichi-life-tax': { method: '保険料の未納' },
  'health-insurance-tax': { method: '保険料の未納' },
  'job-side-job': { spoof: '企業名をかたる' },
  // 文面のほとんどがプライム会費の未払いで、「プライム会費」「Prime月額料金」で検索されている
  'amazon-payment': { method: 'プライム会費の未払い' },
  // 「東京ガス お支払いが確認できません」「ご入金が確認できません」での検索が最も多い(2026-11)。「ガス料金」も残す
  'tokyo-gas-payment': { method: 'ガス料金のお支払いが確認できません' },
  // 「amazon 不在メール」「不在通知 詐欺」「再配達」で検索されている。2026年10月からは不在・再配達の文面が中心
  'amazon-delivery': { method: '不在・再配達のお知らせ' },
  // 文面のほとんどが「住所に不備があり荷物をお預かりしている」もので、「お荷物をお預かりしております」「荷物 預かり メール」で検索されている
  'yamato-delivery': { method: 'お荷物のお預かり・住所確認' },
  // 文面は「宛先住所の不備で配達を一時停止している」もので、「荷物お届け先住所誤りのお知らせ」で検索されている
  'japanpost-delivery': { method: 'お届け先住所の不備・配達停止' },
  // 文面は「〇月分のお支払い(ご入金)が確認できない」もので、「ご入金確認が取れておりません」で検索されている
  'rakuten-card-payment': { method: 'ご入金・お支払いが確認できません' },
  // 件名のほとんどが「Visaカード登録情報の確認をお願いいたします」の言い換えで、どれも「Visaカード」を名乗っている
  'visa-verify': { method: '登録情報の確認' },
  // 件名はどれも「カード利用内容(状況)の確認」で、身に覚えのない利用を見せて確認させるもの
  'jcb-fraud-alert': { method: 'カード利用内容の確認' },
  // 件名は「ご利用確認のお願い」「ご利用内容確認のお願い」が多く、「セゾンカード ご利用確認のお願い」「不正利用」で検索されている
  'saison-fraud-alert': { method: 'ご利用確認のお願い・不正利用の検知' },
  // 件名はどちらも「ご利用制限に関するお知らせ」
  'saison-account-lock': { method: 'ご利用制限のお知らせ' },
  // 文面の多くが「iCloud+ の月額更新を完了できませんでした」「お支払い方法の確認のお願い」
  'apple-payment': { method: 'iCloud+の更新・お支払い方法の確認' },
  // 件名はどれも「楽天ポイント未付与分・未反映分の確認」で、失効ではない
  'rakuten-points': { method: 'ポイント未付与・未反映' },
  // 件名は「ログイン検出およびカード利用に関する重要なお知らせ」
  'rakuten-fraud-alert': { method: 'ログイン検出・カード利用の確認' },
  // 楽天市場のショップを装い、「お届け先住所の不備のため営業所で保管中」と知らせるもの
  'rakuten-delivery': { method: 'お届け先住所の不備・営業所保管' },
  // 件名は「Mastercardセキュリティ認証手続きについてのご案内です」
  'mastercard-verify': { method: 'セキュリティ認証の手続き' },
  // 件名は「未加算マイルのご確認」「マイル有効期限のお知らせ」「マイル加算手続きのご案内」で、ポイントではなくマイル
  'ana-points': { method: 'マイル未加算・有効期限' },
  // 件名は「ANAマイレージクラブご利用制限のお知らせ」
  'ana-account-lock': { method: 'マイレージクラブのご利用制限' },
  // 件名が「ご利用カードの不正取引を検知しました」
  'epos-fraud-alert': { method: '不正取引の検知' },
  // 件名は「eオリコカードご利用のお知らせと確認依頼」「ご利用の取引確認とご案内のお知らせ」
  'orico-fraud-alert': { method: 'ご利用のお知らせと確認依頼' },
  // 件名は「【〇月】請求金額 〇〇円のお支払いをお願いします」、本文は「請求予定金額のお知らせ」
  'paypay-card-payment': { method: '請求金額のお支払い' },
  // 件名は「近々有効期限を迎えるポイント情報」「近日中に失効予定のポイントについて」。「ポイント失効 メール」で検索されている
  'amex-points': { method: 'ポイント失効・有効期限' },
  // 件名は「ご利用可能枠増額のご案内」
  'amex-upgrade': { method: 'ご利用可能枠の増額' },
  // 文面は「宝くじを無料で進呈」。「当選通知」「高額当選 メール」でも検索されている
  'takarakuji-prize': { method: '当選・無料プレゼント' },
  // 「アカウントが停止されました apple」「appleidは停止されました」で検索されている
  'apple-account-lock': { method: 'Apple ID・アカウントの停止' },
  // 「メンバーシップ料金(を決済できませんでした)」と「お支払い情報(方法)を更新してください」の両方で検索されている
  // 2026-11-24:件名そのままの「メンバーシップ料金を決済できませんでした」が言い換えを含め7日で約64回表示・10位前後・0クリックだったので、件名どおりの言い回しにした
  'netflix-payment': { method: 'メンバーシップ料金を決済できませんでした・支払い方法の更新' },
  // 手口は「限度額引き上げ・カード優待」だが、文面は限度額の引き下げや見直しで、「引き上げ」と合わない
  // (amex-upgrade は増額、saison-upgrade は引き上げとアップグレードの文面なので上書きしない)
  // イオンカードの文面はどれも引き下げで、「イオンカード限度額引き下げメール」で検索されている
  // 「【イオンカード】ご利用限度額減額のお知らせ」という件名でも検索されているので「減額」も入れる
  'aeon-card-upgrade': { method: '利用限度額の引き下げ・減額' },
  // 件名が「ご利用限度額引き下げのお知らせ」
  'epos-upgrade': { method: '利用限度額の引き下げ' },
  // 件名が「ご利用可能枠の改定(減額)」で、「jcb ご利用可能額 メール」で検索されている
  'jcb-upgrade': { method: 'ご利用可能枠の改定(減額)' },
  // 件名が「【重要】楽天カード ご利用可能枠の引き下げに関するお知らせ」
  'rakuten-card-upgrade': { method: 'ご利用可能枠の引き下げ' },
  // 「楽天カード ご本人様確認 メール」「楽天カード 本人確認アプリ メール」で検索されている。届いた件名は「お客様情報のご確認のお願い」
  'rakuten-card-verify': { method: 'ご本人様確認・お客様情報の確認' },
  // 件名は「未充当ポイントのご案内」
  'ucs-card-points': { method: '未充当ポイント・ポイント失効' },
  // 件名が「三井Vポイントの有効期限間近のお知らせ」で、「vポイントの有効期限 間近 です」で検索されている
  'v-point-points': { method: 'ポイント有効期限間近・失効' },
  // 件名が「JRE POINTの有効期限間近に関するご案内」で、「保有中の jre point 失効に関する重要なお知らせ」で検索されている
  'jre-point-points': { method: 'ポイント有効期限間近・失効' },
  // 「えきねっと ご本人確認のお願い」「ご本人確認のお願い(アカウント一時ロック)」で検索されている
  'ekinet-verify': { method: 'ご本人確認のお願い・アカウントロック' },
  // 件名は「JALマイル有効期限に関するご案内」で、ポイントではなくマイル
  'jal-points': { method: 'マイル有効期限・失効' },
  // 配送業者の名前がなく、件名は「【配送予定のお知らせ】お届け前のご確認をお願いします」
  'unknown-delivery': { method: '配送予定・お届け前の確認' },
  // 件名そのままの「【セキュリティ警告】決済カードの再登録と一時制限について」で2位に出ているのにクリックがなかった(2026-11)
  'unknown-card-credit-auth': { method: '決済カードの再登録・与信承認エラー' },
  // 件名は「ご利用限度額(利用可能枠)変更のお知らせ」「ご利用可能枠の改定および本人認証のお願い」
  'takashimaya-card-upgrade': { method: 'ご利用可能枠の改定・本人認証' },
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

// フィッシング(偽のサイトに誘導して、ID・パスワードやカード情報、お金をだまし取る)にあたらない手口
// 事例ページの導入文で「詐欺(フィッシング)です」と書かないものを並べる
export const NOT_PHISHING_METHODS = new Set(['投資LINE勧誘', '副業・在宅ワーク勧誘', '有名人なりすまし', '架空請求', 'その他']);

export function toSlug(map: Record<string, string>, label: string): string {
  return map[label] ?? 'other';
}

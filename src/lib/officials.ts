// なりすまし先 → 公式の注意喚起ページ
// シートの「公式注意喚起」列が空のときに、事例ページの「公式の注意喚起」に使う(シートに入力があればそちらを優先)
// キーはシートのプルダウンの選択肢と同じ表記にする。URLが変わったらここを直す(2026年10月に確認)
export const OFFICIAL_LINKS: Record<string, string> = {
  // 通販・IT
  'Amazon': 'https://www.amazon.co.jp/gp/help/customer/display.html?nodeId=GRGRY7AQ3LMPXVCV',
  'Apple': 'https://support.apple.com/ja-jp/102568',
  'Nintendo': 'https://support.nintendo.com/jp/information/2024/1029.html',
  '楽天': 'https://corp.rakuten.co.jp/security/anti-fraud/',
  // Netflix はヘルプセンターの「フィッシングまたはNetflixを名乗る疑わしいメールやテキストメッセージ」(2026年11月に確認)
  'Netflix': 'https://help.netflix.com/ja/node/65674',
  'WhatsApp': 'https://faq.whatsapp.com/2286952358121083/?locale=ja_JP',
  // クレジットカード
  'Visa': 'https://www.visa.co.jp/pay-with-visa/security/fraud-email.html',
  'Mastercard': 'https://www.mastercard.com/jp/ja/fraud-security-privacy.html',
  'JCB': 'https://www.jcb.co.jp/security/phishing/',
  'セゾンカード': 'https://www.saisoncard.co.jp/topic/entry/lp_phishing/',
  '楽天カード': 'https://www.rakuten-card.co.jp/security/security-info/phishingmail/',
  'オリコカード': 'https://www.orico.co.jp/support/careful/trouble_online/',
  'イオンカード': 'https://www.aeon.co.jp/information/2026/caution_sms_phishing',
  'エポスカード': 'https://www.eposcard.co.jp/security/unauthorized-use/index.html',
  'PayPayカード': 'https://www.paypay-card.co.jp/service/safe/phishing/',
  'アメリカン・エキスプレス': 'https://www.americanexpress.com/ja-jp/security/phishing/',
  // タカシマヤカードは発行会社(高島屋ファイナンシャル・パートナーズ)の「セキュリティ＆サポート」のページ(2026年11月に確認)
  // UCSカードは「UCSをかたる不審なメールにご注意ください」(2026年11月に確認)
  'UCSカード': 'https://www.ucscard.co.jp/info/',
  'タカシマヤカード': 'https://www.takashimaya-fp.co.jp/card/attention/',
  // エムアイカードは「エムアイカードを装った不審なメール(フィッシングメール)にご注意ください」(2026年11月に確認)
  'エムアイカード': 'https://www2.micard.co.jp/notice/201030notice.html',
  '三井住友カード': 'https://www.smbc-card.com/mem/service/sec/phishing01.jsp',
  // 銀行・証券・保険
  '三井住友銀行': 'https://www.smbc.co.jp/security/phishing/',
  '楽天証券': 'https://www.rakuten-sec.co.jp/web/security/crime/fake/',
  '野村證券': 'https://www.nomura.co.jp/introduc/attention/mikoukai.html',
  '第一生命保険': 'https://www.dai-ichi-life.co.jp/information/pdf/fushinsite.pdf',
  // ポイント・マイル・交通
  'ANA': 'https://www.ana.co.jp/ja/jp/share/caution_phishing/',
  'JAL': 'https://www.jal.co.jp/jp/ja/footer/phishing/',
  'JRE POINT': 'https://www.jrepoint.jp/information/jrepoint-office/20260512001',
  // Vポイントは運営会社(V POINT MARKETING)のFAQ「Vポイントを名乗るなりすまし・不審なメールを受け取りました」(2026年11月に確認)
  'Vポイント': 'https://ssl.help.tsite.jp/faq/show/43960?site_domain=qa-tsite',
  'えきねっと(JR東日本)': 'https://www.eki-net.com/top/oshirase/security/',
  'ETC利用照会サービス': 'https://www.etc-meisai.jp/caution/caution_phishing.html',
  // 公共料金・行政
  '東京ガス': 'https://home.tokyo-gas.co.jp/gas_power/contact/phishing.html',
  '東京電力': 'https://www.tepco.co.jp/ep/archive/20240315.html',
  '国税庁': 'https://www.nta.go.jp/information/attention/attention.htm',
  // 配送
  // ヤマト運輸は「ヤマト運輸の名前を装った迷惑メールが多発しています」(2025年8月26日更新、2026年11月に確認)
  'ヤマト運輸': 'https://www.yamato-hd.co.jp/important/info_181212.html',
  '日本郵便': 'https://www.post.japanpost.jp/notification/notice/fraud-mail.html',
  // その他
  // 宝くじは、宝くじ公式サイトのトップからリンクされている、みずほ銀行のページ
  '宝くじ公式サイト': 'https://www.mizuhobank.co.jp/takarakuji/warning/index.html',
};

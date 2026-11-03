// PR枠:A8.net の広告リンク(セキュリティソフト)。並べた順に表示する(事例ページは先頭の1製品だけ)
// url を空にした製品は出さない。すべて空にすると、PR枠を出しているページすべてで枠ごと出さない
// pixel は A8.net の表示回数の計測用画像。リンクコードの <img> の src をそのまま入れる
export interface PrProduct {
  name: string;
  text: string;
  button: string;
  url: string;
  pixel: string;
}

export const PR_SECURITY: PrProduct[] = [
  {
    name: 'ウイルスバスター クラウド',
    text: 'トレンドマイクロのセキュリティソフトです。危険なウェブサイトへのアクセスをブロックする機能があり、詐欺メッセージのURLを誤って開いてしまったときの備えになります。パソコンとスマホの両方で使えます。',
    button: '公式オンラインショップを見る',
    url: 'https://px.a8.net/svt/ejp?a8mat=4BEAWV+GGEES2+3A66+626XU',
    pixel: 'https://www11.a8.net/0.gif?a8mat=4BEAWV+GGEES2+3A66+626XU',
  },
  {
    name: 'ノートン 360',
    text: 'ノートンのセキュリティソフトです。危険なウェブサイトをブロックする機能があり、Windows・Mac・Android・iPhone で使えます。プランによって、使える台数や機能(VPN など)が変わります。',
    button: '公式サイトを見る',
    url: 'https://px.a8.net/svt/ejp?a8mat=4BGCF8+1X2E1E+3IBI+60OXE',
    pixel: 'https://www14.a8.net/0.gif?a8mat=4BGCF8+1X2E1E+3IBI+60OXE',
  },
  {
    name: 'ESET HOME セキュリティ',
    text: 'ESET社のセキュリティソフトで、日本ではキヤノンマーケティングジャパンが販売しています。危険なウェブサイトをブロックする機能があり、Windows・Mac・Android・iPhone で使えます。使える機能は端末によって違います。',
    button: '公式サイトを見る',
    url: 'https://px.a8.net/svt/ejp?a8mat=1U3BGN+30YFKI+1A8Q+15U4OI',
    pixel: 'https://www11.a8.net/0.gif?a8mat=1U3BGN+30YFKI+1A8Q+15U4OI',
  },
  {
    name: 'Surfshark Antivirus',
    text: 'VPNサービスで知られる Surfshark のセキュリティソフトで、VPN などとセットになったプランで提供されています。VPN の「CleanWeb」という機能で、危険なサイトや広告をブロックできます。使える端末と機能はプランによって違います。',
    button: '公式サイトを見る',
    url: 'https://px.a8.net/svt/ejp?a8mat=4BGCF8+1CTNGY+4LSW+BX3J6',
    pixel: 'https://www11.a8.net/0.gif?a8mat=4BGCF8+1CTNGY+4LSW+BX3J6',
  },
];

// 表示する製品(url が空のものを除く)
export const prProducts = PR_SECURITY.filter((p) => p.url);

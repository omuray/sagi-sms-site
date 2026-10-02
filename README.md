# 詐欺SMS事例サイト

スプレッドシートの「公開」行から、手口ごとの事例ページを自動で作る静的サイトです。

## 1. 公開用シートを作る

1. 新しいスプレッドシートを作成(名前例:詐欺SMS_公開用)
2. A1セルに次の式を入れる(URLは記録用シートのもの)

```
=QUERY(IMPORTRANGE("記録用シートのURL","フォームの回答 1!A:K"),"select Col1,Col4,Col5,Col6,Col2,Col7,Col8,Col9 where Col10='公開'",1)
```

3. 初回は「アクセスを許可」を押す
4. 見出しが次の順になっているか確認する
   タイムスタンプ / 媒体 / なりすまし先 / 手口 / 本文 / URL(無害化) / 公式注意喚起 / 受信回数
5. 「ファイル」→「共有」→「ウェブに公開」→ シートを選び形式を「CSV」にして公開 → URLを控える

記録用シートは公開しないこと。送信元の列はこの式で除外されます。

## 2. PCで動かす

Node.js 22.12以上が必要です。

```
npm install
cp .env.example .env   # SHEET_CSV_URL に手順1のURLを書く
npm run dev            # http://localhost:4321 で確認
```

`.env` が空のときは `data/sample.csv` のサンプルで表示されます。

## 3. 公開する(Cloudflare Pages)

1. このフォルダをGitHubに上げる
2. Cloudflare → Workers & Pages → Pages → GitHubと接続してリポジトリを選ぶ
3. フレームワーク:Astro / ビルドコマンド:`npm run build` / 出力:`dist`
4. 環境変数に `SHEET_CSV_URL` を追加
5. 設定 → ビルド → 「デプロイフック」を作成し、URLを控える

## 4. 自動更新

- 毎朝:GitHubのリポジトリ設定 → Secrets に `CF_DEPLOY_HOOK`(手順3-5のURL)を登録
- 手動:`scripts/sheet-menu.gs` を公開用シートのApps Scriptに貼る

## 公開時の自動処理

サイトを作るとき、本文に次の処理を自動でかけます(`src/lib/sheet.ts` の `sanitize`)。

- メールアドレスを「[メールアドレス]」に置き換え、電話番号は下4桁を●で伏せる(例:0120-12●-●●●)
- フィルタ回避用の見えない文字、HTMLタグ、CSSの記述を取り除く
- URLを `hxxps://example[.]com` の形に無害化する
- 手口が「正規の通知」の行は事例ページに載せない

## よく触るファイル

| ファイル | 内容 |
|---|---|
| `src/content/guides/*.md` | 手口ごとの見分け方・対処法。ファイル名はページのURL名(例:sagawa-delivery.md)。ない手口は default.md を使う |
| `src/lib/slugs.ts` | プルダウンの選択肢とURL名の対応。選択肢を増やしたら追記 |
| `src/lib/sheet.ts` | シートの読み込み。見出し名を変えたら上部の COL を修正 |
| `src/styles/global.css` | デザイン |
| `astro.config.mjs` | 独自ドメインを取ったら site を書き換え |

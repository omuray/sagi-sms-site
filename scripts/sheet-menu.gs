// 公開用シートの「拡張機能」→「Apps Script」に貼り付ける
// シートに「サイト」メニューが追加され、押すとすぐにサイトが更新される
const DEPLOY_HOOK = 'ここにCloudflareのデプロイフックURLを貼る';

// つながらないときに試す回数と、次に試すまでの待ち時間(ミリ秒)
const MAX_TRIES = 3;
const RETRY_WAIT = 5000;

function onOpen() {
  SpreadsheetApp.getUi().createMenu('サイト')
    .addItem('サイトを更新', 'rebuildSite')
    .addToUi();
}

function rebuildSite() {
  const ui = SpreadsheetApp.getUi();
  // 貼り付けたときに混ざった空白・改行・見えない文字を取り除く
  const url = DEPLOY_HOOK.replace(/[\s\u200B-\u200F\u2060\uFEFF]/g, '');
  let lastError = '';
  for (let i = 1; i <= MAX_TRIES; i++) {
    try {
      const res = UrlFetchApp.fetch(url, { method: 'post', muteHttpExceptions: true });
      const code = res.getResponseCode();
      if (code >= 200 && code < 300) {
        ui.alert('更新を開始しました。1〜2分で反映されます。');
        return;
      }
      lastError = `Cloudflare から ${code} が返りました`;
      // 4xx はフックの URL が違う・削除されたなど。何度試しても同じなのでやめる
      if (code >= 400 && code < 500) break;
    } catch (e) {
      // 「使用できないアドレス」など、Google 側でつながらなかったとき
      lastError = e.message;
    }
    if (i < MAX_TRIES) Utilities.sleep(RETRY_WAIT);
  }
  ui.alert(
    'サイトの更新を開始できませんでした。\n' +
      'しばらくしてから、もう一度「サイトを更新」を押してください。\n' +
      '何度やっても失敗する場合は、DEPLOY_HOOK の URL を確認してください。\n\n' +
      `(${lastError})`,
  );
}

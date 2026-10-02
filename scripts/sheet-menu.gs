// 公開用シートの「拡張機能」→「Apps Script」に貼り付ける
// シートに「サイト」メニューが追加され、押すとすぐにサイトが更新される
const DEPLOY_HOOK = 'ここにCloudflareのデプロイフックURLを貼る';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('サイト')
    .addItem('サイトを更新', 'rebuildSite')
    .addToUi();
}

function rebuildSite() {
  UrlFetchApp.fetch(DEPLOY_HOOK, { method: 'post' });
  SpreadsheetApp.getUi().alert('更新を開始しました。1〜2分で反映されます。');
}

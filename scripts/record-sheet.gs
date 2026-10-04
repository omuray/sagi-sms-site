// 記録用シート(SMS詐欺(回答))の「拡張機能」→「Apps Script」に貼り付ける
// フォームから「フォームの回答 1_」に新しい行が届いたら、A〜C列を「フォームの回答 1」の末尾に追記し、
// D〜K列を自動で入力する
//
// 初回だけ:
//   1. 「プロジェクトの設定」→「スクリプト プロパティ」に ANTHROPIC_API_KEY を追加
//   2. 関数 setupTrigger を選んで実行し、権限を許可する
//   3. メニュー「自動入力」→「新規分を追記」で、セットアップ前に届いていた新規分を追記する
const SOURCE_SHEET = 'フォームの回答 1_'; // フォームの回答が届くシート
const SHEET_NAME = 'フォームの回答 1'; // 記録用シート(D〜K列を入力する)
const INITIAL_LAST_SOURCE_ROW = 207; // 記録用シートに転記済みの、フォームの回答 1_ の最終行
const CHOICES_SHEET = '選択肢';
const MODEL = 'claude-opus-5-5';
const EXAMPLE_COUNT = 25; // 判定の参考にする既存の記録の数
const MENU_BATCH = 20; // メニューから一度に処理する行数(6分の実行制限対策)

// 列番号(A=1)
const C = { date: 1, body: 2, sender: 3, media: 4, spoof: 5, method: 6, url: 7, official: 8, count: 9, publish: 10, memo: 11 };

function setupTrigger() {
  const ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'onFormSubmitHandler')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onFormSubmitHandler').forSpreadsheet(ss).onFormSubmit().create();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('自動入力')
    .addItem('新規分を追記', 'syncNewRows')
    .addItem('D〜K列が空の行を処理', 'fillEmptyRows')
    .addToUi();
}

function onFormSubmitHandler(e) {
  if (e.range.getSheet().getName() !== SOURCE_SHEET) return;
  syncNewRows();
}

// フォームの回答 1_ のうち未転記の行を、記録用シートの末尾に追記して D〜K列を入力する
function syncNewRows() {
  const ss = SpreadsheetApp.getActive();
  const source = ss.getSheetByName(SOURCE_SHEET);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const props = PropertiesService.getScriptProperties();
  let added = 0;

  withLock(() => {
    let last = Number(props.getProperty('LAST_SOURCE_ROW')) || INITIAL_LAST_SOURCE_ROW;
    const end = Math.min(source.getLastRow(), last + MENU_BATCH);
    if (end <= last) return;

    const rows = source.getRange(last + 1, 1, end - last, C.sender).getValues();
    for (const r of rows) {
      last++;
      if (String(r[C.body - 1]).trim() !== '') {
        const row = sheet.getLastRow() + 1;
        sheet.getRange(row, 1, 1, C.sender).setValues([r]);
        fillRow(sheet, row);
        added++;
      }
      // 1行ごとに記録して、途中で止まっても同じ行を二重に追記しない
      props.setProperty('LAST_SOURCE_ROW', String(last));
    }
  });
  ss.toast(`${added}行を追記しました`);
}

// フォーム送信時に失敗した行の再処理用
function fillEmptyRows() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const values = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), C.media).getValues();
  const rows = values
    .map((v, i) => ({ row: i + 2, body: v[C.body - 1], media: v[C.media - 1] }))
    .filter((r) => String(r.body).trim() !== '' && String(r.media).trim() === '')
    .slice(0, MENU_BATCH);
  withLock(() => rows.forEach((r) => fillRow(sheet, r.row)));
  SpreadsheetApp.getActive().toast(`${rows.length}行を処理しました`);
}

function withLock(fn) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(60 * 1000);
  try {
    fn();
  } finally {
    lock.releaseLock();
  }
}

function fillRow(sheet, row) {
  const data = sheet.getRange(1, 1, sheet.getLastRow(), C.memo).getValues();
  const current = data[row - 1];
  const body = String(current[C.body - 1]);
  if (body.trim() === '' || String(current[C.media - 1]).trim() !== '') return;

  const url = extractUrls(body);
  const rep = findSameBody(data, row);

  // 同じ文面がすでにある → 分類はその行に合わせ、受信回数はその行に集約
  if (rep) {
    const r = data[rep - 1];
    sheet.getRange(rep, C.count).setValue((Number(r[C.count - 1]) || 1) + 1);
    sheet.getRange(row, C.media, 1, 8).setValues([[
      r[C.media - 1], r[C.spoof - 1], r[C.method - 1], url, r[C.official - 1],
      '', '非公開', `${rep}行目と同じ文面(受信回数は${rep}行目に集約)`,
    ]]);
    return;
  }

  let result;
  try {
    result = classify(body, String(current[C.sender - 1]), data);
  } catch (err) {
    // D列を空のままにして、メニューから再処理できるようにする
    sheet.getRange(row, C.memo).setValue(`自動入力エラー: ${err.message}`);
    console.error(err);
    return;
  }

  const publish = result.method === '正規の通知' ? '非公開' : result.publish;
  sheet.getRange(row, C.media, 1, 8).setValues([[
    result.media, result.spoof, result.method, url,
    findOfficial(data, row, result.spoof), 1, publish, result.memo,
  ]]);
}

// URLを抜き出してリンクにならない形にする(公開サイトの defang と同じ形式)
function extractUrls(text) {
  const urls = text.match(/https?:\/\/[!-~]+/g) || [];
  return [...new Set(urls)]
    .map((u) => u.replace(/^http/, 'hxxp').replace(/\./g, '[.]'))
    .join(' / ');
}

// URL・空白・見えない文字・HTMLタグの違いは無視して文面を比べる
function normalize(text) {
  return String(text)
    .replace(/https?:\/\/[!-~]+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*/g, '')
    .replace(/[\s\u200B-\u200F\u2060-\u2064\uFEFF\u034F]/g, '');
}

// 同じ文面の行のうち、受信回数を持っている(集約先の)行番号を返す
function findSameBody(data, row) {
  const target = normalize(data[row - 1][C.body - 1]);
  if (target === '') return null;
  let first = null;
  for (let i = 1; i < data.length; i++) {
    if (i === row - 1 || normalize(data[i][C.body - 1]) !== target) continue;
    if (String(data[i][C.media - 1]).trim() === '') continue; // 未分類の行は対象外
    if (first === null) first = i + 1;
    if (String(data[i][C.count - 1]).trim() !== '') return i + 1;
  }
  return first;
}

// 同じなりすまし先の行に公式注意喚起があれば流用する(新しい行を優先)
function findOfficial(data, row, spoof) {
  for (let i = data.length - 1; i >= 1; i--) {
    if (i === row - 1) continue;
    const official = String(data[i][C.official - 1]).trim();
    if (data[i][C.spoof - 1] === spoof && official !== '') return official;
  }
  return '';
}

function getChoices() {
  const values = SpreadsheetApp.getActive().getSheetByName(CHOICES_SHEET).getDataRange().getValues();
  const col = (i) => values.slice(1).map((v) => String(v[i]).trim()).filter((s) => s !== '');
  return { media: col(0), spoof: col(1), method: col(2), publish: col(3) };
}

// 判定の参考に、既存の記録から「なりすまし先×手口」が重ならないものを新しい順に拾う
function buildExamples(data) {
  const seen = new Set();
  const lines = [];
  for (let i = data.length - 1; i >= 1 && lines.length < EXAMPLE_COUNT; i--) {
    const r = data[i];
    const key = `${r[C.spoof - 1]}|${r[C.method - 1]}`;
    if (String(r[C.media - 1]).trim() === '' || String(r[C.count - 1]).trim() === '' || seen.has(key)) continue;
    seen.add(key);
    const head = String(r[C.body - 1]).replace(/\s+/g, ' ').slice(0, 100);
    lines.push(`- 「${head}」→ 媒体:${r[C.media - 1]} / なりすまし先:${r[C.spoof - 1]} / 手口:${r[C.method - 1]} / 公開可否:${r[C.publish - 1]}`);
  }
  return lines.join('\n');
}

function classify(body, sender, data) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('スクリプト プロパティに ANTHROPIC_API_KEY がありません');
  const choices = getChoices();

  const system = `あなたは詐欺SMS・フィッシングメールの記録係です。届いたメッセージを読み、記録用シートの分類を決めてください。

- 媒体: 件名と本文がある長文や送信元がメールアドレスならメール、短文で電話番号から届く形ならSMS。
- なりすまし先: 本文が名乗っている企業・サービス。選択肢にぴったりのものがなければ最も近いものを選び、実際の名称をメモに書く。
- 手口: 受信者に何をさせようとしているかで選ぶ。
- 本物の企業からの通知と判断できるもの(認証コードの通知、公式ドメインだけのリンク、URLなしでアプリ内操作を案内するもの)は手口を「正規の通知」、公開可否を「非公開」にする。
- 公開可否: 詐欺と判断できれば「公開」、正規の通知なら「非公開」、判断に迷えば「保留」。
- メモ: 記録者が知っておくべき点を短く(例: クラウドストレージ上の偽ページ / 宛先メールアドレスを含む(公開時は伏せる) / 選択肢にない企業名)。特になければ空文字。

これまでの記録(参考):
${buildExamples(data)}`;

  const schema = {
    type: 'object',
    properties: {
      media: { type: 'string', enum: choices.media },
      spoof: { type: 'string', enum: choices.spoof },
      method: { type: 'string', enum: choices.method },
      publish: { type: 'string', enum: choices.publish },
      memo: { type: 'string' },
    },
    required: ['media', 'spoof', 'method', 'publish', 'memo'],
    additionalProperties: false,
  };

  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    payload: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema } },
      system,
      messages: [{ role: 'user', content: `送信元: ${sender || '(空欄)'}\n本文:\n${body}` }],
    }),
    muteHttpExceptions: true,
  });

  const status = res.getResponseCode();
  if (status !== 200) throw new Error(`API ${status}: ${res.getContentText().slice(0, 200)}`);
  const msg = JSON.parse(res.getContentText());
  if (msg.stop_reason === 'refusal') throw new Error('判定を断られました');
  if (msg.stop_reason === 'max_tokens') throw new Error('出力が途中で切れました');
  const text = msg.content.find((b) => b.type === 'text');
  if (!text) throw new Error('応答に判定結果がありません');
  return JSON.parse(text.text);
}

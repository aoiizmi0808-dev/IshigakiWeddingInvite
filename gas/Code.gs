/**
 * ============================================================
 * Ishigaki Wedding Invitation — Google Apps Script
 * ------------------------------------------------------------
 * 役割:
 *   1. RSVPフォームの送信データを Google Sheets に保存
 *   2. 回答者への自動返信メール送信
 *   3. 新郎・新婦への通知メール送信
 *
 * デプロイ手順:
 *   1. Google スプレッドシートを新規作成し、1行目に下記ヘッダーを入力
 *      （SHEET_HEADERS の並び順と一致させること）
 *   2. 拡張機能 > Apps Script を開き、このファイルの内容を貼り付け
 *   3. CONFIG の値を実際のスプレッドシートID・メールアドレス等に変更
 *   4. 「デプロイ」>「新しいデプロイ」>種類「ウェブアプリ」
 *        - 実行ユーザー: 自分
 *        - アクセスできるユーザー: 全員
 *   5. 発行された URL を script.js の CONFIG.GAS_ENDPOINT に設定
 * ============================================================
 */

const CONFIG = {
  // スプレッドシートID（URLの /d/ と /edit の間の文字列）
  SPREADSHEET_ID: '1LcJMI8k0op01rKPPRglZICr2fj0tA4LXnnD1zP1U3nE',
  SHEET_NAME: 'RSVP',

  // 新郎新婦の通知先メールアドレス
  GROOM_EMAIL: 'dylanshun0610@icloud.com',
  BRIDE_EMAIL: 'aoi.izmi0808@gmail.com',

  // 自動返信メールの差出人表示名
  SENDER_NAME: 'ディラン ＆ 葵衣',

  // 挙式情報（メール文面に使用）
  WEDDING_DATE: '2026年10月11日',
  VENUE_NAME: 'Angel Gran Villa',
};

// スプレッドシートのヘッダー（この順番で列に書き込む）
const SHEET_HEADERS = [
  'タイムスタンプ',
  'お名前',
  'フリガナ',
  'メールアドレス',
  'ご出欠',
  'フライト情報',
  'アレルギー等',
  '同伴者人数',
  '同伴者1',
  '同伴者1フライト情報',
  '同伴者1アレルギー等',
  '同伴者2',
  '同伴者2フライト情報',
  '同伴者2アレルギー等',
  '同伴者3',
  '同伴者3フライト情報',
  '同伴者3アレルギー等',
  'メッセージ',
];

/**
 * フォームからの POST リクエストを受け取るエントリポイント
 */
function doPost(e) {
  try {
    const data = parseRequest(e);
    appendToSheet(data);
    sendAutoReply(data);
    notifyCouple(data);

    return jsonResponse({ result: 'success' });
  } catch (err) {
    console.error(err);
    return jsonResponse({ result: 'error', message: err.message });
  }
}

/**
 * リクエストボディ（JSON文字列 or フォームデータ）をパースする
 */
function parseRequest(e) {
  if (e.postData && e.postData.type === 'text/plain') {
    return JSON.parse(e.postData.contents);
  }
  // フォールバック: application/x-www-form-urlencoded の場合
  return e.parameter;
}

/**
 * スプレッドシートに1行追加
 */
function appendToSheet(data) {
  const sheet = getSheet();
  const row = [
    new Date(),
    data.name || '',
    data.kana || '',
    data.email || '',
    data.attendance || '',
    data.flight || '',
    data.allergy || '',
    data.plusOne || '0',
    data.companion1 || '',
    data.companion1Flight || '',
    data.companion1Allergy || '',
    data.companion2 || '',
    data.companion2Flight || '',
    data.companion2Allergy || '',
    data.companion3 || '',
    data.companion3Flight || '',
    data.companion3Allergy || '',
    data.message || '',
  ];
  sheet.appendRow(row);
}

function getSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(SHEET_HEADERS);
  }
  return sheet;
}

/**
 * 回答者への自動返信メール
 */
function sendAutoReply(data) {
  if (!data.email) return;

  const isAttending = data.attendance === '出席';
  const subject = `【${CONFIG.SENDER_NAME}】ご回答ありがとうございます`;

  const body = isAttending
    ? `${data.name} 様

このたびはご出席のご返信をいただき、誠にありがとうございます。
${CONFIG.WEDDING_DATE}、${CONFIG.VENUE_NAME} にて皆様にお会いできますことを
楽しみにしております。

――――――――――――――
ご回答内容
・ご出欠　：${data.attendance}
・同伴者　：${data.plusOne || 0}名
――――――――――――――

何かご不明点がございましたら、本メールにご返信ください。

${CONFIG.SENDER_NAME}`
    : `${data.name} 様

このたびはご返信いただき、誠にありがとうございます。
またお会いできる日を楽しみにしております。

${CONFIG.SENDER_NAME}`;

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: body,
    name: CONFIG.SENDER_NAME,
  });
}

/**
 * 新郎新婦への通知メール
 */
function notifyCouple(data) {
  const subject = `【RSVP通知】${data.name} 様より回答（${data.attendance || '未回答'}）`;

  const body = `新しいRSVP回答がありました。

お名前　　　：${data.name || ''}
フリガナ　　：${data.kana || ''}
メール　　　：${data.email || ''}
ご出欠　　　：${data.attendance || ''}
フライト　　：${data.flight || ''}
アレルギー　：${data.allergy || ''}

同伴者人数　：${data.plusOne || 0}
同伴者1　　：${data.companion1 || ''}（フライト：${data.companion1Flight || ''} ／ アレルギー：${data.companion1Allergy || ''}）
同伴者2　　：${data.companion2 || ''}（フライト：${data.companion2Flight || ''} ／ アレルギー：${data.companion2Allergy || ''}）
同伴者3　　：${data.companion3 || ''}（フライト：${data.companion3Flight || ''} ／ アレルギー：${data.companion3Allergy || ''}）

メッセージ　：${data.message || ''}

スプレッドシートで詳細をご確認ください。`;

  const recipients = [CONFIG.GROOM_EMAIL, CONFIG.BRIDE_EMAIL].filter(Boolean);
  recipients.forEach((to) => {
    MailApp.sendEmail({ to, subject, body });
  });
}

/**
 * JSON レスポンスを返す（no-cors 送信時はクライアント側で読めない点に注意）
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 動作確認用（GASエディタから直接実行してテストする場合に使用）
 */
function test_appendToSheet() {
  appendToSheet({
    name: 'テスト太郎',
    kana: 'テストタロウ',
    email: 'test@example.com',
    attendance: '出席',
    flight: 'JAL 991便',
    allergy: 'なし',
    plusOne: '1',
    companion1: 'テスト花子',
    companion1Flight: 'JAL 991便',
    companion1Allergy: 'なし',
    companion2: '',
    companion2Flight: '',
    companion2Allergy: '',
    companion3: '',
    companion3Flight: '',
    companion3Allergy: '',
    message: 'おめでとうございます！',
  });
}

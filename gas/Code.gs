/*************************************************
 * Ishigaki Wedding Invitation
 * Code.gs
 * Part1
 *************************************************/

/*************************************************
 * 設定
 *************************************************/
const CONFIG = {

  // Google Spreadsheet ID
  SPREADSHEET_ID: "1EefxdmnxeC9U0ckAGfxbC8fa9tAQBelNKUBjLlpIIIM",

  // シート名
  SHEET_NAME: "RSVP",

  // 新郎メール
  GROOM_EMAIL: "新郎メールアドレス",

  // 新婦メール
  BRIDE_EMAIL: "新婦メールアドレス",

  // 差出人名
  FROM_NAME: "ディラン ＆ 葵衣",

  // ゲストへの返信件名
  REPLY_SUBJECT: "【結婚式】ご回答ありがとうございました",

  // 新郎新婦への通知件名
  NOTIFY_SUBJECT: "【RSVP】新しい回答が届きました"

};

/*************************************************
 * GET
 *************************************************/
function doGet() {

  return ContentService
    .createTextOutput("Wedding RSVP API")
    .setMimeType(ContentService.MimeType.TEXT);

}

/*************************************************
 * POST
 *************************************************/
function doPost(e) {

  try {

    // データが送られていない
    if (!e || !e.postData) {
      return jsonOutput({
        success: false,
        message: "No POST Data"
      });
    }

    // script.jsから送られてきたJSON文字列
    const data = JSON.parse(e.postData.contents);

    // Google Sheet保存
    saveToSpreadsheet(data);

    // 自動返信メール
    sendReplyMail(data);

    // 新郎新婦へ通知
    notifyBrideAndGroom(data);

    return jsonOutput({
      success: true,
      message: "Success"
    });

  } catch (err) {

    Logger.log(err);

    return jsonOutput({
      success: false,
      message: err.toString()
    });

  }

}

/*************************************************
 * JSON出力
 *************************************************/
function jsonOutput(obj) {

  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

}

/*************************************************
 * Google Sheetへ保存
 *************************************************/
function saveToSpreadsheet(data) {

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {

    sheet = ss.insertSheet(CONFIG.SHEET_NAME);

    sheet.appendRow([
      "回答日時",

      "お名前",
      "フリガナ",
      "メール",

      "出欠",

      "同伴人数",

      "同伴者1",
      "同伴者1フライト",
      "同伴者1アレルギー",

      "同伴者2",
      "同伴者2フライト",
      "同伴者2アレルギー",

      "同伴者3",
      "同伴者3フライト",
      "同伴者3アレルギー",

      "本人フライト",
      "本人アレルギー",

      "メッセージ",

      "送信日時"
    ]);

  }

  sheet.appendRow([

    Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyy/MM/dd HH:mm:ss"
    ),

    data.name || "",
    data.kana || "",
    data.email || "",

    data.attendance || "",

    data.plusOne || "0",

    data.companion1 || "",
    data.companion1Flight || "",
    data.companion1Allergy || "",

    data.companion2 || "",
    data.companion2Flight || "",
    data.companion2Allergy || "",

    data.companion3 || "",
    data.companion3Flight || "",
    data.companion3Allergy || "",

    data.flight || "",
    data.allergy || "",

    data.message || "",

    data.submittedAt || ""

  ]);

}

/*************************************************
 * ゲストへ自動返信メール
 *************************************************/
function sendReplyMail(data) {

  // メールアドレス未入力なら送らない
  if (!data.email) return;

  const body =
`${data.name} 様

この度はご回答いただき、
誠にありがとうございます。

---------------------------------

■ご回答内容

お名前
${data.name}

ご出欠
${data.attendance}

---------------------------------

当日お会いできることを
心より楽しみにしております。

お気をつけて石垣島までお越しください。

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

ディラン ＆ 葵衣

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝`;

  try {

    MailApp.sendEmail({
      to: data.email,
      subject: CONFIG.REPLY_SUBJECT,
      body: body,
      name: CONFIG.FROM_NAME
    });

    Logger.log("Reply Mail Sent");

  } catch(err){

    Logger.log("Reply Mail Error");
    Logger.log(err);

  }

}


/*************************************************
 * 新郎新婦へ通知メール
 *************************************************/
function notifyBrideAndGroom(data){

  const body =

`新しいRSVPが届きました。

------------------------------

回答日時
${Utilities.formatDate(new Date(),"Asia/Tokyo","yyyy/MM/dd HH:mm:ss")}

お名前
${data.name}

フリガナ
${data.kana}

メール
${data.email}

出欠
${data.attendance}

同伴人数
${data.plusOne}

同伴者①
${data.companion1}

同伴者②
${data.companion2}

同伴者③
${data.companion3}

本人フライト
${data.flight}

本人アレルギー
${data.allergy}

メッセージ

${data.message}

------------------------------`;



  try{

    if(CONFIG.GROOM_EMAIL!=""){

      MailApp.sendEmail({

        to: CONFIG.GROOM_EMAIL,

        subject: CONFIG.NOTIFY_SUBJECT,

        body: body,

        name: CONFIG.FROM_NAME

      });

    }


    if(CONFIG.BRIDE_EMAIL!=""){

      MailApp.sendEmail({

        to: CONFIG.BRIDE_EMAIL,

        subject: CONFIG.NOTIFY_SUBJECT,

        body: body,

        name: CONFIG.FROM_NAME

      });

    }

    Logger.log("Notify Mail Sent");

  }catch(err){

    Logger.log("Notify Mail Error");

    Logger.log(err);

  }

}

/*************************************************
 * 動作確認用
 *************************************************/
function testSave() {

  const data = {

    name: "テスト太郎",

    kana: "テストタロウ",

    email: Session.getActiveUser().getEmail(),

    attendance: "出席",

    plusOne: "1",

    companion1: "テスト花子",
    companion1Flight: "JAL901",
    companion1Allergy: "なし",

    companion2: "",
    companion2Flight: "",
    companion2Allergy: "",

    companion3: "",
    companion3Flight: "",
    companion3Allergy: "",

    flight: "JTA601",

    allergy: "えび",

    message: "Apps Scriptテスト",

    submittedAt: new Date().toISOString()

  };

  saveToSpreadsheet(data);

  sendReplyMail(data);

  notifyBrideAndGroom(data);

  Logger.log("Test Finished");

}

/*************************************************
 * Ishigaki Wedding Invitation
 * Google Apps Script
 * Version 2.0
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
  GROOM_EMAIL: "dylanshun0610@iclloud.com",

  // 新婦メール
  BRIDE_EMAIL: "aoi.izmi0808@gmail.com",

  // 差出人名
  FROM_NAME: "ディラン＆葵衣",

  // 件名
  SUBJECT_REPLY: "【結婚式】ご回答ありがとうございました",

  SUBJECT_NOTIFY: "【RSVP】新しい回答が届きました"

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

    if (!e.postData) {

      return output({

        result: false,
        message: "No Data"

      });

    }

    const data = JSON.parse(e.postData.contents);

    saveToSpreadsheet(data);

    sendReplyMail(data);

    notifyBrideAndGroom(data);

    return output({

      result: true,
      message: "success"

    });

  }

  catch(error){

    Logger.log(error);

    return output({

      result:false,
      message:error.toString()

    });

  }

}

/*************************************************
 * JSON出力
 *************************************************/
function output(obj){

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

  // シートが存在しない場合は作成
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);

    sheet.appendRow([
      "回答日時",
      "お名前",
      "フリガナ",
      "メールアドレス",
      "出欠",
      "同伴者人数",

      "同伴者1",
      "同伴者1 フライト",
      "同伴者1 アレルギー",

      "同伴者2",
      "同伴者2 フライト",
      "同伴者2 アレルギー",

      "同伴者3",
      "同伴者3 フライト",
      "同伴者3 アレルギー",

      "本人フライト",
      "本人アレルギー",
      "メッセージ"
    ]);
  }

  sheet.appendRow([

    new Date(),

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
    data.message || ""

  ]);

}

/*************************************************
 * 返信メール（ゲスト宛）
 *************************************************/
function sendReplyMail(data) {

  if (!data.email) return;

  const attendance =
    data.attendance === "出席"
      ? "ご出席"
      : "ご欠席";

  const body =

`${data.name} 様

この度はご回答いただき、
誠にありがとうございます。

---------------------------------------

お名前
${data.name}

ご回答
${attendance}

---------------------------------------

当日お会いできることを
心より楽しみにしております。

お気をつけて石垣島までお越しください。

＝＝＝＝＝＝＝＝＝＝＝＝＝＝

ディラン ＆ 葵衣

＝＝＝＝＝＝＝＝＝＝＝＝＝＝`;

  MailApp.sendEmail({

    to: data.email,

    subject: CONFIG.SUBJECT_REPLY,

    body: body,

    name: CONFIG.FROM_NAME

  });

}


/*************************************************
 * 新郎新婦へ通知
 *************************************************/
function notifyBrideAndGroom(data) {

  const body =

`新しいRSVPが届きました。

--------------------------------

回答日時
${new Date()}

名前
${data.name}

フリガナ
${data.kana}

メール
${data.email}

出欠
${data.attendance}

同伴者
${data.plusOne}

同伴者①
${data.companion1}

同伴者②
${data.companion2}

同伴者③
${data.companion3}

本人フライト
${data.flight}

アレルギー
${data.allergy}

メッセージ

${data.message}

--------------------------------`;



  if (CONFIG.GROOM_EMAIL != "") {

    MailApp.sendEmail({

      to: CONFIG.GROOM_EMAIL,

      subject: CONFIG.SUBJECT_NOTIFY,

      body: body,

      name: CONFIG.FROM_NAME

    });

  }


  if (CONFIG.BRIDE_EMAIL != "") {

    MailApp.sendEmail({

      to: CONFIG.BRIDE_EMAIL,

      subject: CONFIG.SUBJECT_NOTIFY,

      body: body,

      name: CONFIG.FROM_NAME

    });

  }

}

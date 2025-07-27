import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, category, reason, userName = 'ゲストユーザー' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'テキストが必要です' });
  }

  try {
    // 環境変数から認証情報を取得
    const credentials = process.env.GOOGLE_CREDENTIALS;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!credentials || !spreadsheetId) {
      // Google Sheets連携なしでも動作するように
      console.log('Google Sheets未設定のため、ローカルのみに保存');
      return res.status(200).json({
        success: true,
        local: true,
        message: 'ローカル保存のみ'
      });
    }

    // 認証設定
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentials),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // スプレッドシート情報を取得
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    const firstSheetName = sheetInfo.data.sheets[0].properties.title;

    // 現在時刻を取得
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    // データを追加
    const values = [[
      timestamp,           // A列: タイムスタンプ
      userName,           // B列: ユーザー名
      text,               // C列: 投稿内容
      category,           // D列: カテゴリ番号
      reason              // E列: AI分類理由
    ]];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${firstSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values
      }
    });

    res.status(200).json({
      success: true,
      spreadsheetId: spreadsheetId,
      row: response.data.updates.updatedRows,
      timestamp: timestamp
    });

  } catch (error) {
    console.error('保存エラー:', error);
    // エラーでもアプリは継続動作
    res.status(200).json({ 
      success: true,
      local: true,
      error: error.message
    });
  }
}
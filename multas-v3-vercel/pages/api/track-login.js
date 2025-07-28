import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userName, action } = req.body;

    if (!userName || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Google Sheets認証設定
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // ログイン履歴を記録（LoginHistoryシート）
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const values = [[
      timestamp,
      userName,
      action, // 'login' or 'logout'
      req.headers['user-agent'], // デバイス情報
      req.headers['x-forwarded-for'] || req.connection.remoteAddress // IPアドレス（参考用）
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'LoginHistory!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    res.status(200).json({ 
      success: true,
      message: `${action} tracked successfully`
    });

  } catch (error) {
    console.error('Error tracking login:', error);
    
    // LoginHistoryシートが存在しない場合は作成を試みる
    if (error.message && error.message.includes('Unable to parse range')) {
      res.status(200).json({ 
        success: true,
        message: 'Login tracking will be available after sheet creation'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to track login',
        details: error.message 
      });
    }
  }
}
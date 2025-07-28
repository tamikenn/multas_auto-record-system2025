import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('=== save-post API called ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  
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
    
    console.log('Environment check:');
    console.log('GOOGLE_CREDENTIALS exists:', !!credentials);
    console.log('GOOGLE_CREDENTIALS length:', credentials ? credentials.length : 0);
    console.log('GOOGLE_CREDENTIALS first 50 chars:', credentials ? credentials.substring(0, 50) + '...' : 'null');
    console.log('GOOGLE_SPREADSHEET_ID:', spreadsheetId);

    if (!credentials || !spreadsheetId) {
      // Google Sheets連携なしでも動作するように
      console.log('Google Sheets未設定のため、ローカルのみに保存');
      return res.status(200).json({
        success: true,
        local: true,
        message: 'ローカル保存のみ',
        debug: {
          hasCredentials: !!credentials,
          hasSpreadsheetId: !!spreadsheetId
        }
      });
    }

    // 認証設定
    console.log('Parsing credentials...');
    let parsedCredentials;
    try {
      // 改行や余分な空白を除去
      const cleanedCredentials = credentials.trim();
      console.log('Cleaned credentials length:', cleanedCredentials.length);
      parsedCredentials = JSON.parse(cleanedCredentials);
      console.log('Credentials parsed successfully');
      console.log('Service account email:', parsedCredentials.client_email);
      console.log('Has private_key:', !!parsedCredentials.private_key);
      console.log('Private key starts with:', parsedCredentials.private_key ? parsedCredentials.private_key.substring(0, 50) + '...' : 'missing');
    } catch (parseError) {
      console.error('Credentials parse error:', parseError);
      throw new Error('Invalid GOOGLE_CREDENTIALS format');
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
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
    console.error('=== 保存エラー ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    // エラーでもアプリは継続動作
    res.status(200).json({ 
      success: true,
      local: true,
      error: error.message,
      errorDetail: error.toString()
    });
  }
}
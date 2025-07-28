import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Google Sheets認証設定
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Sharedシートから全データを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Shared!A:I',
    });

    const rows = response.data.values || [];
    
    // ヘッダー行をスキップして、データを整形
    const sharedPosts = rows.slice(1).map((row) => ({
      timestamp: row[0] || '',
      id: row[1] || '',
      userName: row[2] || 'ゲストユーザー',
      text: row[3] || '',
      category: row[4] || '',
      reason: row[5] || '',
      date: row[6] || row[0],
      likes: row[7] ? JSON.parse(row[7]) : {},
      likeCount: parseInt(row[8]) || 0
    }));

    // 新しい投稿を最初に表示（降順）
    sharedPosts.reverse();

    res.status(200).json({ 
      success: true,
      posts: sharedPosts
    });

  } catch (error) {
    console.error('Error fetching shared posts:', error);
    
    // Sharedシートが存在しない場合は空配列を返す
    if (error.message && error.message.includes('Unable to parse range')) {
      return res.status(200).json({ 
        success: true,
        posts: []
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch shared posts',
      details: error.message 
    });
  }
}
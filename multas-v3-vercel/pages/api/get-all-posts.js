import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 環境変数から認証情報を取得
    const credentials = process.env.GOOGLE_CREDENTIALS;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!credentials || !spreadsheetId) {
      return res.status(500).json({ error: 'Google Sheets未設定' });
    }

    // 認証設定
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentials),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // スプレッドシート情報を取得
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    const firstSheetName = sheetInfo.data.sheets[0].properties.title;

    // データを取得（A列からE列まで）
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${firstSheetName}!A:E`
    });

    const rows = response.data.values || [];
    
    // ヘッダー行をスキップして、データを整形
    const posts = rows.slice(1).map((row, index) => ({
      id: index + 1,
      timestamp: row[0] || '',
      userName: row[1] || 'ゲストユーザー',
      text: row[2] || '',
      category: row[3] || '',
      reason: row[4] || ''
    }));

    // 学生別の統計情報を計算
    const studentStats = {};
    posts.forEach(post => {
      const userName = post.userName;
      if (!studentStats[userName]) {
        studentStats[userName] = {
          userName,
          postCount: 0,
          lastPostDate: null,
          firstPostDate: null
        };
      }
      
      studentStats[userName].postCount++;
      
      // 日付の更新
      const postDate = new Date(post.timestamp);
      if (!studentStats[userName].lastPostDate || postDate > new Date(studentStats[userName].lastPostDate)) {
        studentStats[userName].lastPostDate = post.timestamp;
      }
      if (!studentStats[userName].firstPostDate || postDate < new Date(studentStats[userName].firstPostDate)) {
        studentStats[userName].firstPostDate = post.timestamp;
      }
    });

    res.status(200).json({
      success: true,
      posts: posts.reverse(), // 最新順
      studentStats: Object.values(studentStats),
      totalPosts: posts.length,
      totalStudents: Object.keys(studentStats).length
    });

  } catch (error) {
    console.error('データ取得エラー:', error);
    res.status(500).json({ 
      error: 'データ取得エラー',
      details: error.message
    });
  }
}
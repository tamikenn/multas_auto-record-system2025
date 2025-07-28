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

    // 投稿データから最近アクティブなユーザーを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:E',
    });

    const rows = response.data.values || [];
    
    // ユーザー別の最新活動を集計
    const userActivity = {};
    
    rows.slice(1).forEach(row => {
      const timestamp = row[0];
      const userName = row[1] || 'ゲストユーザー';
      
      if (!userActivity[userName] || new Date(timestamp) > new Date(userActivity[userName].lastActivity)) {
        userActivity[userName] = {
          userName,
          lastActivity: timestamp,
          postCount: (userActivity[userName]?.postCount || 0) + 1
        };
      } else {
        userActivity[userName].postCount++;
      }
    });

    // 最近24時間以内にアクティブなユーザーを抽出
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    
    const activeUsers = Object.values(userActivity)
      .filter(user => new Date(user.lastActivity) > oneDayAgo)
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    // 全ユーザーリスト（最近の活動順）
    const allUsers = Object.values(userActivity)
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    res.status(200).json({ 
      success: true,
      activeUsers,
      allUsers,
      summary: {
        totalUsers: allUsers.length,
        activeIn24h: activeUsers.length,
        totalPosts: rows.length - 1
      }
    });

  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active users',
      details: error.message 
    });
  }
}
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

    // ログイン履歴を取得
    let loginHistory = [];
    try {
      const loginResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'LoginHistory!A:E',
      });
      loginHistory = loginResponse.data.values || [];
    } catch (error) {
      console.log('LoginHistory sheet not found, using empty array');
    }

    // ユーザー別の最新ログイン状態を集計
    const userStatus = {};
    
    // ヘッダー行をスキップ
    loginHistory.slice(1).forEach(row => {
      const [timestamp, userName, action, userAgent] = row;
      
      if (!userStatus[userName] || new Date(timestamp) > new Date(userStatus[userName].timestamp)) {
        userStatus[userName] = {
          userName,
          timestamp,
          action,
          userAgent,
          isLoggedIn: action === 'login'
        };
      }
    });

    // 現在ログイン中のユーザーを抽出
    const loggedInUsers = Object.values(userStatus)
      .filter(user => user.isLoggedIn)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 最近のログイン履歴（直近50件）
    const recentLogins = loginHistory
      .slice(1)
      .slice(-50)
      .reverse()
      .map(row => ({
        timestamp: row[0],
        userName: row[1],
        action: row[2],
        userAgent: row[3]
      }));

    // 投稿データからもアクティブユーザーを補完
    const postsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:B',
    });
    
    const posts = postsResponse.data.values || [];
    const activeFromPosts = new Set();
    
    // 過去1時間以内に投稿したユーザー
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    posts.slice(1).forEach(row => {
      const [timestamp, userName] = row;
      if (new Date(timestamp) > oneHourAgo) {
        activeFromPosts.add(userName);
      }
    });

    res.status(200).json({ 
      success: true,
      loggedInUsers,
      recentLogins,
      activeFromPosts: Array.from(activeFromPosts),
      summary: {
        currentlyLoggedIn: loggedInUsers.length,
        totalUsers: Object.keys(userStatus).length,
        recentlyActive: activeFromPosts.size
      }
    });

  } catch (error) {
    console.error('Error fetching login status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch login status',
      details: error.message 
    });
  }
}
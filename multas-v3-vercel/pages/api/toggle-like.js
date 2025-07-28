import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { postId, userId, action } = req.body;

    if (!postId || !userId || !action) {
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

    // Sharedシートから該当する投稿を検索
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Shared!A:I',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;
    
    // 投稿IDと一致する行を探す
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === postId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // 現在のいいねデータを取得
    const currentLikes = rows[rowIndex][7] ? JSON.parse(rows[rowIndex][7]) : {};
    
    // いいねの追加/削除
    if (action === 'like') {
      currentLikes[userId] = true;
    } else if (action === 'unlike') {
      delete currentLikes[userId];
    }

    // いいね数を計算
    const likeCount = Object.keys(currentLikes).length;

    // 更新データを準備
    const updateRange = `Shared!H${rowIndex + 1}:I${rowIndex + 1}`;
    const updateValues = [[JSON.stringify(currentLikes), likeCount]];

    // Google Sheetsを更新
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: updateValues },
    });

    res.status(200).json({ 
      success: true,
      likes: currentLikes,
      likeCount: likeCount
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ 
      error: 'Failed to toggle like',
      details: error.message 
    });
  }
}
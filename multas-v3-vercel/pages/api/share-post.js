import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { post } = req.body;

    if (!post || !post.text || !post.userName) {
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

    // 共有投稿用のシートに書き込み（Sharedシート）
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const values = [[
      timestamp,
      post.id || `${Date.now()}_${post.userName}`,
      post.userName,
      post.text,
      post.category || '',
      post.reason || '',
      post.date || timestamp,
      JSON.stringify(post.likes || {}),
      0 // likeCount
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Shared!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    res.status(200).json({ 
      success: true,
      message: '投稿が共有されました'
    });

  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ 
      error: 'Failed to share post',
      details: error.message 
    });
  }
}
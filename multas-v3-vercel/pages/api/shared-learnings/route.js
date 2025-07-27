import { google } from 'googleapis';

// Google Sheets APIクライアントを初期化
const initializeGoogleSheets = () => {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  return google.sheets({ version: 'v4', auth });
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Google Sheets連携が整うまでコメントアウト
      // const sheets = initializeGoogleSheets();
      // const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      
      // // Google Sheetsから全データを取得
      // const response = await sheets.spreadsheets.values.get({
      //   spreadsheetId,
      //   range: 'Sheet1!A:E', // A:タイムスタンプ, B:テキスト, C:カテゴリ, D:理由, E:いいね数
      // });
      
      // const rows = response.data.values || [];
      
      // // ヘッダー行を除外して、ランダムに20件選択
      // const dataRows = rows.slice(1);
      // const shuffled = dataRows.sort(() => 0.5 - Math.random());
      // const selected = shuffled.slice(0, 20);
      
      // // データを整形
      // const sharedPosts = selected.map((row, index) => ({
      //   id: `shared-${index}`,
      //   text: row[1] || '',
      //   category: parseInt(row[2]) || 1,
      //   timestamp: row[0] || new Date().toISOString(),
      //   likes: parseInt(row[4]) || 0,
      // }));
      
      // res.status(200).json({ posts: sharedPosts });
      
      // 一時的にエラーを発生させてデモデータを返す
      throw new Error('Demo mode');
    } catch (error) {
      console.error('共有学習データ取得エラー:', error);
      // エラーの場合はダミーデータを返す
      res.status(200).json({ 
        posts: [
          {
            id: 'demo-1',
            text: '今日は心電図の読み方について学びました。P波、QRS群、T波の意味がよくわかりました。',
            category: 9,
            timestamp: '2025/1/26 10:30:00',
            likes: 5
          },
          {
            id: 'demo-2',
            text: '患者さんとのコミュニケーションで、傾聴の大切さを実感しました。',
            category: 6,
            timestamp: '2025/1/26 11:15:00',
            likes: 8
          },
          {
            id: 'demo-3',
            text: '採血の手技を初めて体験。緊張したけど、指導医の先生が優しく教えてくれました。',
            category: 3,
            timestamp: '2025/1/26 14:20:00',
            likes: 12
          }
        ]
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
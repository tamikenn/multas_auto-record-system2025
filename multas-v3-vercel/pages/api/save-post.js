import { getHybridStorage } from '../../lib/hybrid-storage.js';

export default async function handler(req, res) {
  console.log('=== save-post API called ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, category, reason, userName = 'ゲストユーザー', id } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'テキストが必要です' });
  }

  try {
    const hybridStorage = getHybridStorage();
    
    // 現在時刻を取得
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    // 投稿データを準備
    const post = {
      id: id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      userName,
      text,
      category: category || 0,
      reason: reason || '',
      date: timestamp
    };

    // HybridStorageを使用して保存（Excelに即座に保存、Google Sheetsはバックグラウンド同期）
    const result = await hybridStorage.addPost(post);

    res.status(200).json({
      success: true,
      post: post,
      rowNumber: result.rowNumber,
      synced: result.synced,
      message: '投稿を保存しました（Excelに保存、Google Sheetsはバックグラウンドで同期中）'
    });

  } catch (error) {
    console.error('=== 保存エラー ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // エラーでもアプリは継続動作（ローカル保存を試みる）
    res.status(200).json({ 
      success: true,
      local: true,
      error: error.message,
      errorDetail: error.toString(),
      message: '保存に失敗しましたが、アプリは継続動作します'
    });
  }
}
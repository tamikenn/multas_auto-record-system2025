import { getHybridStorage } from '../../lib/hybrid-storage.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const hybridStorage = getHybridStorage();
    
    // クエリパラメータからユーザー名を取得（オプション）
    const { userName } = req.query;

    // 投稿を取得
    let posts;
    if (userName) {
      posts = await hybridStorage.loadUserPosts(userName);
    } else {
      posts = await hybridStorage.loadAllPosts();
    }

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

    // 最新順にソート
    posts.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      posts: posts,
      studentStats: Object.values(studentStats),
      totalPosts: posts.length,
      totalStudents: Object.keys(studentStats).length,
      source: 'Excel'
    });

  } catch (error) {
    console.error('データ取得エラー:', error);
    res.status(500).json({ 
      error: 'データ取得エラー',
      details: error.message
    });
  }
}
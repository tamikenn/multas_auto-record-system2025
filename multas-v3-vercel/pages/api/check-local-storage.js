export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userName, localPosts } = req.body;

    console.log('=== LocalStorage チェック ===');
    console.log(`ユーザー: ${userName}`);
    console.log(`ローカル投稿数: ${localPosts ? localPosts.length : 0}`);
    
    if (localPosts && localPosts.length > 0) {
      console.log('最新の投稿:');
      localPosts.slice(-3).forEach(post => {
        console.log(`- ${post.timestamp}: ${post.text?.substring(0, 30)}...`);
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'LocalStorage data logged',
      userName,
      postCount: localPosts ? localPosts.length : 0,
      latestPosts: localPosts ? localPosts.slice(-3) : []
    });

  } catch (error) {
    console.error('Error checking local storage:', error);
    res.status(500).json({ 
      error: 'Failed to check local storage',
      details: error.message 
    });
  }
}
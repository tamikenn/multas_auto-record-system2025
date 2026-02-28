import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SHARED_POSTS_FILE = path.join(DATA_DIR, 'shared-posts.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadSharedPosts() {
  ensureDataDir();
  if (!fs.existsSync(SHARED_POSTS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(SHARED_POSTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading shared posts:', error);
    return [];
  }
}

function saveSharedPosts(posts) {
  ensureDataDir();
  fs.writeFileSync(SHARED_POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { post } = req.body;

    if (!post || !post.text) {
      console.log('Share post validation failed:', { post });
      return res.status(400).json({ error: 'Missing required fields', details: { hasPost: !!post, hasText: !!post?.text, hasUserName: !!post?.userName } });
    }
    
    // userNameが無い場合はsharedByを使用
    const userName = post.userName || post.sharedBy || 'Unknown';

    const sharedPosts = loadSharedPosts();
    
    // 重複チェック（同じIDの投稿がないか）
    const existingIndex = sharedPosts.findIndex(p => p.id === post.id);
    if (existingIndex !== -1) {
      return res.status(200).json({ 
        success: true,
        message: 'この投稿は既に共有されています'
      });
    }

    const timestamp = new Date().toISOString();
    const newSharedPost = {
      id: post.id || `shared_${Date.now()}_${userName}`,
      timestamp,
      userName: userName,
      sharedBy: post.sharedBy || userName,
      text: post.text,
      category: post.category || '',
      reason: post.reason || '',
      date: post.date || post.timestamp || timestamp,
      likes: post.likes || {},
      likeCount: post.likeCount || 0
    };

    sharedPosts.unshift(newSharedPost);
    saveSharedPosts(sharedPosts);

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

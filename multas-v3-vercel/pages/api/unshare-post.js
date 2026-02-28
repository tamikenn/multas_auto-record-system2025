import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SHARED_POSTS_FILE = path.join(DATA_DIR, 'shared-posts.json');

function loadSharedPosts() {
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
  fs.writeFileSync(SHARED_POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { postId, userName } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'Missing postId' });
    }

    const sharedPosts = loadSharedPosts();
    
    // 投稿を検索
    const postIndex = sharedPosts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = sharedPosts[postIndex];

    // 投稿者本人またはadminのみ削除可能
    if (post.userName !== userName && post.sharedBy !== userName && userName !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // 投稿を削除
    sharedPosts.splice(postIndex, 1);
    saveSharedPosts(sharedPosts);

    res.status(200).json({ 
      success: true,
      message: '共有を解除しました'
    });

  } catch (error) {
    console.error('Error unsharing post:', error);
    res.status(500).json({ 
      error: 'Failed to unshare post',
      details: error.message 
    });
  }
}

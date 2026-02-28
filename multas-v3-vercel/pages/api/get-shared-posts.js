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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sharedPosts = loadSharedPosts();

    res.status(200).json({ 
      success: true,
      posts: sharedPosts
    });

  } catch (error) {
    console.error('Error fetching shared posts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shared posts',
      details: error.message 
    });
  }
}

import { useState, useEffect } from 'react';
import { getCategoryName } from '../lib/categories';

export default function SharedLearning() {
  const [sharedPosts, setSharedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState(new Set());

  useEffect(() => {
    fetchSharedLearnings();
    // ローカルストレージからいいね情報を復元
    const savedLikes = localStorage.getItem('multas_liked_posts');
    if (savedLikes) {
      setLikedPosts(new Set(JSON.parse(savedLikes)));
    }
  }, []);

  const fetchSharedLearnings = async () => {
    try {
      const response = await fetch('/api/shared-learnings');
      const data = await response.json();
      setSharedPosts(data.posts || []);
    } catch (error) {
      console.error('共有学習データの取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`/api/shared-learnings/${postId}/like`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const newLikedPosts = new Set(likedPosts);
        
        if (likedPosts.has(postId)) {
          newLikedPosts.delete(postId);
          // いいね数を減らす
          setSharedPosts(posts => 
            posts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) - 1 } : p)
          );
        } else {
          newLikedPosts.add(postId);
          // いいね数を増やす
          setSharedPosts(posts => 
            posts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p)
          );
        }
        
        setLikedPosts(newLikedPosts);
        localStorage.setItem('multas_liked_posts', JSON.stringify([...newLikedPosts]));
      }
    } catch (error) {
      console.error('いいねエラー:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (sharedPosts.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>まだ共有された学びがありません</p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          他の学生の投稿が表示されるまでお待ちください
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {sharedPosts.map(post => (
        <div key={post.id} style={styles.sharedPost}>
          <div style={styles.postHeader}>
            <span style={styles.anonymousUser}>匿名の学生</span>
            <span style={styles.timestamp}>{post.timestamp}</span>
          </div>
          <div style={styles.postContent}>
            {post.text}
          </div>
          <div style={styles.postFooter}>
            <span style={styles.categoryTag}>
              {getCategoryName(post.category)}
            </span>
            <button
              style={{
                ...styles.likeButton,
                ...(likedPosts.has(post.id) ? styles.likedButton : {})
              }}
              onClick={() => handleLike(post.id)}
            >
              <span style={styles.likeIcon}>
                {likedPosts.has(post.id) ? '❤️' : '🤍'}
              </span>
              <span>{post.likes || 0}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  },
  
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    color: '#666'
  },
  
  sharedPost: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '14px'
  },
  
  anonymousUser: {
    fontWeight: 'bold',
    color: '#666'
  },
  
  timestamp: {
    color: '#999',
    fontSize: '12px'
  },
  
  postContent: {
    fontSize: '16px',
    lineHeight: '1.5',
    marginBottom: '12px'
  },
  
  postFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  categoryTag: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  
  likeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    backgroundColor: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  
  likedButton: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336'
  },
  
  likeIcon: {
    fontSize: '16px'
  }
};
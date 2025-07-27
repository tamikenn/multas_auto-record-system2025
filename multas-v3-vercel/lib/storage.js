// ローカルストレージとの同期を管理するモジュール

const STORAGE_KEY = 'multas_v3_posts';
const USER_KEY = 'multas_v3_current_user';
const SHARED_POSTS_KEY = 'multas_v3_shared_posts';
const LIKED_POSTS_KEY = 'multas_v3_liked_posts';

export const storage = {
  // 投稿を保存
  savePosts: (posts) => {
    try {
      if (typeof window !== 'undefined') {
        const user = storage.getCurrentUser();
        if (user) {
          storage.saveUserPosts(user, posts);
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
        }
      }
    } catch (error) {
      console.error('保存エラー:', error);
    }
  },

  // 投稿を読み込み
  loadPosts: () => {
    try {
      if (typeof window !== 'undefined') {
        const user = storage.getCurrentUser();
        if (user) {
          return storage.loadUserPosts(user);
        }
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error('読み込みエラー:', error);
      return [];
    }
    return [];
  },

  // 投稿を追加（既存データに追加）
  addPost: (newPost) => {
    const posts = storage.loadPosts();
    const updatedPosts = [newPost, ...posts];
    storage.savePosts(updatedPosts);
    return updatedPosts;
  },

  // 投稿を削除
  removePost: (postId) => {
    const posts = storage.loadPosts();
    const updatedPosts = posts.filter(p => p.id !== postId);
    storage.savePosts(updatedPosts);
    return updatedPosts;
  },

  // 投稿を更新
  updatePost: (updatedPost) => {
    const posts = storage.loadPosts();
    const index = posts.findIndex(p => p.id === updatedPost.id);
    if (index !== -1) {
      posts[index] = updatedPost;
      storage.savePosts(posts);
    }
    return posts;
  },

  // データをクリア（開発用）
  clearPosts: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
  
  // シンプルなユーザー管理
  getCurrentUser: () => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(USER_KEY);
      }
    } catch (error) {
      console.error('ユーザー情報読み込みエラー:', error);
    }
    return null;
  },
  
  setCurrentUser: (username) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, username);
        return username;
      }
    } catch (error) {
      console.error('ユーザー情報保存エラー:', error);
    }
    return null;
  },
  
  clearCurrentUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  },
  
  // ユーザーごとの投稿を取得
  loadUserPosts: (username) => {
    try {
      if (typeof window !== 'undefined' && username) {
        const userPostsKey = `${STORAGE_KEY}_${username}`;
        const data = localStorage.getItem(userPostsKey);
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error('ユーザー投稿読み込みエラー:', error);
      return [];
    }
    return [];
  },
  
  saveUserPosts: (username, posts) => {
    try {
      if (typeof window !== 'undefined' && username) {
        const userPostsKey = `${STORAGE_KEY}_${username}`;
        localStorage.setItem(userPostsKey, JSON.stringify(posts));
      }
    } catch (error) {
      console.error('ユーザー投稿保存エラー:', error);
    }
  },
  
  // シェアされた投稿の管理
  loadSharedPosts: () => {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(SHARED_POSTS_KEY);
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error('シェア投稿読み込みエラー:', error);
      return [];
    }
    return [];
  },
  
  saveSharedPosts: (posts) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SHARED_POSTS_KEY, JSON.stringify(posts));
      }
    } catch (error) {
      console.error('シェア投稿保存エラー:', error);
    }
  },
  
  addSharedPost: (post) => {
    const sharedPosts = storage.loadSharedPosts();
    const newPost = {
      ...post,
      sharedAt: new Date().toISOString(),
      sharedBy: storage.getCurrentUser(),
      id: `shared_${Date.now()}_${Math.random()}`,
      likes: 0
    };
    const updatedPosts = [newPost, ...sharedPosts];
    storage.saveSharedPosts(updatedPosts);
    return updatedPosts;
  },
  
  // いいね機能
  getLikedPosts: () => {
    try {
      if (typeof window !== 'undefined') {
        const user = storage.getCurrentUser();
        if (!user) return [];
        const userLikesKey = `${LIKED_POSTS_KEY}_${user}`;
        const data = localStorage.getItem(userLikesKey);
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error('いいね読み込みエラー:', error);
      return [];
    }
    return [];
  },
  
  toggleLike: (postId) => {
    const user = storage.getCurrentUser();
    if (!user) return { liked: false, count: 0 };
    
    const userLikesKey = `${LIKED_POSTS_KEY}_${user}`;
    const likedPosts = storage.getLikedPosts();
    const sharedPosts = storage.loadSharedPosts();
    
    const isLiked = likedPosts.includes(postId);
    let newLikedPosts;
    
    if (isLiked) {
      // いいねを取り消し
      newLikedPosts = likedPosts.filter(id => id !== postId);
    } else {
      // いいねを追加
      newLikedPosts = [...likedPosts, postId];
    }
    
    // ユーザーのいいねリストを保存
    localStorage.setItem(userLikesKey, JSON.stringify(newLikedPosts));
    
    // 投稿のいいね数を更新
    const updatedPosts = sharedPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: isLiked ? (post.likes || 0) - 1 : (post.likes || 0) + 1
        };
      }
      return post;
    });
    
    storage.saveSharedPosts(updatedPosts);
    
    const targetPost = updatedPosts.find(p => p.id === postId);
    return {
      liked: !isLiked,
      count: targetPost ? targetPost.likes : 0
    };
  }
};
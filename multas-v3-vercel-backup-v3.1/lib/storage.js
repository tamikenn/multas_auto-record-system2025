// ローカルストレージとの同期を管理するモジュール

const STORAGE_KEY = 'multas_v3_posts';
const GAME_DATA_KEY = 'multas_v3_game';
const SETTINGS_KEY = 'multas_v3_settings';
const USER_KEY = 'multas_v3_user';

export const storage = {
  // 投稿を保存
  savePosts: (posts) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      }
    } catch (error) {
      console.error('保存エラー:', error);
    }
  },

  // 投稿を読み込み
  loadPosts: () => {
    try {
      if (typeof window !== 'undefined') {
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
  
  // ゲームデータ（レベル、経験値など）の管理
  loadGameData: () => {
    try {
      if (typeof window !== 'undefined') {
        const user = storage.getCurrentUser();
        if (!user) {
          return { level: 1, exp: 0, totalExp: 0, totalPosts: 0, currentDay: 1, expToNextLevel: 100 };
        }
        
        // ユーザーごとのゲームデータキー
        const userGameKey = `${GAME_DATA_KEY}_${user.username}`;
        const data = localStorage.getItem(userGameKey);
        
        return data ? JSON.parse(data) : { 
          level: 1, 
          exp: 0, 
          totalExp: 0,
          totalPosts: 0, 
          currentDay: 1,
          expToNextLevel: 100 
        };
      }
    } catch (error) {
      console.error('ゲームデータ読み込みエラー:', error);
      return { level: 1, exp: 0, totalExp: 0, totalPosts: 0, currentDay: 1, expToNextLevel: 100 };
    }
    return { level: 1, exp: 0, totalExp: 0, totalPosts: 0, currentDay: 1, expToNextLevel: 100 };
  },
  
  saveGameData: (gameData) => {
    try {
      if (typeof window !== 'undefined') {
        const user = storage.getCurrentUser();
        if (!user) return;
        
        // ユーザーごとのゲームデータキー
        const userGameKey = `${GAME_DATA_KEY}_${user.username}`;
        localStorage.setItem(userGameKey, JSON.stringify(gameData));
      }
    } catch (error) {
      console.error('ゲームデータ保存エラー:', error);
    }
  },
  
  // 日付ごとの投稿を管理
  getPostsByDay: (posts, day) => {
    // 練習モードの場合は'practice'、それ以外は数値
    if (day === 'practice') {
      return posts.filter(post => post.day === 'practice');
    }
    return posts.filter(post => post.day === parseInt(day));
  },
  
  // 設定の管理（現在の日付を含む）
  loadSettings: () => {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(SETTINGS_KEY);
        return data ? JSON.parse(data) : { currentDay: 1 };
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error);
      return { currentDay: 1 };
    }
    return { currentDay: 1 };
  },
  
  saveSettings: (settings) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
    }
  },
  
  // 現在の日付を取得
  getCurrentDay: () => {
    const settings = storage.loadSettings();
    return settings.currentDay || 1;
  },
  
  // 現在の日付を設定
  setCurrentDay: (day) => {
    const settings = storage.loadSettings();
    settings.currentDay = day;
    storage.saveSettings(settings);
  },
  
  // ユーザー管理
  getCurrentUser: () => {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error('ユーザー情報読み込みエラー:', error);
      return null;
    }
    return null;
  },
  
  setCurrentUser: (username) => {
    try {
      if (typeof window !== 'undefined') {
        const userData = {
          username,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        return userData;
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
  getPostsByUser: (posts, username) => {
    if (!username) return posts;
    return posts.filter(post => post.username === username);
  },
  
  // 経験値計算とレベルアップ処理
  calculateExp: (currentLevel, elementCount = 1) => {
    // 基本経験値: 100 / 現在レベル
    const baseExp = Math.floor(100 / currentLevel);
    
    // 複数要素ボーナス: 要素数 × 50%
    const bonusMultiplier = 1 + (elementCount - 1) * 0.5;
    
    return Math.floor(baseExp * bonusMultiplier);
  },
  
  // 次のレベルに必要な経験値
  getExpRequiredForLevel: (level) => {
    // レベル × 100の経験値が必要
    return level * 100;
  },
  
  // レベルアップ処理
  processLevelUp: (gameData) => {
    let newGameData = { ...gameData };
    let leveledUp = false;
    
    while (newGameData.exp >= newGameData.expToNextLevel) {
      newGameData.exp -= newGameData.expToNextLevel;
      newGameData.level += 1;
      newGameData.expToNextLevel = storage.getExpRequiredForLevel(newGameData.level);
      leveledUp = true;
    }
    
    return { gameData: newGameData, leveledUp };
  },
  
  // 投稿による経験値獲得とゲームデータ更新
  addExpAndSave: (elementCount = 1, isPracticeMode = false) => {
    const gameData = storage.loadGameData();
    
    // 練習モードの場合はEXPを付与しない
    if (isPracticeMode) {
      gameData.totalPosts += 1;
      storage.saveGameData(gameData);
      return {
        expGained: 0,
        leveledUp: false,
        newLevel: gameData.level,
        currentExp: gameData.exp,
        expToNextLevel: gameData.expToNextLevel
      };
    }
    
    const expGained = storage.calculateExp(gameData.level, elementCount);
    
    gameData.exp += expGained;
    gameData.totalExp += expGained;
    gameData.totalPosts += 1;
    
    const { gameData: updatedGameData, leveledUp } = storage.processLevelUp(gameData);
    storage.saveGameData(updatedGameData);
    
    return {
      expGained,
      leveledUp,
      newLevel: updatedGameData.level,
      currentExp: updatedGameData.exp,
      expToNextLevel: updatedGameData.expToNextLevel
    };
  }
};
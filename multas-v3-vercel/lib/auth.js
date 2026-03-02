/**
 * 認証ユーティリティ
 * シンプルな名前＋パスワード認証
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

/**
 * パスワードをハッシュ化
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

/**
 * パスワードを検証
 */
function verifyPassword(password, salt, hash) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * セッショントークンを生成
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * ユーザーデータを読み込み
 */
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const dir = path.dirname(USERS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [], sessions: {} }, null, 2));
      return { users: [], sessions: {} };
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading users:', error);
    return { users: [], sessions: {} };
  }
}

/**
 * ユーザーデータを保存
 */
function saveUsers(data) {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

/**
 * ユーザーを登録
 * @param {string} username - ユーザー名
 * @param {string} password - パスワード
 * @param {string} role - 権限 (admin, teacher, facility, student)
 * @param {string[]} facilities - 所属施設ID配列（学生の場合は実習先、施設の場合は自施設）
 */
function registerUser(username, password, role = 'student', facilities = []) {
  const data = loadUsers();
  
  // 既存ユーザーチェック
  if (data.users.find(u => u.username === username)) {
    return { success: false, error: 'ユーザー名は既に使用されています' };
  }
  
  const { salt, hash } = hashPassword(password);
  
  const newUser = {
    id: `user_${Date.now()}`,
    username,
    salt,
    hash,
    role,
    facilities: facilities || [],
    createdAt: new Date().toISOString()
  };
  
  data.users.push(newUser);
  
  if (saveUsers(data)) {
    return { success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role, facilities: newUser.facilities } };
  }
  return { success: false, error: '保存に失敗しました' };
}

/**
 * ログイン
 */
function login(username, password) {
  const data = loadUsers();
  
  const user = data.users.find(u => u.username === username);
  if (!user) {
    return { success: false, error: 'ユーザー名またはパスワードが正しくありません' };
  }
  
  if (!verifyPassword(password, user.salt, user.hash)) {
    return { success: false, error: 'ユーザー名またはパスワードが正しくありません' };
  }
  
  // セッショントークン生成
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7日間
  
  data.sessions[token] = {
    userId: user.id,
    username: user.username,
    role: user.role,
    facilities: user.facilities || [],
    expiresAt
  };
  
  saveUsers(data);
  
  return {
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role, facilities: user.facilities || [] }
  };
}

/**
 * セッション検証
 */
function validateSession(token) {
  if (!token) return null;
  
  const data = loadUsers();
  const session = data.sessions[token];
  
  if (!session) return null;
  
  if (new Date(session.expiresAt) < new Date()) {
    delete data.sessions[token];
    saveUsers(data);
    return null;
  }
  
  return session;
}

/**
 * ログアウト
 */
function logout(token) {
  const data = loadUsers();
  
  if (data.sessions[token]) {
    delete data.sessions[token];
    saveUsers(data);
  }
  
  return { success: true };
}

/**
 * 全ユーザー取得（管理者用）
 */
function getAllUsers() {
  const data = loadUsers();
  return data.users.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    facilities: u.facilities || [],
    scheduleStartDate: u.scheduleStartDate || null,
    schedule: u.schedule || null,
    createdAt: u.createdAt,
    isTest: u.isTest || false
  }));
}

/**
 * ユーザー削除（管理者用）
 */
function deleteUser(userId) {
  const data = loadUsers();
  
  const index = data.users.findIndex(u => u.id === userId);
  if (index === -1) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }
  
  const user = data.users[index];
  data.users.splice(index, 1);
  
  // 関連セッションも削除
  Object.keys(data.sessions).forEach(token => {
    if (data.sessions[token].userId === userId) {
      delete data.sessions[token];
    }
  });
  
  if (saveUsers(data)) {
    return { success: true, deletedUser: user.username };
  }
  return { success: false, error: '削除に失敗しました' };
}

/**
 * テストユーザーフラグの切り替え（管理者用）
 */
function toggleTestFlag(userId) {
  const data = loadUsers();
  const user = data.users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }
  user.isTest = !user.isTest;
  if (saveUsers(data)) {
    return { success: true, isTest: user.isTest, username: user.username };
  }
  return { success: false, error: '更新に失敗しました' };
}

/**
 * パスワード変更
 */
function changePassword(userId, currentPassword, newPassword) {
  const data = loadUsers();
  
  const user = data.users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }
  
  // 現在のパスワードを検証
  if (!verifyPassword(currentPassword, user.salt, user.hash)) {
    return { success: false, error: '現在のパスワードが正しくありません' };
  }
  
  const { salt, hash } = hashPassword(newPassword);
  user.salt = salt;
  user.hash = hash;
  
  if (saveUsers(data)) {
    return { success: true };
  }
  return { success: false, error: '保存に失敗しました' };
}

/**
 * 管理者によるパスワードリセット（現在のパスワード不要）
 */
function resetPassword(userId, newPassword) {
  const data = loadUsers();
  
  const user = data.users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }
  
  const { salt, hash } = hashPassword(newPassword);
  user.salt = salt;
  user.hash = hash;
  
  if (saveUsers(data)) {
    return { success: true };
  }
  return { success: false, error: '保存に失敗しました' };
}

/**
 * 初期管理者の作成（users.jsonが空の場合）
 */
function ensureAdminExists() {
  const data = loadUsers();
  
  const hasAdmin = data.users.some(u => u.role === 'admin');
  if (!hasAdmin) {
    const result = registerUser('admin', 'admin123', 'admin');
    if (result.success) {
      console.log('初期管理者を作成しました: admin / admin123');
    }
  }
}

/**
 * ユーザー名からユーザー情報を取得
 * @param {string} username
 * @returns {Object|null}
 */
function getUserByUsername(username) {
  const data = loadUsers();
  const user = data.users.find(u => u.username === username);
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    facilities: user.facilities || []
  };
}

/**
 * 特定の施設に所属する学生のユーザー名一覧を取得
 * @param {string[]} facilityIds - 施設ID配列
 * @returns {string[]} - ユーザー名配列
 */
function getStudentsByFacilities(facilityIds) {
  const data = loadUsers();
  return data.users
    .filter(u => {
      if (u.role !== 'student') return false;
      // スケジュールベースでチェック
      if (u.schedule) {
        return Object.values(u.schedule).some(f => facilityIds.includes(f));
      }
      // 旧形式（facilities配列）もサポート
      if (u.facilities) {
        return u.facilities.some(f => facilityIds.includes(f));
      }
      return false;
    })
    .map(u => u.username);
}

/**
 * 学生の実習スケジュールを更新
 * @param {string} userId - ユーザーID
 * @param {string} startDate - 実習開始日（月曜日）
 * @param {Object} schedule - { day1: 'Rishiri', day2: 'Rishiri', ... }
 */
function updateStudentSchedule(userId, startDate, schedule) {
  const data = loadUsers();
  const user = data.users.find(u => u.id === userId);
  
  if (!user) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }
  
  if (user.role !== 'student') {
    return { success: false, error: '学生のみスケジュールを設定できます' };
  }
  
  user.scheduleStartDate = startDate;
  user.schedule = schedule;
  
  // facilities配列も更新（互換性のため）
  const facilitySet = new Set(Object.values(schedule).filter(f => f));
  user.facilities = Array.from(facilitySet);
  
  if (saveUsers(data)) {
    return { success: true, startDate, schedule };
  }
  return { success: false, error: '保存に失敗しました' };
}

/**
 * 学生の実習スケジュールを取得
 * @param {string} userId - ユーザーID
 */
function getStudentSchedule(userId) {
  const data = loadUsers();
  const user = data.users.find(u => u.id === userId);
  
  if (!user) {
    return null;
  }
  
  return {
    startDate: user.scheduleStartDate || null,
    schedule: user.schedule || null
  };
}

module.exports = {
  registerUser,
  login,
  validateSession,
  logout,
  getAllUsers,
  deleteUser,
  changePassword,
  resetPassword,
  toggleTestFlag,
  ensureAdminExists,
  getUserByUsername,
  getStudentsByFacilities,
  updateStudentSchedule,
  getStudentSchedule
};

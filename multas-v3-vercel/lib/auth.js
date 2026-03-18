/**
 * 認証ユーティリティ
 * メモリキャッシュ + 非同期I/O による高速認証
 *
 * 改善点:
 * - ユーザーデータをメモリキャッシュし、毎回のファイル読み込みを排除
 * - セッションをインメモリ管理（ファイルI/O不要）
 * - ensureAdminExists は起動時1回のみ実行
 * - ファイル書き込みは非同期 + デバウンスで統合
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// =============================================================================
// メモリキャッシュ
// =============================================================================

/** @type {{ users: Array, sessions: Object } | null} */
let cache = null;

/** @type {boolean} */
let adminChecked = false;

/** @type {NodeJS.Timeout | null} */
let saveTimer = null;

/** @type {boolean} */
let isSaving = false;

/** 保存デバウンス間隔（ミリ秒） */
const SAVE_DEBOUNCE_MS = 500;

// =============================================================================
// パスワードハッシュ
// =============================================================================

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// =============================================================================
// キャッシュ付きデータアクセス（同期読み込みは初回のみ）
// =============================================================================

/**
 * キャッシュからデータを取得（初回のみファイルから読み込み）
 */
function getData() {
  if (cache) return cache;

  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(USERS_FILE)) {
      cache = { users: [], sessions: {} };
      fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
      return cache;
    }

    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const fileData = JSON.parse(raw);

    // ファイルからはusersのみ復元。sessionsはインメモリ管理
    // （サーバー再起動時にセッションがリセットされるのは許容。
    //   7日有効のCookieはあるが、再ログインで済む）
    cache = {
      users: fileData.users || [],
      sessions: fileData.sessions || {}
    };

    return cache;
  } catch (error) {
    console.error('Error loading users:', error);
    cache = { users: [], sessions: {} };
    return cache;
  }
}

/**
 * ユーザーデータを非同期でファイルに保存（デバウンス付き）
 * セッションデータはファイルに保存しない（インメモリのみ）
 */
function scheduleSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(async () => {
    if (isSaving) {
      // 保存中なら再スケジュール
      scheduleSave();
      return;
    }

    isSaving = true;
    try {
      const data = getData();
      // ファイルにはusersのみ保存（sessionsは除外してファイルサイズを軽量化）
      const fileData = { users: data.users };
      const json = JSON.stringify(fileData, null, 2);

      const dir = path.dirname(USERS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await fs.promises.writeFile(USERS_FILE, json, 'utf-8');
    } catch (error) {
      console.error('Error saving users:', error);
    } finally {
      isSaving = false;
    }
  }, SAVE_DEBOUNCE_MS);
}

/**
 * 即時保存（プロセス終了時など）
 */
function saveImmediateSync() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  try {
    const data = getData();
    const fileData = { users: data.users };
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(fileData, null, 2));
  } catch (error) {
    console.error('Error saving users (immediate):', error);
  }
}

// プロセス終了時にキャッシュを永続化
process.on('beforeExit', saveImmediateSync);
process.on('SIGINT', () => { saveImmediateSync(); process.exit(0); });
process.on('SIGTERM', () => { saveImmediateSync(); process.exit(0); });

// =============================================================================
// ユーザー操作
// =============================================================================

/**
 * ユーザーを登録
 */
function registerUser(username, password, role = 'student', facilities = []) {
  const data = getData();

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
  scheduleSave();

  return {
    success: true,
    user: { id: newUser.id, username: newUser.username, role: newUser.role, facilities: newUser.facilities }
  };
}

/**
 * ログイン
 */
function login(username, password) {
  const data = getData();

  const user = data.users.find(u => u.username === username);
  if (!user) {
    return { success: false, error: 'ユーザー名またはパスワードが正しくありません' };
  }

  if (!verifyPassword(password, user.salt, user.hash)) {
    return { success: false, error: 'ユーザー名またはパスワードが正しくありません' };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  data.sessions[token] = {
    userId: user.id,
    username: user.username,
    role: user.role,
    facilities: user.facilities || [],
    expiresAt
  };

  // セッション作成時はファイル保存不要（インメモリ管理）

  return {
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role, facilities: user.facilities || [] }
  };
}

/**
 * セッション検証（純粋なメモリ操作、ファイルI/Oゼロ）
 */
function validateSession(token) {
  if (!token) return null;

  const data = getData();
  const session = data.sessions[token];

  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    delete data.sessions[token];
    // 期限切れ削除はメモリのみ、ファイル保存不要
    return null;
  }

  return session;
}

/**
 * ログアウト
 */
function logout(token) {
  const data = getData();

  if (data.sessions[token]) {
    delete data.sessions[token];
  }

  return { success: true };
}

/**
 * 全ユーザー取得（管理者用）
 */
function getAllUsers() {
  const data = getData();
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
  const data = getData();

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

  scheduleSave();
  return { success: true, deletedUser: user.username };
}

/**
 * テストユーザーフラグの切り替え（管理者用）
 */
function toggleTestFlag(userId) {
  const data = getData();
  const user = data.users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }
  user.isTest = !user.isTest;
  scheduleSave();
  return { success: true, isTest: user.isTest, username: user.username };
}

/**
 * パスワード変更
 */
function changePassword(userId, currentPassword, newPassword) {
  const data = getData();

  const user = data.users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }

  if (!verifyPassword(currentPassword, user.salt, user.hash)) {
    return { success: false, error: '現在のパスワードが正しくありません' };
  }

  const { salt, hash } = hashPassword(newPassword);
  user.salt = salt;
  user.hash = hash;

  scheduleSave();
  return { success: true };
}

/**
 * 管理者によるパスワードリセット（現在のパスワード不要）
 */
function resetPassword(userId, newPassword) {
  const data = getData();

  const user = data.users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }

  const { salt, hash } = hashPassword(newPassword);
  user.salt = salt;
  user.hash = hash;

  scheduleSave();
  return { success: true };
}

/**
 * 初期管理者の作成（起動時1回のみ）
 * 2回目以降の呼び出しは即座にreturn（ファイルI/Oゼロ）
 */
function ensureAdminExists() {
  if (adminChecked) return;
  adminChecked = true;

  const data = getData();
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
 */
function getUserByUsername(username) {
  const data = getData();
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
 */
function getStudentsByFacilities(facilityIds) {
  const data = getData();
  return data.users
    .filter(u => {
      if (u.role !== 'student') return false;
      if (u.schedule) {
        return Object.values(u.schedule).some(f => facilityIds.includes(f));
      }
      if (u.facilities) {
        return u.facilities.some(f => facilityIds.includes(f));
      }
      return false;
    })
    .map(u => u.username);
}

/**
 * 学生の実習スケジュールを更新
 */
function updateStudentSchedule(userId, startDate, schedule) {
  const data = getData();
  const user = data.users.find(u => u.id === userId);

  if (!user) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }

  if (user.role !== 'student') {
    return { success: false, error: '学生のみスケジュールを設定できます' };
  }

  user.scheduleStartDate = startDate;
  user.schedule = schedule;

  const facilitySet = new Set(Object.values(schedule).filter(f => f));
  user.facilities = Array.from(facilitySet);

  scheduleSave();
  return { success: true, startDate, schedule };
}

/**
 * 学生の実習スケジュールを取得
 */
function getStudentSchedule(userId) {
  const data = getData();
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

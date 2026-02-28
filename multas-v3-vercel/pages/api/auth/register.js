/**
 * ユーザー登録API（管理者専用）
 * POST /api/auth/register
 */

import { registerUser, validateSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // 管理者認証チェック
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  
  const session = validateSession(token);
  
  if (!session || session.role !== 'admin') {
    return res.status(403).json({ success: false, error: '管理者権限が必要です' });
  }

  const { username, password, role = 'student', facilities = [] } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'ユーザー名とパスワードを入力してください' });
  }

  if (password.length < 4) {
    return res.status(400).json({ success: false, error: 'パスワードは4文字以上で設定してください' });
  }

  // 施設ユーザーは施設IDが必須
  if (role === 'facility' && (!facilities || facilities.length === 0)) {
    return res.status(400).json({ success: false, error: '協力施設ユーザーには施設の選択が必要です' });
  }

  const result = registerUser(username, password, role, facilities);

  if (result.success) {
    return res.status(201).json({
      success: true,
      user: result.user
    });
  }

  return res.status(400).json({ success: false, error: result.error });
}

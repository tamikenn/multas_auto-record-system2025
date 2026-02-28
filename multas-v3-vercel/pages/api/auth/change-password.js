/**
 * パスワード変更API
 * POST /api/auth/change-password
 */

import { validateSession, changePassword } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // セッション確認
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  
  const session = validateSession(token);
  
  if (!session) {
    return res.status(401).json({ success: false, error: '認証が必要です' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: '現在のパスワードと新しいパスワードを入力してください' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ success: false, error: '新しいパスワードは4文字以上で入力してください' });
  }

  const result = changePassword(session.userId, currentPassword, newPassword);

  if (result.success) {
    return res.status(200).json({ success: true, message: 'パスワードを変更しました' });
  }

  return res.status(400).json({ success: false, error: result.error });
}

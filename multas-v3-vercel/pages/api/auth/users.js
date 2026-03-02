/**
 * ユーザー管理API（管理者専用）
 * GET /api/auth/users - 全ユーザー取得
 * DELETE /api/auth/users - ユーザー削除
 */

import { getAllUsers, deleteUser, validateSession, resetPassword, toggleTestFlag } from '../../../lib/auth';

export default async function handler(req, res) {
  // 管理者認証チェック
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  
  const session = validateSession(token);
  
  if (!session || session.role !== 'admin') {
    return res.status(403).json({ success: false, error: '管理者権限が必要です' });
  }

  if (req.method === 'GET') {
    const users = getAllUsers();
    return res.status(200).json({ success: true, users });
  }

  if (req.method === 'DELETE') {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'ユーザーIDが必要です' });
    }

    // 自分自身は削除できない
    if (userId === session.userId) {
      return res.status(400).json({ success: false, error: '自分自身は削除できません' });
    }

    const result = deleteUser(userId);
    
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  }

  if (req.method === 'PUT') {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, error: 'ユーザーIDと新しいパスワードが必要です' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'パスワードは4文字以上で設定してください' });
    }

    const result = resetPassword(userId, newPassword);
    
    if (result.success) {
      return res.status(200).json({ success: true, message: 'パスワードを変更しました' });
    }
    return res.status(400).json(result);
  }

  if (req.method === 'PATCH') {
    const { userId, action } = req.body;

    if (action === 'toggleTest' && userId) {
      const result = toggleTestFlag(userId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    }

    return res.status(400).json({ success: false, error: '不正なリクエストです' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

/**
 * ログインAPI
 * POST /api/auth/login
 */

import { login, ensureAdminExists } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // 初期管理者の確認
  ensureAdminExists();

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'ユーザー名とパスワードを入力してください' });
  }

  const result = login(username, password);

  if (result.success) {
    // セッショントークンをCookieに設定（HTTPS環境ではSecureフラグを追加）
    const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.headers.host?.includes('trycloudflare.com');
    const cookieOptions = `auth_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${isSecure ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookieOptions);
    return res.status(200).json({
      success: true,
      user: result.user
    });
  }

  return res.status(401).json({ success: false, error: result.error });
}

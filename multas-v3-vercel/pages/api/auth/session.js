/**
 * セッション確認API
 * GET /api/auth/session
 */

import { validateSession, ensureAdminExists } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // 初期管理者の確認
  ensureAdminExists();

  // Cookieからトークン取得
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  if (!token) {
    return res.status(200).json({ success: false, authenticated: false });
  }

  const session = validateSession(token);

  if (session) {
    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: session.userId,
        username: session.username,
        role: session.role
      }
    });
  }

  return res.status(200).json({ success: false, authenticated: false });
}

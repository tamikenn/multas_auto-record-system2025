/**
 * ログアウトAPI
 * POST /api/auth/logout
 */

import { logout } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Cookieからトークン取得
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  if (token) {
    logout(token);
  }

  // Cookieをクリア
  res.setHeader('Set-Cookie', 'auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  
  return res.status(200).json({ success: true });
}

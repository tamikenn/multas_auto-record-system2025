/**
 * 登録済み学生一覧取得API
 * GET /api/get-students
 */

import { getAllUsers, validateSession } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // セッション確認（教員・管理者のみ）
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  
  const session = validateSession(token);
  
  if (!session) {
    return res.status(401).json({ success: false, error: '認証が必要です' });
  }
  
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return res.status(403).json({ success: false, error: '権限がありません' });
  }

  try {
    const allUsers = getAllUsers();
    
    // 施設の並び順（固定）
    const facilityOrder = ['Rishiri', 'Rebun', 'Nayoro', 'Shimizu', 'Sarabetsu'];
    
    // 学生のみをフィルタリング
    const students = allUsers
      .filter(user => user.role === 'student' && !user.isTest)
      .map(user => {
        const primaryFacility = user.schedule?.day1 || user.facilities?.[0] || null;
        return {
          id: user.id,
          username: user.username,
          scheduleStartDate: user.scheduleStartDate || null,
          schedule: user.schedule || null,
          primaryFacility,
          createdAt: user.createdAt
        };
      })
      .sort((a, b) => {
        const orderA = a.primaryFacility ? facilityOrder.indexOf(a.primaryFacility) : 999;
        const orderB = b.primaryFacility ? facilityOrder.indexOf(b.primaryFacility) : 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.username.localeCompare(b.username);
      });

    return res.status(200).json({
      success: true,
      students,
      total: students.length
    });

  } catch (error) {
    console.error('Error getting students:', error);
    return res.status(500).json({
      success: false,
      error: 'サーバーエラー'
    });
  }
}

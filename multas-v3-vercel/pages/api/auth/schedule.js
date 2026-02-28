/**
 * 実習スケジュール設定API
 * GET /api/auth/schedule - スケジュール取得
 * POST /api/auth/schedule - スケジュール保存
 */

import { validateSession, updateStudentSchedule, getStudentSchedule } from '../../../lib/auth';

export default async function handler(req, res) {
  // セッション確認
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  
  const session = validateSession(token);
  
  if (!session) {
    return res.status(401).json({ success: false, error: '認証が必要です' });
  }

  if (session.role !== 'student') {
    return res.status(403).json({ success: false, error: '学生のみスケジュールを設定できます' });
  }

  if (req.method === 'GET') {
    const data = getStudentSchedule(session.userId);
    return res.status(200).json({ 
      success: true, 
      startDate: data?.startDate || null,
      schedule: data?.schedule || null,
      hasSchedule: !!(data?.schedule)
    });
  }

  if (req.method === 'POST') {
    const { startDate, schedule } = req.body;

    if (!startDate) {
      return res.status(400).json({ success: false, error: '実習開始日を入力してください' });
    }

    // 月曜日チェック
    const date = new Date(startDate);
    if (date.getDay() !== 1) {
      return res.status(400).json({ success: false, error: '実習開始日は月曜日を選択してください' });
    }

    if (!schedule || typeof schedule !== 'object') {
      return res.status(400).json({ success: false, error: 'スケジュールを入力してください' });
    }

    // 少なくとも1日は設定されているか確認
    const hasAnyFacility = Object.values(schedule).some(f => f);
    if (!hasAnyFacility) {
      return res.status(400).json({ success: false, error: '少なくとも1日分の実習先を選択してください' });
    }

    const result = updateStudentSchedule(session.userId, startDate, schedule);

    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        startDate: result.startDate,
        schedule: result.schedule 
      });
    }
    return res.status(400).json({ success: false, error: result.error });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

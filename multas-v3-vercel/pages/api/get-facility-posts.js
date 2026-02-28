/**
 * 施設ユーザー用投稿取得API
 * GET /api/get-facility-posts
 * 
 * 施設ユーザーは自施設に所属する学生の投稿のみ閲覧可能
 * スケジュール情報も返す（日付ベースでの表示用）
 */

import { validateSession, getStudentsByFacilities, getAllUsers } from '../../lib/auth';
import { getStorageSync } from '../../lib/server-storage';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

  // 施設ユーザー以外はアクセス不可
  if (session.role !== 'facility') {
    return res.status(403).json({ success: false, error: '施設ユーザー専用のAPIです' });
  }

  // 施設に所属する学生のユーザー名を取得
  const facilities = session.facilities || [];
  if (facilities.length === 0) {
    return res.status(200).json({ 
      success: true, 
      posts: [],
      message: '所属施設が設定されていません'
    });
  }

  const studentUsernames = getStudentsByFacilities(facilities);
  
  // 学生のスケジュール情報を取得
  const allUsers = getAllUsers();
  const studentSchedules = {};
  allUsers
    .filter(u => u.role === 'student' && studentUsernames.includes(u.username))
    .forEach(u => {
      studentSchedules[u.username] = {
        startDate: u.scheduleStartDate,
        schedule: u.schedule
      };
    });

  if (studentUsernames.length === 0) {
    return res.status(200).json({ 
      success: true, 
      posts: [],
      students: [],
      studentSchedules: {},
      message: '該当する学生がいません'
    });
  }

  try {
    const storage = getStorageSync();
    const allPosts = await storage.getAllPosts();
    
    // 学生のユーザー名でフィルタリング
    const filteredPosts = allPosts.filter(post => 
      studentUsernames.includes(post.userName)
    );

    // 学生ごとにグルーピング
    const postsByStudent = {};
    studentUsernames.forEach(username => {
      postsByStudent[username] = filteredPosts.filter(p => p.userName === username);
    });

    return res.status(200).json({
      success: true,
      posts: filteredPosts,
      students: studentUsernames,
      studentSchedules,
      postsByStudent,
      facilities
    });
  } catch (error) {
    console.error('Error fetching facility posts:', error);
    return res.status(500).json({ 
      success: false, 
      error: '投稿の取得に失敗しました' 
    });
  }
}

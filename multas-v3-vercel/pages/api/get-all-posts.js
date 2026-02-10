/**
 * @fileoverview 投稿取得API
 * 全投稿またはユーザー別の投稿を取得
 */

import { getHybridStorage } from '../../lib/hybrid-storage.js';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('API:get-all-posts');

/**
 * 学生別の統計情報を計算
 * @param {Array<Object>} posts - 投稿リスト
 * @returns {Array<Object>}
 */
function calculateStudentStats(posts) {
  const statsMap = new Map();

  posts.forEach(post => {
    const { userName, timestamp } = post;
    
    if (!statsMap.has(userName)) {
      statsMap.set(userName, {
        userName,
        postCount: 0,
        lastPostDate: null,
        firstPostDate: null,
      });
    }

    const stats = statsMap.get(userName);
    stats.postCount++;

    const postDate = new Date(timestamp);
    if (!isNaN(postDate.getTime())) {
      if (!stats.lastPostDate || postDate > new Date(stats.lastPostDate)) {
        stats.lastPostDate = timestamp;
      }
      if (!stats.firstPostDate || postDate < new Date(stats.firstPostDate)) {
        stats.firstPostDate = timestamp;
      }
    }
  });

  return Array.from(statsMap.values());
}

/**
 * 投稿を日付順にソート（新しい順）
 * @param {Array<Object>} posts - 投稿リスト
 * @returns {Array<Object>}
 */
function sortPostsByDate(posts) {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB - dateA;
  });
}

/**
 * GET /api/get-all-posts
 * 
 * @param {Object} req.query
 * @param {string} [req.query.userName] - 特定ユーザーの投稿のみ取得
 * @param {number} [req.query.limit] - 取得件数制限
 * @param {number} [req.query.offset] - オフセット
 * 
 * @returns {Object}
 * @returns {boolean} success - 成功したかどうか
 * @returns {Array<Object>} posts - 投稿リスト
 * @returns {Array<Object>} studentStats - 学生別統計
 * @returns {number} totalPosts - 総投稿数
 * @returns {number} totalStudents - 総学生数
 * @returns {string} source - データソース
 */
export default async function handler(req, res) {
  // メソッドチェック
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET'],
    });
  }

  try {
    const hybridStorage = getHybridStorage();
    const { userName, limit, offset } = req.query;

    // 投稿を取得
    let posts;
    if (userName) {
      logger.debug(`ユーザー別取得: ${userName}`);
      posts = await hybridStorage.loadUserPosts(userName);
    } else {
      logger.debug('全投稿取得');
      posts = await hybridStorage.loadAllPosts();
    }

    // ソート
    posts = sortPostsByDate(posts);

    // 統計情報を計算
    const studentStats = calculateStudentStats(posts);

    // ページネーション（オプション）
    const totalPosts = posts.length;
    if (offset || limit) {
      const start = parseInt(offset, 10) || 0;
      const count = parseInt(limit, 10) || posts.length;
      posts = posts.slice(start, start + count);
    }

    logger.info(`取得完了: ${posts.length}件（全${totalPosts}件）`);

    return res.status(200).json({
      success: true,
      posts,
      studentStats,
      totalPosts,
      totalStudents: studentStats.length,
      source: 'Excel',
    });

  } catch (error) {
    logger.error('データ取得エラー', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'データ取得エラー',
      message: error.message,
    });
  }
}

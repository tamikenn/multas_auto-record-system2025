/**
 * @fileoverview 投稿削除API
 * 投稿をExcelから削除
 */

import { getStorageSync } from '../../lib/server-storage.js';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('API:delete-post');

/**
 * POST /api/delete-post
 * 
 * @param {Object} req.body
 * @param {string} req.body.postId - 削除する投稿のID（必須）
 * @param {string} [req.body.userName] - ユーザー名（検証用）
 * 
 * @returns {Object}
 * @returns {boolean} success - 成功したかどうか
 * @returns {string} message - メッセージ
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['POST'],
    });
  }

  const { postId, userName } = req.body;

  if (!postId) {
    return res.status(400).json({ 
      success: false,
      error: '投稿IDが必要です',
    });
  }

  try {
    const storage = getStorageSync();
    
    logger.info(`投稿削除: ${postId} (user: ${userName || 'unknown'})`);

    const deleted = await storage.deletePost(postId);

    if (deleted) {
      return res.status(200).json({
        success: true,
        message: '投稿を削除しました',
        postId,
      });
    } else {
      return res.status(404).json({
        success: false,
        error: '投稿が見つかりませんでした',
        postId,
      });
    }

  } catch (error) {
    logger.error('削除エラー', error);
    
    return res.status(500).json({ 
      success: false,
      error: '投稿の削除に失敗しました',
      message: error.message,
    });
  }
}

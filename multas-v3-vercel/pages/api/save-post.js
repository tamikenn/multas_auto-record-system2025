/**
 * @fileoverview 投稿保存API
 * 投稿をExcelに保存し、Google Sheetsにバックグラウンド同期
 */

import { getStorageSync } from '../../lib/server-storage.js';
import { createLogger } from '../../lib/logger.js';
import { 
  DEFAULT_USER_NAME, 
  getJapanTimestamp, 
  generateId,
  isValidCategory,
  DEFAULT_CATEGORY,
} from '../../lib/config.js';

const logger = createLogger('API:save-post');

/**
 * 投稿データのバリデーション
 * @param {Object} body - リクエストボディ
 * @returns {{valid: boolean, errors: string[], data: Object}}
 */
function validatePostData(body) {
  const errors = [];
  
  // テキストの検証
  if (!body.text || typeof body.text !== 'string') {
    errors.push('テキストが必要です');
  } else if (body.text.trim().length === 0) {
    errors.push('テキストが空です');
  } else if (body.text.length > 10000) {
    errors.push('テキストが長すぎます（最大10000文字）');
  }

  // カテゴリの検証（オプション）
  let category = body.category;
  if (category !== undefined && category !== null) {
    category = parseInt(category, 10);
    if (isNaN(category) || !isValidCategory(category)) {
      category = DEFAULT_CATEGORY;
    }
  } else {
    category = 0; // 未分類
  }

  // ユーザー名の検証（オプション）
  let userName = body.userName;
  if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
    userName = DEFAULT_USER_NAME;
  } else if (userName.length > 100) {
    userName = userName.substring(0, 100);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      text: body.text?.trim() || '',
      category,
      reason: body.reason || '',
      userName: userName.trim(),
      id: body.id || null,
    },
  };
}

/**
 * POST /api/save-post
 * 
 * @param {Object} req.body
 * @param {string} req.body.text - 投稿テキスト（必須）
 * @param {number} [req.body.category] - カテゴリ番号 (1-12)
 * @param {string} [req.body.reason] - 分類理由
 * @param {string} [req.body.userName] - ユーザー名
 * @param {string} [req.body.id] - 既存投稿のID（更新時）
 * 
 * @returns {Object}
 * @returns {boolean} success - 成功したかどうか
 * @returns {Object} post - 保存された投稿データ
 * @returns {number} rowNumber - Excel行番号
 * @returns {boolean} synced - Google Sheetsに同期済みか
 * @returns {string} message - メッセージ
 */
export default async function handler(req, res) {
  // メソッドチェック
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['POST'],
    });
  }

  // バリデーション
  const validation = validatePostData(req.body);
  
  if (!validation.valid) {
    logger.warn('バリデーションエラー', validation.errors);
    return res.status(400).json({ 
      success: false,
      errors: validation.errors,
    });
  }

  const { text, category, reason, userName, id } = validation.data;

  try {
    const storage = getStorageSync();
    const timestamp = getJapanTimestamp();

    // 投稿データを準備
    const post = {
      id: id || generateId('post'),
      timestamp,
      userName,
      text,
      category,
      reason,
      date: timestamp,
    };

    logger.info(`投稿保存: ${userName} - "${text.substring(0, 30)}..."`);

    // HybridStorageを使用して保存
    const result = await storage.addPost(post);

    logger.debug('保存結果', result);

    return res.status(201).json({
      success: true,
      post,
      rowNumber: result.rowNumber,
      synced: result.synced,
      message: '投稿を保存しました',
    });

  } catch (error) {
    logger.error('保存エラー', error);
    
    // エラー時は500を返す（200を返さない）
    return res.status(500).json({ 
      success: false,
      error: '投稿の保存に失敗しました',
      message: error.message,
    });
  }
}

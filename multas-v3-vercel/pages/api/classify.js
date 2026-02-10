/**
 * @fileoverview 分類API
 * テキストを12時計分類で分類するエンドポイント
 */

import { classify, getProviderStatus } from '../../lib/ai-providers.js';
import { createLogger } from '../../lib/logger.js';
import { DEFAULT_CATEGORY } from '../../lib/config.js';

const logger = createLogger('API:classify');

/**
 * POST /api/classify
 * 
 * @param {Object} req.body
 * @param {string} req.body.text - 分類対象のテキスト
 * 
 * @returns {Object}
 * @returns {boolean} success - 成功したかどうか
 * @returns {number} category - カテゴリ番号 (1-12)
 * @returns {string} reason - 分類理由
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

  // 入力バリデーション
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'テキストが必要です',
    });
  }

  if (text.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'テキストが空です',
    });
  }

  try {
    logger.info(`分類リクエスト: "${text.substring(0, 50)}..."`);
    
    // AI分類を実行
    const result = await classify(text);
    
    logger.debug('分類結果', result);

    return res.status(200).json({
      success: true,
      category: result.category,
      reason: result.reason,
      provider: result.provider,
    });

  } catch (error) {
    logger.error('分類処理エラー', error);
    
    // エラー時もフォールバックカテゴリを返す
    return res.status(500).json({ 
      success: false,
      error: 'AI分類に失敗しました',
      category: DEFAULT_CATEGORY,
      reason: `エラー: ${error.message}`,
      debug: getProviderStatus(),
    });
  }
}

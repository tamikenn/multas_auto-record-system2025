/**
 * @fileoverview AI分類プロバイダー
 * 複数のAI APIを統一インターフェースで管理
 */

import {
  AI_PROVIDER,
  LOCAL_LLM_CONFIG,
  OPENAI_CONFIG,
  CLAUDE_CONFIG,
  CATEGORIES,
  DEFAULT_CATEGORY,
  isValidCategory,
  getClassificationPrompt,
  CLASSIFICATION_SYSTEM_PROMPT,
} from './config.js';
import { createLogger } from './logger.js';

const logger = createLogger('AIProvider');

/**
 * @typedef {Object} ClassificationResult
 * @property {boolean} success - 成功したかどうか
 * @property {number} category - カテゴリ番号 (1-12)
 * @property {string} reason - 分類理由
 * @property {'local' | 'openai' | 'claude' | 'keyword' | 'fallback'} provider - 使用したプロバイダー
 */

/**
 * レスポンスからカテゴリ番号を抽出
 * @param {string} content - AIのレスポンス
 * @returns {number} カテゴリ番号
 */
function extractCategory(content) {
  const match = content.match(/(\d+)/);
  const category = match ? parseInt(match[1], 10) : DEFAULT_CATEGORY;
  return isValidCategory(category) ? category : DEFAULT_CATEGORY;
}

/**
 * キーワードベースの分類（フォールバック用）
 * @param {string} text - 分類対象テキスト
 * @returns {ClassificationResult}
 */
export function classifyByKeywords(text) {
  const lowerText = text.toLowerCase();
  
  for (const category of CATEGORIES) {
    if (category.keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return {
        success: true,
        category: category.id,
        reason: `キーワード分類: ${category.name}`,
        provider: 'keyword',
      };
    }
  }

  return {
    success: true,
    category: DEFAULT_CATEGORY,
    reason: 'デフォルト分類: コミュニケーション',
    provider: 'fallback',
  };
}

/**
 * LocalLLM (Ollama) で分類
 * @param {string} text - 分類対象テキスト
 * @returns {Promise<ClassificationResult>}
 */
async function classifyWithLocalLLM(text) {
  const { apiUrl, classifyModel, timeout } = LOCAL_LLM_CONFIG;
  const prompt = getClassificationPrompt(text);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: classifyModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 10,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.response?.trim() || '';
    const category = extractCategory(content);

    return {
      success: true,
      category,
      reason: `LocalLLM分類: カテゴリ${category}`,
      provider: 'local',
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * OpenAI で分類
 * @param {string} text - 分類対象テキスト
 * @returns {Promise<ClassificationResult>}
 */
async function classifyWithOpenAI(text) {
  // Dynamic import to avoid issues when OpenAI is not configured
  const OpenAI = (await import('openai')).default;
  
  const openai = new OpenAI({
    apiKey: OPENAI_CONFIG.apiKey,
  });

  const prompt = getClassificationPrompt(text);

  const response = await openai.chat.completions.create({
    model: OPENAI_CONFIG.classifyModel,
    messages: [
      { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: OPENAI_CONFIG.temperature,
    max_tokens: OPENAI_CONFIG.maxTokens,
  });

  const content = response.choices[0]?.message?.content?.trim() || '';
  const category = extractCategory(content);

  return {
    success: true,
    category,
    reason: `OpenAI分類: カテゴリ${category}`,
    provider: 'openai',
  };
}

/**
 * Claude で分類
 * @param {string} text - 分類対象テキスト
 * @returns {Promise<ClassificationResult>}
 */
async function classifyWithClaude(text) {
  const prompt = getClassificationPrompt(text);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_CONFIG.apiKey,
      'anthropic-version': CLAUDE_CONFIG.apiVersion,
    },
    body: JSON.stringify({
      model: CLAUDE_CONFIG.model,
      max_tokens: 10,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text?.trim() || '';
  const category = extractCategory(content);

  return {
    success: true,
    category,
    reason: `Claude分類: カテゴリ${category}`,
    provider: 'claude',
  };
}

/**
 * テキストを12時計分類で分類
 * 設定されたプロバイダーを使用し、失敗時はフォールバック
 * 
 * @param {string} text - 分類対象テキスト
 * @returns {Promise<ClassificationResult>}
 */
export async function classify(text) {
  const endTimer = logger.time('Classification');

  try {
    let result;

    switch (AI_PROVIDER) {
      case 'local':
        logger.debug('LocalLLM で分類実行');
        result = await classifyWithLocalLLM(text);
        break;

      case 'claude':
        if (!CLAUDE_CONFIG.apiKey) {
          logger.warn('Claude APIキー未設定、LocalLLMにフォールバック');
          result = await classifyWithLocalLLM(text);
        } else {
          logger.debug('Claude で分類実行');
          result = await classifyWithClaude(text);
        }
        break;

      case 'openai':
      default:
        if (!OPENAI_CONFIG.apiKey) {
          logger.warn('OpenAI APIキー未設定、LocalLLMにフォールバック');
          result = await classifyWithLocalLLM(text);
        } else {
          logger.debug('OpenAI で分類実行');
          result = await classifyWithOpenAI(text);
        }
        break;
    }

    logger.info(`分類完了: カテゴリ${result.category} (${result.provider})`);
    endTimer();
    return result;

  } catch (error) {
    logger.error('AI分類エラー、キーワード分類にフォールバック', error);
    endTimer();
    return classifyByKeywords(text);
  }
}

/**
 * AIプロバイダーの状態を取得
 * @returns {Object}
 */
export function getProviderStatus() {
  return {
    currentProvider: AI_PROVIDER,
    localLLM: {
      configured: true,
      url: LOCAL_LLM_CONFIG.apiUrl,
      model: LOCAL_LLM_CONFIG.classifyModel,
    },
    openai: {
      configured: !!OPENAI_CONFIG.apiKey,
      model: OPENAI_CONFIG.classifyModel,
    },
    claude: {
      configured: !!CLAUDE_CONFIG.apiKey,
      model: CLAUDE_CONFIG.model,
    },
  };
}

// 後方互換性のためのクラスエクスポート
export class AIClassifier {
  constructor() {
    this.provider = AI_PROVIDER;
  }

  async classify(text) {
    return classify(text);
  }

  getKeywordBasedClassification(text) {
    return classifyByKeywords(text);
  }

  getFallbackClassification(text) {
    return classifyByKeywords(text);
  }

  getPrompt(text) {
    return getClassificationPrompt(text);
  }
}

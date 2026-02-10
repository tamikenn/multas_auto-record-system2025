/**
 * @fileoverview アプリケーション設定ファイル
 * すべての定数、設定値を一元管理
 */

import path from 'path';

// =============================================================================
// 環境設定
// =============================================================================

/**
 * 実行環境
 * @type {'development' | 'production' | 'test'}
 */
export const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * 開発モードかどうか
 */
export const isDevelopment = NODE_ENV === 'development';

/**
 * 本番モードかどうか
 */
export const isProduction = NODE_ENV === 'production';

// =============================================================================
// データストレージ設定
// =============================================================================

/**
 * データディレクトリのパス
 */
export const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Excelファイルのパス
 */
export const EXCEL_FILE_PATH = path.join(DATA_DIR, 'multas_posts.xlsx');

/**
 * バックアップディレクトリのパス
 */
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');

/**
 * バックアップ設定
 */
export const BACKUP_CONFIG = {
  /** バックアップの最大保持日数 */
  maxAgeDays: 30,
  /** 最低保持するバックアップ数 */
  minKeepCount: 3,
  /** バックアップ作成の最小間隔（ミリ秒） */
  minIntervalMs: 60000, // 1分
};

// =============================================================================
// Excel列定義
// =============================================================================

/**
 * Excel列の定義
 * @type {Array<{header: string, key: string, width: number, index: number}>}
 */
export const EXCEL_COLUMNS = [
  { header: 'ID', key: 'id', width: 15, index: 1 },
  { header: 'タイムスタンプ', key: 'timestamp', width: 20, index: 2 },
  { header: 'ユーザー名', key: 'userName', width: 15, index: 3 },
  { header: '投稿内容', key: 'text', width: 50, index: 4 },
  { header: 'カテゴリ', key: 'category', width: 10, index: 5 },
  { header: '分類理由', key: 'reason', width: 30, index: 6 },
  { header: '日付', key: 'date', width: 15, index: 7 },
];

/**
 * キーから列インデックスを取得するマップ
 */
export const COLUMN_INDEX_MAP = EXCEL_COLUMNS.reduce((map, col) => {
  map[col.key] = col.index;
  return map;
}, {});

// =============================================================================
// AI設定
// =============================================================================

/**
 * AIプロバイダーの種類
 * @type {'local' | 'openai' | 'claude'}
 */
export const AI_PROVIDER = process.env.AI_PROVIDER || 'local';

/**
 * LocalLLM (Ollama) 設定
 */
export const LOCAL_LLM_CONFIG = {
  apiUrl: process.env.LOCAL_LLM_API_URL || 'http://localhost:11434/api/generate',
  classifyModel: process.env.LOCAL_LLM_MODEL_CLASSIFY || 'qwen2.5:7b',
  reportModel: process.env.LOCAL_LLM_MODEL_REPORT || 'qwen2.5:14b',
  timeout: 120000, // 2分
};

/**
 * OpenAI設定
 */
export const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  classifyModel: 'gpt-3.5-turbo',
  reportModel: 'gpt-4',
  temperature: 0.1,
  maxTokens: 10,
};

/**
 * Claude設定
 */
export const CLAUDE_CONFIG = {
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'claude-3-haiku-20240307',
  apiVersion: '2023-06-01',
};

/**
 * デフォルトカテゴリ（フォールバック用）
 */
export const DEFAULT_CATEGORY = 8; // コミュニケーション

// =============================================================================
// 12時計分類カテゴリ定義
// =============================================================================

/**
 * @typedef {Object} Category
 * @property {number} id - カテゴリID (1-12)
 * @property {string} name - カテゴリ名
 * @property {string} description - 説明
 * @property {string[]} keywords - キーワード（フォールバック分類用）
 */

/**
 * 12時計分類カテゴリ
 * @type {Category[]}
 */
export const CATEGORIES = [
  { id: 1, name: '医療倫理', description: 'インフォームドコンセント、患者の権利、守秘義務', keywords: ['倫理', 'インフォームドコンセント', '患者の権利', '守秘義務', '同意'] },
  { id: 2, name: '地域医療', description: '地域包括ケア、在宅医療、地域連携', keywords: ['地域', '在宅', '地域包括', '地域連携', '訪問'] },
  { id: 3, name: '医学知識', description: '病態生理、薬理、診断基準', keywords: ['病態', '薬理', '診断', '疾患', '症状', '治療'] },
  { id: 4, name: '診察・手技', description: '身体診察、医療手技、検査手法', keywords: ['診察', '手技', '検査', '聴診', '触診', '測定', 'バイタル'] },
  { id: 5, name: '問題解決能力', description: '分析力、思考力、判断力', keywords: ['分析', '思考', '判断', '問題解決', '考察'] },
  { id: 6, name: '統合的臨床', description: '複数要素を含む臨床対応', keywords: ['統合', '複合', '総合的', '包括'] },
  { id: 7, name: '多職種連携', description: 'チーム医療、院内連携', keywords: ['チーム', '多職種', '連携', '協働', 'カンファレンス'] },
  { id: 8, name: 'コミュニケーション', description: '傾聴、共感、説明、信頼関係', keywords: ['コミュニケーション', '傾聴', '共感', '説明', '会話', '寄り添'] },
  { id: 9, name: '一般教養', description: '医学以外の知識', keywords: ['教養', '一般', '文化', '歴史'] },
  { id: 10, name: '保健・福祉', description: '社会的サポート、福祉制度、介護', keywords: ['福祉', '介護', 'ソーシャル', '支援', '制度'] },
  { id: 11, name: '行政', description: '病院間連携、紹介', keywords: ['行政', '紹介', '病院間', '転院'] },
  { id: 12, name: '社会医学/公衆衛生', description: '地域保健、予防医学', keywords: ['公衆衛生', '予防', '地域保健', '感染対策'] },
];

/**
 * カテゴリIDからカテゴリを取得
 * @param {number} id - カテゴリID
 * @returns {Category | undefined}
 */
export function getCategoryById(id) {
  return CATEGORIES.find(cat => cat.id === id);
}

/**
 * カテゴリIDが有効かどうかを確認
 * @param {number} id - カテゴリID
 * @returns {boolean}
 */
export function isValidCategory(id) {
  return id >= 1 && id <= 12;
}

// =============================================================================
// プロンプトテンプレート
// =============================================================================

/**
 * 分類用プロンプトを生成
 * @param {string} text - 分類対象のテキスト
 * @returns {string}
 */
export function getClassificationPrompt(text) {
  const categoryList = CATEGORIES
    .map(cat => `${cat.id}: ${cat.name}（${cat.description}）`)
    .join('\n');

  return `以下の医学部実習での体験を、12時計分類のいずれかに分類してください。

12時計分類:
${categoryList}

体験内容: ${text}

数字のみで回答してください（1-12）:`;
}

/**
 * 分類用システムプロンプト
 */
export const CLASSIFICATION_SYSTEM_PROMPT = 
  'あなたは医学教育の専門家です。体験内容を12時計分類で分類し、該当する数字（1-12）のみを回答してください。';

// =============================================================================
// Google Sheets設定
// =============================================================================

/**
 * Google Sheets設定
 */
export const GOOGLE_SHEETS_CONFIG = {
  credentials: process.env.GOOGLE_CREDENTIALS,
  spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
};

/**
 * 同期設定
 */
export const SYNC_CONFIG = {
  /** バッチ処理の間隔（ミリ秒） */
  batchIntervalMs: 5000,
  /** 定期同期の間隔（cron式） */
  periodicSyncCron: '*/5 * * * *',
  /** 最大リトライ回数 */
  maxRetries: 3,
  /** リトライ遅延（ミリ秒） */
  retryDelayMs: 5000,
};

// =============================================================================
// デフォルト値
// =============================================================================

/**
 * デフォルトユーザー名
 */
export const DEFAULT_USER_NAME = 'ゲストユーザー';

/**
 * タイムゾーン設定
 */
export const TIMEZONE = 'Asia/Tokyo';

/**
 * 日本時刻でフォーマットされた現在時刻を取得
 * @returns {string}
 */
export function getJapanTimestamp() {
  return new Date().toLocaleString('ja-JP', { timeZone: TIMEZONE });
}

/**
 * 一意なIDを生成
 * @param {string} prefix - プレフィックス
 * @returns {string}
 */
export function generateId(prefix = 'post') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

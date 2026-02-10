/**
 * @fileoverview ストレージファクトリ
 * 環境に応じて適切なストレージを提供
 */

import { createLogger } from './logger.js';

const logger = createLogger('Storage');

/**
 * ストレージモード
 * - 'hybrid': ローカルPC用（Excel + Google Sheets同期）
 * - 'sheets': クラウド用（Google Sheets専用）
 * @type {'hybrid' | 'sheets'}
 */
const STORAGE_MODE = process.env.STORAGE_MODE || 'hybrid';

/**
 * Vercel環境かどうかを検出
 * @returns {boolean}
 */
function isVercelEnvironment() {
  return !!process.env.VERCEL || !!process.env.VERCEL_ENV;
}

/**
 * 使用するストレージモードを決定
 * @returns {'hybrid' | 'sheets'}
 */
function getStorageMode() {
  // 明示的に指定されている場合はそれを使用
  if (process.env.STORAGE_MODE) {
    return process.env.STORAGE_MODE;
  }
  
  // Vercel環境では自動的にsheets モードに
  if (isVercelEnvironment()) {
    return 'sheets';
  }
  
  // デフォルトはhybrid
  return 'hybrid';
}

// シングルトンインスタンス
let storageInstance = null;

/**
 * ストレージインスタンスを取得
 * 環境に応じて適切なストレージを返す
 * 
 * @returns {import('./hybrid-storage.js').HybridStorage | import('./sheets-storage.js').SheetsStorage}
 */
export async function getStorage() {
  if (storageInstance) {
    return storageInstance;
  }

  const mode = getStorageMode();
  logger.info(`ストレージモード: ${mode}`);

  if (mode === 'sheets') {
    // Google Sheets専用モード（Vercel/クラウド用）
    const { getSheetsStorage } = await import('./sheets-storage.js');
    storageInstance = getSheetsStorage();
  } else {
    // ハイブリッドモード（ローカルPC用）
    const { getHybridStorage } = await import('./hybrid-storage.js');
    storageInstance = getHybridStorage();
  }

  return storageInstance;
}

/**
 * 同期的にストレージを取得（後方互換性のため）
 * 注意: 初回呼び出し時はnullを返す可能性あり
 * 
 * @returns {any}
 */
export function getStorageSync() {
  if (storageInstance) {
    return storageInstance;
  }

  const mode = getStorageMode();

  if (mode === 'sheets') {
    const { getSheetsStorage } = require('./sheets-storage.js');
    storageInstance = getSheetsStorage();
  } else {
    const { getHybridStorage } = require('./hybrid-storage.js');
    storageInstance = getHybridStorage();
  }

  return storageInstance;
}

/**
 * 現在のストレージ情報を取得
 * @returns {Object}
 */
export function getStorageInfo() {
  return {
    mode: getStorageMode(),
    isVercel: isVercelEnvironment(),
    initialized: !!storageInstance,
  };
}

/**
 * ストレージをリセット（テスト用）
 */
export function resetStorage() {
  storageInstance = null;
}

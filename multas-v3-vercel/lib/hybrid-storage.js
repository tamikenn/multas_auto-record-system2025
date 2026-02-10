/**
 * @fileoverview HybridStorage
 * Excelをプライマリストレージ、Google Sheetsをバックグラウンド同期として使用
 */

import { ExcelManager } from './excel-manager.js';
import { google } from 'googleapis';
import cron from 'node-cron';
import { 
  GOOGLE_SHEETS_CONFIG, 
  SYNC_CONFIG,
  getJapanTimestamp,
} from './config.js';
import { createLogger } from './logger.js';

const logger = createLogger('HybridStorage');

/**
 * @typedef {Object} SyncQueueItem
 * @property {Object} post - 投稿データ
 * @property {'add' | 'update' | 'delete'} operation - 操作種別
 * @property {number} retries - リトライ回数
 * @property {number} timestamp - キュー追加時刻
 */

/**
 * HybridStorage クラス
 * Excelをプライマリ、Google Sheetsをバックグラウンド同期として管理
 */
export class HybridStorage {
  constructor() {
    /** @type {ExcelManager} */
    this.excelManager = new ExcelManager();
    
    /** @type {SyncQueueItem[]} */
    this.syncQueue = [];
    
    /** @type {boolean} */
    this.isSyncing = false;
    
    /** @type {NodeJS.Timeout | null} */
    this.batchTimer = null;

    /** @type {google.auth.GoogleAuth | null} */
    this.googleAuth = null;
    
    /** @type {any} */
    this.sheets = null;
    
    /** @type {string | undefined} */
    this.spreadsheetId = GOOGLE_SHEETS_CONFIG.spreadsheetId;

    // 初期化
    this.initializeGoogleSheets();
    this.startPeriodicSync();
  }

  /**
   * Google Sheets認証を初期化
   */
  initializeGoogleSheets() {
    try {
      const { credentials, spreadsheetId } = GOOGLE_SHEETS_CONFIG;
      
      if (!credentials || !spreadsheetId) {
        logger.info('Google Sheets認証情報が設定されていません。ローカルのみで動作します。');
        return;
      }

      const parsedCredentials = JSON.parse(credentials.trim());
      this.googleAuth = new google.auth.GoogleAuth({
        credentials: parsedCredentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.googleAuth });
      logger.info('Google Sheets認証完了');
    } catch (error) {
      logger.error('Google Sheets認証エラー', error);
      this.googleAuth = null;
      this.sheets = null;
    }
  }

  /**
   * 同期キューに追加
   * @param {Object} post - 投稿データ
   * @param {'add' | 'update' | 'delete'} operation - 操作種別
   */
  addToSyncQueue(post, operation = 'add') {
    this.syncQueue.push({
      post,
      operation,
      retries: 0,
      timestamp: Date.now(),
    });

    this.resetBatchTimer();
  }

  /**
   * バッチタイマーをリセット
   */
  resetBatchTimer() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processSyncQueue();
    }, SYNC_CONFIG.batchIntervalMs);
  }

  /**
   * 同期キューを処理
   */
  async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    const batch = [...this.syncQueue];
    this.syncQueue = [];

    try {
      if (this.sheets && this.spreadsheetId) {
        await this.syncToGoogleSheets(batch);
        logger.info(`${batch.length}件をGoogle Sheetsに同期完了`);
      }
    } catch (error) {
      logger.error('同期処理エラー', error);
      
      // 失敗したアイテムをキューに戻す
      batch.forEach(item => {
        if (item.retries < SYNC_CONFIG.maxRetries) {
          item.retries++;
          this.syncQueue.push(item);
        } else {
          logger.warn(`同期失敗（最大リトライ回数到達）: ${item.post.id}`);
        }
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Google Sheetsに同期
   * @param {SyncQueueItem[]} batch - 同期するアイテムのバッチ
   */
  async syncToGoogleSheets(batch) {
    if (!this.sheets || !this.spreadsheetId) {
      return;
    }

    try {
      // スプレッドシート情報を取得
      const sheetInfo = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const firstSheetName = sheetInfo.data.sheets[0].properties.title;

      // バッチデータを準備
      const values = batch
        .filter(item => item.operation === 'add')
        .map(item => {
          const { post } = item;
          return [
            post.timestamp || getJapanTimestamp(),
            post.userName || 'ゲストユーザー',
            post.text || '',
            post.category || 0,
            post.reason || '',
          ];
        });

      if (values.length === 0) {
        return;
      }

      // データを追加
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${firstSheetName}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

    } catch (error) {
      logger.error('Google Sheets同期エラー', error);
      throw error;
    }
  }

  /**
   * 定期同期処理を開始
   */
  startPeriodicSync() {
    cron.schedule(SYNC_CONFIG.periodicSyncCron, () => {
      if (this.syncQueue.length > 0 && !this.isSyncing) {
        logger.debug(`定期同期: ${this.syncQueue.length}件のキューを処理`);
        this.processSyncQueue();
      }
    });
  }

  /**
   * 投稿を追加
   * @param {Object} post - 投稿データ
   * @returns {Promise<{success: boolean, rowNumber: number, synced: boolean}>}
   */
  async addPost(post) {
    const endTimer = logger.time('addPost');

    try {
      // 1. Excelに即座に保存（プライマリ）
      const rowNumber = await this.excelManager.addPost(post);
      logger.debug(`投稿をExcelに保存: 行${rowNumber}`);

      // 2. Google Sheets同期キューに追加（バックグラウンド）
      this.addToSyncQueue(post, 'add');

      endTimer();
      return {
        success: true,
        rowNumber,
        synced: false, // バックグラウンドで同期される
      };
    } catch (error) {
      endTimer();
      logger.error('投稿追加エラー', error);
      throw error;
    }
  }

  /**
   * 投稿を更新
   * @param {string} postId - 投稿ID
   * @param {Object} updatedData - 更新データ
   * @returns {Promise<boolean>}
   */
  async updatePost(postId, updatedData) {
    try {
      const updated = await this.excelManager.updatePost(postId, updatedData);
      
      if (updated) {
        this.addToSyncQueue({ id: postId, ...updatedData }, 'update');
      }

      return updated;
    } catch (error) {
      logger.error('投稿更新エラー', error);
      throw error;
    }
  }

  /**
   * 投稿を削除
   * @param {string} postId - 投稿ID
   * @returns {Promise<boolean>}
   */
  async deletePost(postId) {
    try {
      const deleted = await this.excelManager.deletePost(postId);
      
      if (deleted) {
        this.addToSyncQueue({ id: postId }, 'delete');
      }

      return deleted;
    } catch (error) {
      logger.error('投稿削除エラー', error);
      throw error;
    }
  }

  /**
   * 全投稿を読み込む
   * @returns {Promise<Array<Object>>}
   */
  async loadAllPosts() {
    try {
      return await this.excelManager.loadAllPosts();
    } catch (error) {
      logger.error('投稿読み込みエラー', error);
      throw error;
    }
  }

  /**
   * ユーザーごとの投稿を取得
   * @param {string} userName - ユーザー名
   * @returns {Promise<Array<Object>>}
   */
  async loadUserPosts(userName) {
    try {
      return await this.excelManager.loadUserPosts(userName);
    } catch (error) {
      logger.error('ユーザー投稿読み込みエラー', error);
      throw error;
    }
  }

  /**
   * 同期状態を取得
   * @returns {Object}
   */
  getSyncStatus() {
    return {
      queueLength: this.syncQueue.length,
      isSyncing: this.isSyncing,
      hasGoogleSheets: !!this.sheets,
    };
  }

  /**
   * 手動で同期を実行
   * @returns {Promise<void>}
   */
  async forceSync() {
    return await this.processSyncQueue();
  }

  /**
   * 統計情報を取得
   * @returns {Promise<Object>}
   */
  async getStats() {
    const excelStats = await this.excelManager.getStats();
    return {
      ...excelStats,
      syncStatus: this.getSyncStatus(),
    };
  }
}

// シングルトンインスタンス
let hybridStorageInstance = null;

/**
 * HybridStorageのシングルトンインスタンスを取得
 * @returns {HybridStorage}
 */
export function getHybridStorage() {
  if (!hybridStorageInstance) {
    hybridStorageInstance = new HybridStorage();
  }
  return hybridStorageInstance;
}

/**
 * テスト用：シングルトンをリセット
 */
export function resetHybridStorage() {
  hybridStorageInstance = null;
}

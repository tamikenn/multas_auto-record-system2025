/**
 * @fileoverview SheetsStorage
 * Google Sheetsをプライマリストレージとして使用（Vercel/クラウド環境用）
 */

import { google } from 'googleapis';
import { 
  GOOGLE_SHEETS_CONFIG,
  getJapanTimestamp,
  generateId,
} from './config.js';
import { createLogger } from './logger.js';

const logger = createLogger('SheetsStorage');

/**
 * SheetsStorage クラス
 * Google Sheetsを直接ストレージとして使用
 */
export class SheetsStorage {
  constructor() {
    /** @type {google.auth.GoogleAuth | null} */
    this.googleAuth = null;
    
    /** @type {any} */
    this.sheets = null;
    
    /** @type {string | undefined} */
    this.spreadsheetId = GOOGLE_SHEETS_CONFIG.spreadsheetId;
    
    /** @type {string} */
    this.sheetName = 'Posts';

    this.initialize();
  }

  /**
   * Google Sheets認証を初期化
   */
  initialize() {
    try {
      const { credentials, spreadsheetId } = GOOGLE_SHEETS_CONFIG;
      
      if (!credentials || !spreadsheetId) {
        throw new Error('Google Sheets認証情報が設定されていません');
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
      throw error;
    }
  }

  /**
   * シート名を取得（初回アクセス時）
   */
  async ensureSheetName() {
    if (this.sheetName) return;

    try {
      const sheetInfo = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      this.sheetName = sheetInfo.data.sheets[0].properties.title;
    } catch (error) {
      logger.error('シート情報取得エラー', error);
      this.sheetName = 'Sheet1';
    }
  }

  /**
   * 全投稿を読み込む
   * @returns {Promise<Array<Object>>}
   */
  async loadAllPosts() {
    const endTimer = logger.time('loadAllPosts');

    try {
      await this.ensureSheetName();

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:G`,
      });

      const rows = response.data.values || [];
      
      // ヘッダー行をスキップ
      const posts = rows.slice(1).map((row, index) => ({
        id: row[0] || `sheets_${index}`,
        timestamp: row[1] || '',
        userName: row[2] || '',
        text: row[3] || '',
        category: parseInt(row[4]) || 0,
        reason: row[5] || '',
        date: row[6] || row[1] || '',
      })).filter(post => post.text.trim());

      logger.info(`${posts.length}件の投稿を読み込み`);
      endTimer();
      return posts;
    } catch (error) {
      endTimer();
      logger.error('投稿読み込みエラー', error);
      throw error;
    }
  }

  /**
   * 投稿を追加
   * @param {Object} post - 投稿データ
   * @returns {Promise<{success: boolean, rowNumber: number, synced: boolean}>}
   */
  async addPost(post) {
    const endTimer = logger.time('addPost');

    try {
      await this.ensureSheetName();

      const timestamp = post.timestamp || getJapanTimestamp();
      const id = post.id || generateId('post');

      const values = [[
        id,
        timestamp,
        post.userName || 'ゲストユーザー',
        post.text || '',
        post.category || 0,
        post.reason || '',
        post.date || timestamp,
      ]];

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:G`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      // 追加された行番号を取得
      const updatedRange = response.data.updates?.updatedRange || '';
      const rowMatch = updatedRange.match(/(\d+)$/);
      const rowNumber = rowMatch ? parseInt(rowMatch[1]) : -1;

      logger.info(`投稿追加: 行${rowNumber}`);
      endTimer();

      return {
        success: true,
        rowNumber,
        synced: true, // Google Sheetsに直接保存なので常にtrue
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
      await this.ensureSheetName();

      // まず全データを取得して該当行を探す
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:G`,
      });

      const rows = response.data.values || [];
      let targetRowIndex = -1;

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === postId) {
          targetRowIndex = i + 1; // 1-indexed
          break;
        }
      }

      if (targetRowIndex === -1) {
        logger.warn(`投稿が見つかりません: ${postId}`);
        return false;
      }

      // 現在の行データを取得
      const currentRow = rows[targetRowIndex - 1];
      
      // 更新データをマージ
      const updatedRow = [
        currentRow[0], // ID
        updatedData.timestamp || currentRow[1],
        updatedData.userName || currentRow[2],
        updatedData.text || currentRow[3],
        updatedData.category !== undefined ? updatedData.category : currentRow[4],
        updatedData.reason || currentRow[5],
        updatedData.date || currentRow[6],
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A${targetRowIndex}:G${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
      });

      logger.info(`投稿更新: ${postId}`);
      return true;
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
      await this.ensureSheetName();

      // シートIDを取得
      const sheetInfo = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheetId = sheetInfo.data.sheets[0].properties.sheetId;

      // 全データを取得して該当行を探す
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
      });

      const ids = response.data.values || [];
      let targetRowIndex = -1;

      for (let i = 1; i < ids.length; i++) {
        if (ids[i][0] === postId) {
          targetRowIndex = i; // 0-indexed for delete
          break;
        }
      }

      if (targetRowIndex === -1) {
        logger.warn(`投稿が見つかりません: ${postId}`);
        return false;
      }

      // 行を削除
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: targetRowIndex,
                endIndex: targetRowIndex + 1,
              },
            },
          }],
        },
      });

      logger.info(`投稿削除: ${postId}`);
      return true;
    } catch (error) {
      logger.error('投稿削除エラー', error);
      throw error;
    }
  }

  /**
   * ユーザーごとの投稿を取得
   * @param {string} userName - ユーザー名
   * @returns {Promise<Array<Object>>}
   */
  async loadUserPosts(userName) {
    const allPosts = await this.loadAllPosts();
    return allPosts.filter(post => post.userName === userName);
  }

  /**
   * 同期状態を取得（互換性のため）
   * @returns {Object}
   */
  getSyncStatus() {
    return {
      queueLength: 0,
      isSyncing: false,
      hasGoogleSheets: true,
    };
  }

  /**
   * 統計情報を取得
   * @returns {Promise<Object>}
   */
  async getStats() {
    const posts = await this.loadAllPosts();
    const users = new Set(posts.map(p => p.userName));
    
    return {
      totalPosts: posts.length,
      totalUsers: users.size,
      storage: 'Google Sheets',
    };
  }
}

// シングルトンインスタンス
let sheetsStorageInstance = null;

/**
 * SheetsStorageのシングルトンインスタンスを取得
 * @returns {SheetsStorage}
 */
export function getSheetsStorage() {
  if (!sheetsStorageInstance) {
    sheetsStorageInstance = new SheetsStorage();
  }
  return sheetsStorageInstance;
}

/**
 * @fileoverview ExcelManager
 * Excelファイルの読み書きを管理するクラス
 */

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import {
  DATA_DIR,
  EXCEL_FILE_PATH,
  BACKUP_DIR,
  BACKUP_CONFIG,
  EXCEL_COLUMNS,
  COLUMN_INDEX_MAP,
} from './config.js';
import { createLogger } from './logger.js';

const logger = createLogger('ExcelManager');

// 最後にバックアップを作成した時刻
let lastBackupTime = 0;

/**
 * ディレクトリが存在することを確認し、なければ作成
 * @param {string} dirPath - ディレクトリパス
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.debug(`ディレクトリ作成: ${dirPath}`);
  }
}

/**
 * 必要なディレクトリを確保
 */
function ensureDirectories() {
  ensureDirectory(DATA_DIR);
  ensureDirectory(BACKUP_DIR);
}

/**
 * バックアップファイル名を生成
 * @returns {string}
 */
function generateBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `multas_posts_backup_${timestamp}.xlsx`;
}

/**
 * 古いバックアップを削除
 */
function cleanupOldBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAge = BACKUP_CONFIG.maxAgeDays * 24 * 60 * 60 * 1000;

    // バックアップファイルのみを抽出してソート
    const backupFiles = files
      .filter(file => file.startsWith('multas_posts_backup_') && file.endsWith('.xlsx'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return { name: file, path: filePath, mtime: stats.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);

    // 最低保持数より多い場合、古いものを削除
    if (backupFiles.length > BACKUP_CONFIG.minKeepCount) {
      backupFiles.slice(BACKUP_CONFIG.minKeepCount).forEach(file => {
        if (now - file.mtime > maxAge) {
          fs.unlinkSync(file.path);
          logger.info(`古いバックアップを削除: ${file.name}`);
        }
      });
    }
  } catch (error) {
    logger.error('バックアップクリーンアップエラー', error);
  }
}

/**
 * 投稿データをExcel行データ（配列）に変換
 * @param {Object} post - 投稿データ
 * @param {string} timestamp - タイムスタンプ
 * @returns {Array}
 */
function postToRowArray(post, timestamp) {
  return [
    post.id || `excel_${Date.now()}`,
    timestamp,
    post.userName || 'ゲストユーザー',
    post.text || '',
    post.category || 0,
    post.reason || '',
    post.date || timestamp,
  ];
}

/**
 * Excel行データを投稿オブジェクトに変換
 * @param {ExcelJS.Row} row - Excelの行
 * @param {number} rowNumber - 行番号
 * @returns {Object | null}
 */
function rowToPost(row, rowNumber) {
  const text = row.getCell(COLUMN_INDEX_MAP.text).value?.toString() || '';
  
  // テキストが空の場合はスキップ
  if (!text.trim()) {
    return null;
  }

  return {
    id: row.getCell(COLUMN_INDEX_MAP.id).value?.toString() || `excel_${rowNumber}`,
    timestamp: row.getCell(COLUMN_INDEX_MAP.timestamp).value?.toString() || '',
    userName: row.getCell(COLUMN_INDEX_MAP.userName).value?.toString() || '',
    text,
    category: parseInt(row.getCell(COLUMN_INDEX_MAP.category).value) || 0,
    reason: row.getCell(COLUMN_INDEX_MAP.reason).value?.toString() || '',
    date: row.getCell(COLUMN_INDEX_MAP.date).value?.toString() || '',
  };
}

/**
 * ExcelManager クラス
 * Excelファイルの読み書きを管理
 */
export class ExcelManager {
  constructor() {
    ensureDirectories();
    // 初期化時にクリーンアップを非同期で実行（ブロックしない）
    setImmediate(() => cleanupOldBackups());
  }

  /**
   * Excelファイルが存在するか確認
   * @returns {Promise<boolean>}
   */
  async fileExists() {
    return fs.existsSync(EXCEL_FILE_PATH);
  }

  /**
   * Excelファイルを作成（初期化）
   * @returns {Promise<string>} ファイルパス
   */
  async createFile() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Posts');

    // ヘッダー行を設定
    worksheet.columns = EXCEL_COLUMNS.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    // ヘッダー行のスタイル
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
    logger.info('Excelファイル作成完了');
    return EXCEL_FILE_PATH;
  }

  /**
   * バックアップを作成（頻度制限付き）
   * @param {boolean} force - 強制的にバックアップを作成
   * @returns {Promise<string | null>} バックアップファイルパス
   */
  async createBackup(force = false) {
    if (!await this.fileExists()) {
      return null;
    }

    const now = Date.now();
    
    // 強制でなく、前回のバックアップから最小間隔が経過していない場合はスキップ
    if (!force && (now - lastBackupTime) < BACKUP_CONFIG.minIntervalMs) {
      logger.debug('バックアップスキップ（頻度制限）');
      return null;
    }

    try {
      const backupFileName = generateBackupFileName();
      const backupPath = path.join(BACKUP_DIR, backupFileName);
      
      fs.copyFileSync(EXCEL_FILE_PATH, backupPath);
      lastBackupTime = now;
      
      logger.info(`バックアップ作成: ${backupFileName}`);
      return backupPath;
    } catch (error) {
      logger.error('バックアップ作成エラー', error);
      throw error;
    }
  }

  /**
   * 全投稿を読み込む
   * @returns {Promise<Array<Object>>}
   */
  async loadAllPosts() {
    if (!await this.fileExists()) {
      return [];
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(EXCEL_FILE_PATH);
      const worksheet = workbook.getWorksheet('Posts');

      if (!worksheet) {
        logger.warn('Postsワークシートが見つかりません');
        return [];
      }

      const posts = [];
      worksheet.eachRow((row, rowNumber) => {
        // ヘッダー行をスキップ
        if (rowNumber === 1) return;

        const post = rowToPost(row, rowNumber);
        if (post) {
          posts.push(post);
        }
      });

      logger.debug(`${posts.length}件の投稿を読み込み`);
      return posts;
    } catch (error) {
      logger.error('Excel読み込みエラー', error);
      throw error;
    }
  }

  /**
   * 投稿を追加
   * @param {Object} post - 投稿データ
   * @returns {Promise<number>} 追加された行番号
   */
  async addPost(post) {
    const endTimer = logger.time('addPost');

    try {
      // バックアップを作成（頻度制限付き）
      await this.createBackup();

      const workbook = new ExcelJS.Workbook();
      
      if (await this.fileExists()) {
        await workbook.xlsx.readFile(EXCEL_FILE_PATH);
      } else {
        await this.createFile();
        await workbook.xlsx.readFile(EXCEL_FILE_PATH);
      }

      const worksheet = workbook.getWorksheet('Posts');
      const timestamp = post.timestamp || new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      
      // 配列形式で行を追加（ExcelJS読み込み後はcolumnsのkeyが失われるため）
      const newRow = worksheet.addRow(postToRowArray(post, timestamp));

      await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
      
      logger.info(`投稿追加: 行${newRow.number}`);
      endTimer();
      return newRow.number;
    } catch (error) {
      logger.error('投稿追加エラー', error);
      endTimer();
      throw error;
    }
  }

  /**
   * 投稿を更新
   * @param {string} postId - 投稿ID
   * @param {Object} updatedData - 更新データ
   * @returns {Promise<boolean>} 更新成功したかどうか
   */
  async updatePost(postId, updatedData) {
    try {
      await this.createBackup();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(EXCEL_FILE_PATH);
      const worksheet = workbook.getWorksheet('Posts');

      let updated = false;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const currentId = row.getCell(COLUMN_INDEX_MAP.id).value?.toString();
        if (currentId === postId.toString()) {
          // 各フィールドを更新
          Object.entries(updatedData).forEach(([key, value]) => {
            const colIndex = COLUMN_INDEX_MAP[key];
            if (colIndex && value !== undefined) {
              row.getCell(colIndex).value = value;
            }
          });
          updated = true;
        }
      });

      if (updated) {
        await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
        logger.info(`投稿更新: ${postId}`);
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
   * @returns {Promise<boolean>} 削除成功したかどうか
   */
  async deletePost(postId) {
    try {
      await this.createBackup(true); // 削除時は強制バックアップ

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(EXCEL_FILE_PATH);
      const worksheet = workbook.getWorksheet('Posts');

      const rowsToDelete = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const currentId = row.getCell(COLUMN_INDEX_MAP.id).value?.toString();
        if (currentId === postId.toString()) {
          rowsToDelete.push(rowNumber);
        }
      });

      // 後ろから削除（行番号がずれないように）
      rowsToDelete.reverse().forEach(rowNumber => {
        worksheet.spliceRows(rowNumber, 1);
      });

      if (rowsToDelete.length > 0) {
        await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
        logger.info(`投稿削除: ${postId}`);
        return true;
      }

      return false;
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
   * ファイルパスを取得
   * @returns {string}
   */
  getFilePath() {
    return EXCEL_FILE_PATH;
  }

  /**
   * バックアップディレクトリのパスを取得
   * @returns {string}
   */
  getBackupDir() {
    return BACKUP_DIR;
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
      filePath: EXCEL_FILE_PATH,
      fileExists: await this.fileExists(),
    };
  }
}

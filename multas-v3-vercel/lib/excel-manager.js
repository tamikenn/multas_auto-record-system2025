/**
 * @fileoverview ExcelManager
 * Excelファイルの読み書きを管理するクラス
 *
 * 改善点:
 * - 書き込み操作をmutexで直列化し、データ競合・ファイル破損を防止
 * - 読み込みはmutex外で並行可能（書き込み中でなければ）
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

// =============================================================================
// 書き込みmutex: Excelファイルへの同時書き込みを防止
// =============================================================================

/** @type {Promise<void>} */
let writeLock = Promise.resolve();

/**
 * 書き込みmutexを取得して操作を直列実行
 * @param {() => Promise<T>} fn - mutex内で実行する非同期関数
 * @returns {Promise<T>}
 * @template T
 */
function withWriteLock(fn) {
  let release;
  const newLock = new Promise((resolve) => { release = resolve; });

  // 前の書き込みが完了するまで待機してから実行
  const result = writeLock.then(async () => {
    try {
      return await fn();
    } finally {
      release();
    }
  });

  // 次の書き込みはこのロックの後に
  writeLock = newLock;
  return result;
}

// =============================================================================
// ユーティリティ
// =============================================================================

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.debug(`ディレクトリ作成: ${dirPath}`);
  }
}

function ensureDirectories() {
  ensureDirectory(DATA_DIR);
  ensureDirectory(BACKUP_DIR);
}

function generateBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `multas_posts_backup_${timestamp}.xlsx`;
}

function cleanupOldBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAge = BACKUP_CONFIG.maxAgeDays * 24 * 60 * 60 * 1000;

    const backupFiles = files
      .filter(file => file.startsWith('multas_posts_backup_') && file.endsWith('.xlsx'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return { name: file, path: filePath, mtime: stats.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);

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

function rowToPost(row, rowNumber) {
  const text = row.getCell(COLUMN_INDEX_MAP.text).value?.toString() || '';

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

// =============================================================================
// ExcelManager クラス
// =============================================================================

export class ExcelManager {
  constructor() {
    ensureDirectories();
    setImmediate(() => cleanupOldBackups());
  }

  async fileExists() {
    return fs.existsSync(EXCEL_FILE_PATH);
  }

  async createFile() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Posts');

    worksheet.columns = EXCEL_COLUMNS.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

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

  async createBackup(force = false) {
    if (!await this.fileExists()) {
      return null;
    }

    const now = Date.now();

    if (!force && (now - lastBackupTime) < BACKUP_CONFIG.minIntervalMs) {
      logger.debug('バックアップスキップ（頻度制限）');
      return null;
    }

    try {
      const backupFileName = generateBackupFileName();
      const backupPath = path.join(BACKUP_DIR, backupFileName);

      await fs.promises.copyFile(EXCEL_FILE_PATH, backupPath);
      lastBackupTime = now;

      logger.info(`バックアップ作成: ${backupFileName}`);
      return backupPath;
    } catch (error) {
      logger.error('バックアップ作成エラー', error);
      throw error;
    }
  }

  /**
   * 全投稿を読み込む（読み取り専用: mutex不要）
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
   * 投稿を追加（mutex で直列化）
   */
  async addPost(post) {
    return withWriteLock(async () => {
      const endTimer = logger.time('addPost');

      try {
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
    });
  }

  /**
   * 投稿を更新（mutex で直列化）
   */
  async updatePost(postId, updatedData) {
    return withWriteLock(async () => {
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
    });
  }

  /**
   * 投稿を削除（mutex で直列化）
   */
  async deletePost(postId) {
    return withWriteLock(async () => {
      try {
        await this.createBackup(true);

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
    });
  }

  async loadUserPosts(userName) {
    const allPosts = await this.loadAllPosts();
    return allPosts.filter(post => post.userName === userName);
  }

  getFilePath() {
    return EXCEL_FILE_PATH;
  }

  getBackupDir() {
    return BACKUP_DIR;
  }

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

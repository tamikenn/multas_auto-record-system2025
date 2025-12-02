// ExcelManager - Excelファイルの読み書きを管理するクラス
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

// データディレクトリのパス（プロジェクトルートのdataディレクトリ）
const DATA_DIR = path.join(process.cwd(), 'data');
const EXCEL_FILE = path.join(DATA_DIR, 'multas_posts.xlsx');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// データディレクトリとバックアップディレクトリを確保
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// バックアップファイル名を生成（タイムスタンプ付き）
function getBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `multas_posts_backup_${timestamp}.xlsx`;
}

// 古いバックアップを削除（30日以上古いもの、ただし最低3つは残す）
function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // バックアップファイルのみを抽出
    const backupFiles = files.filter(file => 
      file.startsWith('multas_posts_backup_') && file.endsWith('.xlsx')
    );

    // ファイルを日付順にソート（新しい順）
    const sortedFiles = backupFiles.map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        mtime: stats.mtimeMs
      };
    }).sort((a, b) => b.mtime - a.mtime);

    // 最低3つは残す
    const minBackupsToKeep = 3;
    
    if (sortedFiles.length > minBackupsToKeep) {
      // 3つ目以降で30日以上古いものを削除
      sortedFiles.slice(minBackupsToKeep).forEach(file => {
        if (file.mtime < thirtyDaysAgo) {
          fs.unlinkSync(file.path);
          console.log(`古いバックアップを削除: ${file.name}`);
        }
      });
    }
  } catch (error) {
    console.error('バックアップクリーンアップエラー:', error);
  }
}

export class ExcelManager {
  constructor() {
    ensureDirectories();
    cleanupOldBackups();
  }

  // Excelファイルが存在するか確認
  async fileExists() {
    return fs.existsSync(EXCEL_FILE);
  }

  // Excelファイルを作成（初期化）
  async createFile() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Posts');

    // ヘッダー行を設定
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'タイムスタンプ', key: 'timestamp', width: 20 },
      { header: 'ユーザー名', key: 'userName', width: 15 },
      { header: '投稿内容', key: 'text', width: 50 },
      { header: 'カテゴリ', key: 'category', width: 10 },
      { header: '分類理由', key: 'reason', width: 30 },
      { header: '日付', key: 'date', width: 15 }
    ];

    // ヘッダー行のスタイル設定
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    await workbook.xlsx.writeFile(EXCEL_FILE);
    return EXCEL_FILE;
  }

  // バックアップを作成
  async createBackup() {
    if (!await this.fileExists()) {
      return null;
    }

    const backupFileName = getBackupFileName();
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    try {
      fs.copyFileSync(EXCEL_FILE, backupPath);
      console.log(`バックアップ作成: ${backupFileName}`);
      return backupPath;
    } catch (error) {
      console.error('バックアップ作成エラー:', error);
      throw error;
    }
  }

  // 全投稿を読み込む
  async loadAllPosts() {
    if (!await this.fileExists()) {
      return [];
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(EXCEL_FILE);
      const worksheet = workbook.getWorksheet('Posts');

      if (!worksheet) {
        return [];
      }

      const posts = [];
      worksheet.eachRow((row, rowNumber) => {
        // ヘッダー行をスキップ
        if (rowNumber === 1) return;

        const post = {
          id: row.getCell(1).value?.toString() || `excel_${rowNumber}`,
          timestamp: row.getCell(2).value?.toString() || '',
          userName: row.getCell(3).value?.toString() || '',
          text: row.getCell(4).value?.toString() || '',
          category: row.getCell(5).value ? parseInt(row.getCell(5).value) : 0,
          reason: row.getCell(6).value?.toString() || '',
          date: row.getCell(7).value?.toString() || row.getCell(2).value?.toString() || ''
        };

        if (post.text) {
          posts.push(post);
        }
      });

      return posts;
    } catch (error) {
      console.error('Excel読み込みエラー:', error);
      throw error;
    }
  }

  // 投稿を追加
  async addPost(post) {
    try {
      // バックアップを作成
      await this.createBackup();

      const workbook = new ExcelJS.Workbook();
      
      if (await this.fileExists()) {
        await workbook.xlsx.readFile(EXCEL_FILE);
      } else {
        await this.createFile();
        await workbook.xlsx.readFile(EXCEL_FILE);
      }

      const worksheet = workbook.getWorksheet('Posts');

      // 新しい行を追加
      const newRow = worksheet.addRow({
        id: post.id || `excel_${Date.now()}`,
        timestamp: post.timestamp || new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        userName: post.userName || 'ゲストユーザー',
        text: post.text || '',
        category: post.category || 0,
        reason: post.reason || '',
        date: post.date || post.timestamp || new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
      });

      await workbook.xlsx.writeFile(EXCEL_FILE);
      return newRow.number;
    } catch (error) {
      console.error('投稿追加エラー:', error);
      throw error;
    }
  }

  // 投稿を更新
  async updatePost(postId, updatedData) {
    try {
      // バックアップを作成
      await this.createBackup();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(EXCEL_FILE);
      const worksheet = workbook.getWorksheet('Posts');

      let updated = false;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // ヘッダー行をスキップ

        const currentId = row.getCell(1).value?.toString();
        if (currentId === postId.toString()) {
          // 該当行を更新
          if (updatedData.timestamp !== undefined) {
            row.getCell(2).value = updatedData.timestamp;
          }
          if (updatedData.userName !== undefined) {
            row.getCell(3).value = updatedData.userName;
          }
          if (updatedData.text !== undefined) {
            row.getCell(4).value = updatedData.text;
          }
          if (updatedData.category !== undefined) {
            row.getCell(5).value = updatedData.category;
          }
          if (updatedData.reason !== undefined) {
            row.getCell(6).value = updatedData.reason;
          }
          if (updatedData.date !== undefined) {
            row.getCell(7).value = updatedData.date;
          }
          updated = true;
        }
      });

      if (updated) {
        await workbook.xlsx.writeFile(EXCEL_FILE);
        return true;
      }

      return false;
    } catch (error) {
      console.error('投稿更新エラー:', error);
      throw error;
    }
  }

  // 投稿を削除
  async deletePost(postId) {
    try {
      // バックアップを作成
      await this.createBackup();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(EXCEL_FILE);
      const worksheet = workbook.getWorksheet('Posts');

      let deleted = false;
      const rowsToDelete = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // ヘッダー行をスキップ

        const currentId = row.getCell(1).value?.toString();
        if (currentId === postId.toString()) {
          rowsToDelete.push(rowNumber);
          deleted = true;
        }
      });

      // 後ろから削除（行番号がずれないように）
      rowsToDelete.reverse().forEach(rowNumber => {
        worksheet.spliceRows(rowNumber, 1);
      });

      if (deleted) {
        await workbook.xlsx.writeFile(EXCEL_FILE);
        return true;
      }

      return false;
    } catch (error) {
      console.error('投稿削除エラー:', error);
      throw error;
    }
  }

  // ユーザーごとの投稿を取得
  async loadUserPosts(userName) {
    const allPosts = await this.loadAllPosts();
    return allPosts.filter(post => post.userName === userName);
  }

  // ファイルパスを取得
  getFilePath() {
    return EXCEL_FILE;
  }

  // バックアップディレクトリのパスを取得
  getBackupDir() {
    return BACKUP_DIR;
  }
}


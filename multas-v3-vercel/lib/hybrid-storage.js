// HybridStorage - Excelをプライマリ、Google Sheetsをバックグラウンド同期
import { ExcelManager } from './excel-manager.js';
import { google } from 'googleapis';
import cron from 'node-cron';

export class HybridStorage {
  constructor() {
    this.excelManager = new ExcelManager();
    this.syncQueue = [];
    this.isSyncing = false;
    this.batchTimer = null;
    this.batchInterval = 5000; // 5秒バッチング
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5秒

    // Google Sheets認証情報
    this.googleAuth = null;
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Google Sheets認証を初期化
    this.initializeGoogleSheets();

    // 定期同期処理を開始（5分ごと）
    this.startPeriodicSync();
  }

  // Google Sheets認証を初期化
  initializeGoogleSheets() {
    try {
      const credentials = process.env.GOOGLE_CREDENTIALS;
      if (!credentials || !this.spreadsheetId) {
        console.log('Google Sheets認証情報が設定されていません。ローカルのみで動作します。');
        return;
      }

      const parsedCredentials = JSON.parse(credentials.trim());
      this.googleAuth = new google.auth.GoogleAuth({
        credentials: parsedCredentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.googleAuth });
      console.log('Google Sheets認証完了');
    } catch (error) {
      console.error('Google Sheets認証エラー:', error);
      this.googleAuth = null;
      this.sheets = null;
    }
  }

  // 同期キューに追加
  addToSyncQueue(post, operation = 'add') {
    this.syncQueue.push({
      post,
      operation,
      retries: 0,
      timestamp: Date.now()
    });

    // バッチタイマーをリセット
    this.resetBatchTimer();
  }

  // バッチタイマーをリセット
  resetBatchTimer() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processSyncQueue();
    }, this.batchInterval);
  }

  // 同期キューを処理
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
      }
    } catch (error) {
      console.error('同期処理エラー:', error);
      // 失敗したアイテムをキューに戻す（リトライ回数チェック）
      batch.forEach(item => {
        if (item.retries < this.maxRetries) {
          item.retries++;
          this.syncQueue.push(item);
        } else {
          console.error(`同期失敗（最大リトライ回数に達しました）:`, item);
        }
      });
    } finally {
      this.isSyncing = false;
    }
  }

  // Google Sheetsに同期
  async syncToGoogleSheets(batch) {
    if (!this.sheets || !this.spreadsheetId) {
      return;
    }

    try {
      // スプレッドシート情報を取得
      const sheetInfo = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const firstSheetName = sheetInfo.data.sheets[0].properties.title;

      // バッチデータを準備
      const values = batch.map(item => {
        const post = item.post;
        return [
          post.timestamp || new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
          post.userName || 'ゲストユーザー',
          post.text || '',
          post.category || 0,
          post.reason || ''
        ];
      });

      // データを追加
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${firstSheetName}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: values
        }
      });

      console.log(`${batch.length}件の投稿をGoogle Sheetsに同期しました`);
    } catch (error) {
      console.error('Google Sheets同期エラー:', error);
      throw error;
    }
  }

  // 定期同期処理を開始
  startPeriodicSync() {
    // 5分ごとに失敗した同期を再試行
    cron.schedule('*/5 * * * *', () => {
      if (this.syncQueue.length > 0 && !this.isSyncing) {
        console.log(`定期同期: ${this.syncQueue.length}件のキューを処理します`);
        this.processSyncQueue();
      }
    });
  }

  // 投稿を追加
  async addPost(post) {
    try {
      // 1. Excelに即座に保存（プライマリ）
      const rowNumber = await this.excelManager.addPost(post);
      console.log(`投稿をExcelに保存: 行${rowNumber}`);

      // 2. Google Sheets同期キューに追加（バックグラウンド）
      this.addToSyncQueue(post, 'add');

      return {
        success: true,
        rowNumber,
        synced: false // バックグラウンドで同期される
      };
    } catch (error) {
      console.error('投稿追加エラー:', error);
      throw error;
    }
  }

  // 投稿を更新
  async updatePost(postId, updatedData) {
    try {
      // 1. Excelを更新
      const updated = await this.excelManager.updatePost(postId, updatedData);
      
      if (updated) {
        // 2. Google Sheets同期キューに追加
        this.addToSyncQueue({ id: postId, ...updatedData }, 'update');
      }

      return updated;
    } catch (error) {
      console.error('投稿更新エラー:', error);
      throw error;
    }
  }

  // 投稿を削除
  async deletePost(postId) {
    try {
      // 1. Excelから削除
      const deleted = await this.excelManager.deletePost(postId);
      
      if (deleted) {
        // 2. Google Sheets同期キューに追加
        this.addToSyncQueue({ id: postId }, 'delete');
      }

      return deleted;
    } catch (error) {
      console.error('投稿削除エラー:', error);
      throw error;
    }
  }

  // 全投稿を読み込む
  async loadAllPosts() {
    try {
      return await this.excelManager.loadAllPosts();
    } catch (error) {
      console.error('投稿読み込みエラー:', error);
      throw error;
    }
  }

  // ユーザーごとの投稿を取得
  async loadUserPosts(userName) {
    try {
      return await this.excelManager.loadUserPosts(userName);
    } catch (error) {
      console.error('ユーザー投稿読み込みエラー:', error);
      throw error;
    }
  }

  // 同期状態を取得
  getSyncStatus() {
    return {
      queueLength: this.syncQueue.length,
      isSyncing: this.isSyncing,
      hasGoogleSheets: !!this.sheets
    };
  }

  // 手動で同期を実行
  async forceSync() {
    return await this.processSyncQueue();
  }
}

// シングルトンインスタンス
let hybridStorageInstance = null;

export function getHybridStorage() {
  if (!hybridStorageInstance) {
    hybridStorageInstance = new HybridStorage();
  }
  return hybridStorageInstance;
}


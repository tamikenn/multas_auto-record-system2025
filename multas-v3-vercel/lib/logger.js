/**
 * @fileoverview ロガーユーティリティ
 * 環境に応じたログ出力を管理
 */

import { isDevelopment, isProduction } from './config.js';

/**
 * ログレベル
 * @readonly
 * @enum {number}
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

/**
 * 現在のログレベル（環境変数または環境に応じて設定）
 */
const currentLogLevel = (() => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  if (envLevel && LogLevel[envLevel] !== undefined) {
    return LogLevel[envLevel];
  }
  // 本番環境ではWARN以上のみ、開発環境ではDEBUG以上
  return isProduction ? LogLevel.WARN : LogLevel.DEBUG;
})();

/**
 * タイムスタンプを取得
 * @returns {string}
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * ログフォーマット
 * @param {string} level - ログレベル
 * @param {string} module - モジュール名
 * @param {string} message - メッセージ
 * @returns {string}
 */
function formatLog(level, module, message) {
  return `[${getTimestamp()}] [${level}] [${module}] ${message}`;
}

/**
 * ロガークラス
 * 各モジュールで使用するロガーインスタンスを作成
 */
export class Logger {
  /**
   * @param {string} moduleName - モジュール名
   */
  constructor(moduleName) {
    this.moduleName = moduleName;
  }

  /**
   * デバッグログ
   * @param {string} message - メッセージ
   * @param {any} [data] - 追加データ
   */
  debug(message, data) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.log(formatLog('DEBUG', this.moduleName, message));
      if (data !== undefined) {
        console.log(data);
      }
    }
  }

  /**
   * 情報ログ
   * @param {string} message - メッセージ
   * @param {any} [data] - 追加データ
   */
  info(message, data) {
    if (currentLogLevel <= LogLevel.INFO) {
      console.log(formatLog('INFO', this.moduleName, message));
      if (data !== undefined) {
        console.log(data);
      }
    }
  }

  /**
   * 警告ログ
   * @param {string} message - メッセージ
   * @param {any} [data] - 追加データ
   */
  warn(message, data) {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(formatLog('WARN', this.moduleName, message));
      if (data !== undefined) {
        console.warn(data);
      }
    }
  }

  /**
   * エラーログ
   * @param {string} message - メッセージ
   * @param {Error | any} [error] - エラーオブジェクト
   */
  error(message, error) {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(formatLog('ERROR', this.moduleName, message));
      if (error !== undefined) {
        if (error instanceof Error) {
          console.error(`  Message: ${error.message}`);
          if (isDevelopment && error.stack) {
            console.error(`  Stack: ${error.stack}`);
          }
        } else {
          console.error(error);
        }
      }
    }
  }

  /**
   * パフォーマンス計測開始
   * @param {string} label - ラベル
   * @returns {() => void} 計測終了関数
   */
  time(label) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      const start = performance.now();
      return () => {
        const duration = performance.now() - start;
        this.debug(`${label}: ${duration.toFixed(2)}ms`);
      };
    }
    return () => {}; // no-op
  }
}

/**
 * ロガーインスタンスを作成
 * @param {string} moduleName - モジュール名
 * @returns {Logger}
 */
export function createLogger(moduleName) {
  return new Logger(moduleName);
}

// 共通ロガーインスタンス
export const logger = createLogger('App');

# Changelog

## [3.4.0] - 2024-12-02

### Added
- 🌐 Cloudflare Tunnel統合
  - スマホからの外部アクセス対応
  - 認証不要・無料・警告画面なし
- 🚀 自動起動スクリプト
  - `scripts/startup-multas.bat` - ワンクリック起動
  - `scripts/stop-multas.bat` - ワンクリック停止
- 📱 スマホ対応最適化
  - ローカルLLMでのAI分類をスマホから利用可能

### Changed
- 🏷️ バージョン表記を v3.4 に統一

### Benefits
- 📱 どこからでもスマホでアクセス可能
- 🤖 ローカルLLMの処理能力をフル活用
- 💰 外部API不要・完全無料運用

---

## [3.2.0] - 2024-12-02

### Added
- 🗄️ ローカルExcelバックエンド統合
  - ExcelManagerクラス（`lib/excel-manager.js`）
  - HybridStorageクラス（`lib/hybrid-storage.js`）
- 📦 自動バックアップ機能
  - 投稿追加・更新・削除時に自動バックアップ
  - 最低3つのバックアップを保持
  - 30日以上古いバックアップを自動削除
- 🔄 Google Sheetsバックグラウンド同期
  - 5秒バッチング（複数投稿をまとめて同期）
  - node-cronによる定期処理（5分ごと）
  - 失敗時の自動再試行（最大3回）

### Changed
- ⚡ プライマリストレージをGoogle SheetsからExcelに変更
- 🔧 `pages/api/save-post.js` - HybridStorageを使用
- 🔧 `pages/api/get-all-posts.js` - HybridStorageを使用

### Benefits
- ⚡ 高速な読み書き（Excelファイルへの直接アクセス）
- 🌐 完全オフライン動作可能
- 💾 自動バックアップによるデータ安全性向上
- 🔄 柔軟な同期（Google Sheetsはオプション）

### Technical Details
- ExcelJS 4.4.0
- node-cron 3.0.3
- データディレクトリ: `data/multas_posts.xlsx`
- バックアップディレクトリ: `data/backups/`

---

## [3.1.0] - 2024-12-02

### Added
- ✨ Local LLM統合（Qwen 2.5シリーズ）
  - qwen2.5:7b - 分類タスク用（高速・軽量）
  - qwen2.5:14b - レポート生成・要素分解用（高品質）
- 🔧 `lib/ai-providers.js` に `classifyWithLocal()` メソッド実装
- 🔄 全APIエンドポイントをLocal LLM対応
  - `/api/classify.js` - 基本分類
  - `/api/classify-advanced.js` - 高度分類（要素分解含む）
  - `/api/generate-report.js` - レポート生成
  - `/api/generate-category-summary.js` - カテゴリサマリー
- 🛡️ フォールバック機能（OpenAI APIへ自動切り替え）
- 📝 包括的なドキュメント作成
  - PROJECT_SUMMARY.md
  - LOCALLLM_MODEL_SELECTION.md
  - LOCALLLM_IMPLEMENTATION_GUIDE.md
  - IMPLEMENTATION_COMPLETE.md

### Changed
- 🎯 デフォルトAIプロバイダーをLocalに変更可能（環境変数で切り替え）

### Benefits
- 💰 API コスト: $0（無料化）
- ⚡ レスポンス速度: 3-5秒
- 🔒 データプライバシー向上
- 🌐 完全オフライン動作可能

### Technical Details
- Node.js v24.11.1
- Ollama統合
- RTX 4070 Ti SUPER 16GB対応
- タイムアウト処理・エラーハンドリング強化

---

## [3.0.0] - 2024-07-26

### Added
- Next.js 14.2.0ベースの実装
- Vercelデプロイ対応
- Google Sheets API連携
- みんなの学び機能
- いいね機能

---

## [2.3.1] - 2024-XX-XX

### Added
- 12時計分類システム
- レーダーチャート表示
- レベル・経験値システム

---

## [2.2.0] - 2024-XX-XX

### Added
- セーフティモード版
- GitHub Pages対応
- 安定版リリース

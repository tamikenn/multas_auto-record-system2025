# Changelog

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


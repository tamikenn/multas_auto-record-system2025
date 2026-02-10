# Multas 自動記録システム 仕様書

**バージョン**: 3.4.0  
**最終更新**: 2025-02-10

---

## 1. システム概要

### 1.1 目的
医学部実習生の体験記録を収集・分類・分析するWebアプリケーション。
12時計分類に基づいてAIが自動分類を行い、学習進捗を可視化する。

### 1.2 対象ユーザー
- 医学部実習生（主要ユーザー）
- 指導教員（管理・閲覧）
- 想定規模: 10〜100名

### 1.3 技術スタック
| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 14, React 18 |
| バックエンド | Next.js API Routes |
| AI分類 | LocalLLM (Ollama) / OpenAI API |
| データ保存 | Excel (ローカル) / Google Sheets (クラウド) |
| ホスティング | ローカルPC + Cloudflare Tunnel / Vercel |

---

## 2. 機能一覧

### 2.1 コア機能

| 機能 | 説明 | エンドポイント |
|------|------|--------------|
| **投稿記録** | 実習体験テキストを入力・保存 | `POST /api/save-post` |
| **AI分類** | 12時計分類で自動カテゴリ分け | `POST /api/classify` |
| **投稿取得** | 全投稿または特定ユーザーの投稿を取得 | `GET /api/get-all-posts` |
| **レポート生成** | AIによる学習分析レポート作成 | `POST /api/generate-report` |
| **共有学習** | 他ユーザーと投稿を共有 | `POST /api/share-post` |

### 2.2 サブ機能

| 機能 | 説明 |
|------|------|
| ゲーミフィケーション | 投稿でEXP獲得、レベルアップ |
| レーダーチャート | 12時計分類の可視化 |
| PDF出力 | レポートのPDFダウンロード |
| いいね機能 | 共有投稿へのいいね |

---

## 3. 12時計分類（カテゴリ）

| ID | カテゴリ名 | 説明 | キーワード例 |
|----|-----------|------|-------------|
| 1 | 医療倫理 | インフォームドコンセント、患者の権利、守秘義務 | 倫理, 同意, 権利 |
| 2 | 地域医療 | 地域包括ケア、在宅医療、地域連携 | 地域, 在宅, 訪問 |
| 3 | 医学知識 | 病態生理、薬理、診断基準 | 病態, 診断, 治療 |
| 4 | 診察・手技 | 身体診察、医療手技、検査手法 | 診察, 測定, バイタル |
| 5 | 問題解決能力 | 分析力、思考力、判断力 | 分析, 判断, 考察 |
| 6 | 統合的臨床 | 複数要素を含む臨床対応 | 統合, 複合, 包括 |
| 7 | 多職種連携 | チーム医療、院内連携 | チーム, 連携, カンファレンス |
| 8 | コミュニケーション | 傾聴、共感、説明、信頼関係 | 傾聴, 共感, 説明 |
| 9 | 一般教養 | 医学以外の知識 | 教養, 文化, 歴史 |
| 10 | 保健・福祉 | 社会的サポート、福祉制度、介護 | 福祉, 介護, 支援 |
| 11 | 行政 | 病院間連携、紹介 | 紹介, 転院, 連携 |
| 12 | 社会医学/公衆衛生 | 地域保健、予防医学 | 予防, 公衆衛生, 感染対策 |

---

## 4. データ構造

### 4.1 投稿データ

```javascript
{
  id: "post_1234567890_abc123",      // 一意のID
  timestamp: "2025/2/10 15:30:00",    // 投稿日時
  userName: "学生A",                  // ユーザー名
  text: "今日は患者さんの...",        // 投稿内容
  category: 8,                        // カテゴリ番号 (1-12)
  reason: "LocalLLM分類: カテゴリ8",  // 分類理由
  date: "2025/2/10 15:30:00"          // 日付
}
```

### 4.2 Excel列構造

| 列 | ヘッダー | 説明 |
|----|---------|------|
| A | ID | 投稿ID |
| B | タイムスタンプ | 投稿日時 |
| C | ユーザー名 | 投稿者名 |
| D | 投稿内容 | 実習記録テキスト |
| E | カテゴリ | 12時計分類番号 (1-12) |
| F | 分類理由 | AI分類理由 |
| G | 日付 | 投稿日 |

---

## 5. API仕様

### 5.1 POST /api/classify

**リクエスト**
```json
{
  "text": "患者さんの血圧を測定しました"
}
```

**レスポンス (200)**
```json
{
  "success": true,
  "category": 4,
  "reason": "LocalLLM分類: カテゴリ4",
  "provider": "local"
}
```

### 5.2 POST /api/save-post

**リクエスト**
```json
{
  "text": "実習での体験内容...",
  "category": 8,
  "reason": "分類理由",
  "userName": "学生A"
}
```

**レスポンス (201)**
```json
{
  "success": true,
  "post": { ... },
  "rowNumber": 5,
  "synced": false,
  "message": "投稿を保存しました"
}
```

### 5.3 GET /api/get-all-posts

**クエリパラメータ**
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| userName | string | 特定ユーザーの投稿のみ取得 |
| limit | number | 取得件数制限 |
| offset | number | オフセット |

**レスポンス (200)**
```json
{
  "success": true,
  "posts": [...],
  "studentStats": [...],
  "totalPosts": 100,
  "totalStudents": 15,
  "source": "Excel"
}
```

---

## 6. 環境設定

### 6.1 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `AI_PROVIDER` | AIプロバイダー (local/openai/claude) | local |
| `STORAGE_MODE` | ストレージモード (hybrid/sheets) | hybrid |
| `LOCAL_LLM_API_URL` | Ollama API URL | http://localhost:11434/api/generate |
| `LOCAL_LLM_MODEL_CLASSIFY` | 分類用モデル | qwen2.5:7b |
| `LOCAL_LLM_MODEL_REPORT` | レポート用モデル | qwen2.5:14b |
| `OPENAI_API_KEY` | OpenAI APIキー | - |
| `GOOGLE_CREDENTIALS` | Google認証情報 (JSON) | - |
| `GOOGLE_SPREADSHEET_ID` | スプレッドシートID | - |

### 6.2 ストレージモード

| モード | 説明 | 環境 |
|--------|------|------|
| `hybrid` | Excel (プライマリ) + Google Sheets (同期) | ローカルPC |
| `sheets` | Google Sheets のみ | Vercel |

---

## 7. デプロイ構成

### 7.1 ハイブリッド運用

```
┌─────────────────────────────────────────────────────────┐
│                    通常時 (99%)                          │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────┐   │
│  │  ユーザー │───▶│ Cloudflare  │───▶│ ローカルPC   │   │
│  │  (スマホ) │    │   Tunnel    │    │ LocalLLM     │   │
│  └──────────┘    └─────────────┘    │ + Excel      │   │
│                                      └──────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  メンテナンス時 (1%)                     │
│  ┌──────────┐                       ┌──────────────┐   │
│  │  ユーザー │──────────────────────▶│   Vercel     │   │
│  │  (スマホ) │                       │ OpenAI API   │   │
│  └──────────┘                       │ Google Sheets│   │
│                                      └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 7.2 URL一覧

| 環境 | URL |
|------|-----|
| ローカル開発 | http://localhost:3000 |
| Vercel本番 | https://multas-v3-vercel.vercel.app |

---

## 8. ファイル構成

```
multas-v3-vercel/
├── data/
│   ├── multas_posts.xlsx          # メインデータファイル
│   └── backups/                    # 自動バックアップ
├── lib/
│   ├── config.js                   # 設定・定数
│   ├── logger.js                   # ロガー
│   ├── ai-providers.js             # AI分類プロバイダー
│   ├── excel-manager.js            # Excel操作
│   ├── hybrid-storage.js           # ハイブリッドストレージ
│   ├── sheets-storage.js           # Google Sheets専用
│   ├── server-storage.js           # ストレージファクトリ
│   ├── storage.js                  # クライアント用localStorage
│   └── categories.js               # カテゴリユーティリティ
├── pages/
│   ├── api/
│   │   ├── classify.js             # 分類API
│   │   ├── save-post.js            # 保存API
│   │   ├── get-all-posts.js        # 取得API
│   │   ├── generate-report.js      # レポート生成API
│   │   └── ...
│   ├── index.js                    # トップページ
│   ├── mobile-input-tabs.js        # メイン入力画面
│   ├── teacher-dashboard.js        # 教員ダッシュボード
│   └── ...
├── components/
│   ├── RadarChart.js               # レーダーチャート
│   └── SharedLearning.js           # 共有学習コンポーネント
├── package.json
├── vercel.json                     # Vercel設定
└── .env.local                      # 環境変数（ローカル用）
```

---

## 9. 運用ガイド

### 9.1 ローカル起動

```bash
cd multas-v3-vercel
npm run dev
```

### 9.2 Ollamaモデル確認

```bash
ollama list
ollama run qwen2.5:7b
```

### 9.3 バックアップ

- 自動バックアップ: 投稿追加時（最小1分間隔）
- 保持期間: 30日間（最低3件は保持）
- 場所: `data/backups/`

### 9.4 トラブルシューティング

| 問題 | 対処法 |
|------|--------|
| Ollamaに接続できない | `ollama serve` で起動確認 |
| Excelファイルエラー | `data/backups/` から復元 |
| Vercel APIタイムアウト | 30秒以内に処理完了を確認 |

---

## 10. セキュリティ

- 環境変数でAPIキーを管理
- Google認証情報は暗号化して保存
- ユーザー入力はバリデーション済み
- エラーメッセージに機密情報を含めない

---

## 11. 今後の拡張予定

- [ ] ユーザー認証機能
- [ ] 管理者ダッシュボード強化
- [ ] データエクスポート機能
- [ ] 多言語対応
- [ ] モバイルアプリ化（PWA）

---

**作成日**: 2025-02-10  
**作成者**: Cursor AI Assistant

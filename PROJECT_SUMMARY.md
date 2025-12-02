# MULTAs 臨床実習記録システム - プロジェクト全体像サマリー

## 📋 プロジェクト概要

**MULTAs (Medical University Learning and Training Assessment system)** は、医学部実習生が日々の体験を記録し、AI分析による12時計分類で学習進捗を可視化するWebアプリケーションです。

### 主な目的
- 実習中でも素早く体験を記録
- AI分析による即座の分類フィードバック
- レーダーチャートによる進捗の可視化
- AIレポート生成による振り返り支援

---

## 🏗️ プロジェクト構造

### ディレクトリ構成

```
multas_auto-record-system2025/
├── multas-v3-vercel/          # メインアプリケーション（Next.js版）
│   ├── pages/
│   │   ├── api/                # APIエンドポイント（AI処理含む）
│   │   ├── mobile-input-tabs.js # メインフロントエンド
│   │   └── ...
│   ├── lib/
│   │   ├── ai-providers.js     # AI抽象化レイヤー（重要！）
│   │   ├── categories.js        # 12時計カテゴリ定義
│   │   └── storage.js           # LocalStorage管理
│   └── components/
│       ├── RadarChart.js        # レーダーチャート
│       └── SharedLearning.js   # 共有学習機能
│
├── multas-v3-vercel-backup-v3.1/  # バックアップ版
├── multas-v3/                   # 旧バージョン
└── ドキュメント類/
    ├── MULTAS_SPECIFICATION.md
    ├── MULTAS_DESIGN.md
    └── CODE_STRUCTURE.md
```

---

## 🤖 AI機能の実装状況

### 現在のAI統合

#### 1. **AI抽象化レイヤー** (`lib/ai-providers.js`)
- **既にLocalLLM対応の準備あり！**
- 複数のAIプロバイダーに対応する設計
- 現在サポート：
  - `openai` (デフォルト)
  - `claude` (実装済み)
  - `local` (キーワードベースのフォールバック実装済み)

```javascript
// 環境変数で切り替え可能
this.provider = process.env.AI_PROVIDER || 'openai';
```

#### 2. **APIエンドポイント**

##### `/api/classify.js`
- **機能**: 基本的な12時計分類
- **使用モデル**: GPT-3.5-turbo
- **入力**: テキスト
- **出力**: カテゴリ番号（1-12）と理由

##### `/api/classify-advanced.js`
- **機能**: 高度な分類（長文対応）
- **使用モデル**: GPT-4
- **特徴**:
  - 200文字以上の長文は要素分解
  - 複数要素を個別に分類
  - 各要素のカテゴリと理由を返却

##### `/api/generate-report.js`
- **機能**: 学習レポート生成
- **使用モデル**: GPT-4
- **入力**: 10件以上の投稿データ
- **出力**: 300-400文字の振り返りレポート

##### `/api/generate-category-summary.js`
- **機能**: カテゴリ別サマリー生成

#### 3. **フロントエンドでの呼び出し**

**メインファイル**: `pages/mobile-input-tabs.js`

- 投稿送信時: `/api/classify-advanced` を呼び出し
- レポート生成時: `/api/generate-report` を呼び出し
- カテゴリサマリー: `/api/generate-category-summary` を呼び出し

---

## 📊 12時計分類システム

### カテゴリ定義

| 時 | カテゴリ名 | 説明 |
|---|----------|------|
| 1 | 医療倫理 | インフォームドコンセント、患者の権利、守秘義務 |
| 2 | 地域医療 | 地域包括ケア、在宅医療、地域連携 |
| 3 | 医学的知識 | 病態生理、薬理、診断基準 |
| 4 | 診察・手技 | 身体診察、医療手技、検査手法 |
| 5 | 問題解決能力 | 分析力、思考力、判断力 |
| 6 | 統合的臨床能力 | 複数要素を含む臨床対応 |
| 7 | 多職種連携 | チーム医療、院内連携 |
| 8 | コミュニケーション | 傾聴、共感、説明、信頼関係 |
| 9 | 一般教養 | 医学以外の知識 |
| 10 | 保健・福祉 | 社会的サポート、福祉制度、介護 |
| 11 | 行政 | 病院間連携、紹介 |
| 12 | 社会医学 | 地域保健、予防医学 |

---

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14.2.0** (React 18.3.0)
- **Chart.js** (レーダーチャート表示)
- **jsPDF + html2canvas** (PDF出力)

### バックエンド
- **Next.js API Routes** (サーバーレス関数)
- **OpenAI API** (現在使用中)
- **Google Sheets API** (データ保存)

### データストレージ
- **LocalStorage** (クライアント側)
- **Google Sheets** (サーバー側)

### デプロイ
- **Vercel** (現在のデプロイ先)

---

## 🔄 LocalLLMへの置き換えポイント

### 1. **既存の抽象化レイヤーを活用**

`lib/ai-providers.js` の `classifyWithLocal()` メソッドを実装する必要があります。

**現在の実装**（キーワードベースのフォールバック）:
```javascript
async classifyWithLocal(text) {
  // ローカルLLM implementation (将来的)
  // Ollama, LM Studio, または独自モデルとの連携
  
  // 現在は簡単なキーワードベース分類をフォールバック
  return this.getKeywordBasedClassification(text);
}
```

### 2. **置き換えが必要な箇所**

#### A. `/api/classify.js`
- `OpenAI` クラスの使用箇所
- `openai.chat.completions.create()` の呼び出し
- → LocalLLMのHTTP APIエンドポイントに置き換え

#### B. `/api/classify-advanced.js`
- `classifySingleElement()` 関数内のOpenAI呼び出し
- `analyzeMultipleElements()` 関数内のOpenAI呼び出し
- → LocalLLMのAPIに置き換え

#### C. `/api/generate-report.js`
- レポート生成のOpenAI呼び出し
- → LocalLLMのAPIに置き換え（または簡易版に変更）

#### D. `/api/generate-category-summary.js`
- カテゴリサマリー生成のOpenAI呼び出し

### 3. **環境変数の設定**

```bash
# .env.local
AI_PROVIDER=local
LOCAL_LLM_API_URL=http://localhost:11434/api/generate  # Ollama例
# または
LOCAL_LLM_API_URL=http://localhost:1234/v1/chat/completions  # LM Studio例
```

### 4. **プロンプト設計の確認**

各APIエンドポイントで使用されているプロンプトは、LocalLLMでも同様に動作するよう設計されていますが、モデルによっては調整が必要な場合があります。

---

## 📁 主要ファイル一覧

### フロントエンド
- `pages/mobile-input-tabs.js` - メインアプリケーション（2482行）
- `pages/index.js` - ランディングページ

### バックエンド（API）
- `pages/api/classify.js` - 基本分類API
- `pages/api/classify-advanced.js` - 高度分類API
- `pages/api/generate-report.js` - レポート生成API
- `pages/api/generate-category-summary.js` - カテゴリサマリーAPI
- `pages/api/save-post.js` - 投稿保存API
- `pages/api/get-shared-posts.js` - 共有投稿取得API

### ライブラリ
- `lib/ai-providers.js` - **AI抽象化レイヤー（重要）**
- `lib/categories.js` - カテゴリ定義
- `lib/storage.js` - LocalStorage管理

### コンポーネント
- `components/RadarChart.js` - レーダーチャート表示
- `components/SharedLearning.js` - 共有学習機能

---

## 🎯 主要機能

### 実装済み
- ✅ 実習記録の入力・保存
- ✅ AI自動分類（12時計分類）
- ✅ レーダーチャート表示
- ✅ レポート生成
- ✅ 投稿の編集・削除
- ✅ モバイル最適化
- ✅ みんなの学び（共有機能）
- ✅ いいね機能
- ✅ PDF出力機能

### 未実装（v2.2/v2.3から）
- ⏳ レベル・経験値システム
- ⏳ 日付管理システム（1日目〜5日目）
- ⏳ 深さ分類システム（0-4段階）

---

## 🔐 セキュリティ・環境変数

### 必要な環境変数

```bash
# OpenAI API（現在使用中）
OPENAI_API_KEY=sk-...

# Google Sheets API（データ保存用）
GOOGLE_CREDENTIALS={...}
GOOGLE_SPREADSHEET_ID=...

# AIプロバイダー選択（LocalLLM切り替え用）
AI_PROVIDER=openai  # 'openai', 'claude', 'local'
```

---

## 📝 次のステップ（LocalLLM置き換え）

### Phase 1: 環境準備
1. LocalLLMサーバーの起動確認（Ollama/LM Studio等）
2. 環境変数 `AI_PROVIDER=local` の設定
3. `LOCAL_LLM_API_URL` の設定

### Phase 2: 基本分類の置き換え
1. `lib/ai-providers.js` の `classifyWithLocal()` を実装
2. `/api/classify.js` の動作確認

### Phase 3: 高度分類の置き換え
1. `/api/classify-advanced.js` の置き換え
2. 長文の要素分解機能の動作確認

### Phase 4: レポート生成の置き換え
1. `/api/generate-report.js` の置き換え
2. または簡易版レポートへの変更

### Phase 5: テスト・最適化
1. 全機能の動作確認
2. プロンプトの最適化
3. エラーハンドリングの強化

---

## 📚 参考ドキュメント

- `MULTAS_SPECIFICATION.md` - 詳細仕様書
- `MULTAS_DESIGN.md` - 設計書
- `CODE_STRUCTURE.md` - コード構造
- `multas-v3-vercel/docs/V3_MISSING_FEATURES.md` - 未実装機能リスト

---

## 💡 重要なポイント

1. **既にLocalLLM対応の設計が存在する**
   - `lib/ai-providers.js` に抽象化レイヤーが実装済み
   - 環境変数で切り替え可能な設計

2. **AI呼び出しは全てAPI経由**
   - フロントエンドから直接OpenAIを呼び出していない
   - サーバーサイドのAPIエンドポイント経由
   - 置き換え作業は主にAPIエンドポイントに集中

3. **プロンプト設計が明確**
   - 各APIエンドポイントで使用するプロンプトが明確に定義されている
   - LocalLLMでも同様のプロンプトで動作する可能性が高い

4. **フォールバック機能あり**
   - キーワードベースの分類が実装済み
   - AIが利用できない場合の代替手段がある

---

**作成日**: 2025年1月
**目的**: LocalLLMへの置き換え作業のための全体像把握


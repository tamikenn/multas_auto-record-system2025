# MULTAs v3.5 - 地域医療実習記録システム

## 概要
MULTAs（Multi-dimensional Learning Tracking and Assessment System）は、医学部地域医療実習において学生の体験を記録・分類・可視化するWebアプリケーションです。

## 主な機能

### 学生向け
- **体験記録**: 実習中の気づきをテキストで記録
- **AI自動分類**: LocalLLM（Ollama）による12カテゴリへの自動分類
- **レポート生成**: レーダーチャートによる学習傾向の可視化
- **共有機能**: 「みんなの学び」で他の学生と体験を共有

### 教員向け
- **学生一覧**: 施設別にソートされた学生リスト
- **アクティビティステータス**: 最終投稿時刻による色分け表示
- **個別詳細**: タイムライン/リスト/レポートの3つのビュー
- **いいね機能**: 共有投稿へのフィードバック

### 施設向け
- **日付別ビュー**: 週間カレンダーで実習生を確認
- **学生別ビュー**: 担当学生の投稿を一覧表示

### 管理者向け
- **ユーザー管理**: 学生・教員・施設アカウントの作成
- **パスワードリセット**: ユーザーパスワードの変更

## 技術スタック
- **フロントエンド**: Next.js (React)
- **バックエンド**: Next.js API Routes
- **データストレージ**: ローカルExcel（ExcelJS）
- **AI分類**: Ollama（qwen2.5:7b）
- **外部アクセス**: Cloudflare Tunnel

## セットアップ

### 1. 依存関係のインストール
```bash
cd multas-v3-vercel
npm install
```

### 2. 環境変数の設定
`.env.local` を作成:
```bash
# AI Provider (local = Ollama)
AI_PROVIDER=local
LOCAL_LLM_API_URL=http://localhost:11434/api/generate
LOCAL_LLM_MODEL_CLASSIFY=qwen2.5:7b
LOCAL_LLM_MODEL_DECOMPOSE=qwen2.5:7b

# Storage (excel = ローカルExcel)
STORAGE_MODE=excel
```

### 3. Ollamaの起動
```bash
ollama run qwen2.5:7b
```

### 4. 開発サーバー起動
```bash
npm run dev
```

http://localhost:3000 でアクセス

### 5. 外部公開（Cloudflare Tunnel）
```bash
cloudflared tunnel run multas-app
```

## ユーザーロール
| ロール | 説明 | デフォルトページ |
|--------|------|------------------|
| admin | 管理者 | /mobile-input-tabs |
| teacher | 教員 | /teacher-dashboard |
| facility | 協力施設 | /facility-view |
| student | 学生 | /mobile-input-tabs |

## 12カテゴリ分類
| 番号 | カテゴリ名 | 説明 |
|------|-----------|------|
| 1 | 医療倫理 | ルール、モラル、規範、法律 |
| 2 | 地域医療 | 地域の特異性、病院外×医療 |
| 3 | 医学的知識 | 疾患各論、症候論、臨床医学 |
| 4 | 診察・手技 | 問診、触診、聴診、各種手技 |
| 5 | 問題解決能力 | 分析力、思考力、判断力 |
| 6 | 統合的臨床能力 | 臨床能力全般の統合性 |
| 7 | 多職種連携 | 院内スタッフとの関わり |
| 8 | コミュニケーション | 人間としてのコミュニケーション |
| 9 | 一般教養 | 医学知識以外の知識 |
| 10 | 保健・福祉 | 訪問介護、デイサービス等 |
| 11 | 行政 | 医療・保健・福祉の行政 |
| 12 | 社会医学 | 社会医学全般の統合性 |

## ディレクトリ構成
```
multas-v3-vercel/
├── pages/
│   ├── index.js              # エントリーポイント
│   ├── mobile-input-tabs.js  # 学生用メイン画面
│   ├── teacher-dashboard.js  # 教員用ダッシュボード
│   ├── facility-view.js      # 施設用ダッシュボード
│   ├── admin.js              # 管理者画面
│   └── api/                   # APIエンドポイント
├── lib/
│   ├── auth.js               # 認証ユーティリティ
│   ├── classification-config.js # AI分類設定
│   └── categories.js         # カテゴリ定義
├── data/
│   ├── multas_posts.xlsx     # 投稿データ
│   ├── users.json            # ユーザーデータ
│   ├── shared-posts.json     # 共有投稿データ
│   └── backups/              # 自動バックアップ
└── components/
    └── RadarChart.js         # レーダーチャート
```

## バージョン履歴
- **v3.5** (2026-02-28): 教員ダッシュボード追加、施設順ソート、いいね機能
- **v3.4**: Cloudflare Tunnel統合、ローカルExcelバックエンド
- **v3.3**: 認証システム、パスワード変更機能
- **v3.2**: LocalLLM（Ollama）対応

## ライセンス
Private - 旭川医科大学

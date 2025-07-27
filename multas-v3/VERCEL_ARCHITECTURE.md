# MULTAs v3 Vercel アーキテクチャ

## なぜVercelか？

1. **開発効率**
   - ローカルで完全動作確認
   - `npm run dev` で即座にテスト
   - エラーが分かりやすい

2. **セキュリティ**
   - 環境変数でAPIキー管理
   - サーバーサイドでデータ処理

3. **拡張性**
   - データベース連携が簡単
   - 将来的な機能追加が容易

## 基本構成

```
multas-v3-vercel/
├── pages/
│   ├── index.js          # メインページ
│   └── api/
│       ├── auth.js       # ログイン認証
│       ├── posts.js      # 投稿の保存/取得
│       └── ai-classify.js # AI分類
├── components/
│   ├── LoginForm.js
│   ├── InputForm.js
│   └── TabView.js
├── lib/
│   ├── database.js       # データ保存（最初はJSONファイル）
│   └── openai.js         # OpenAI連携
└── package.json
```

## 段階的実装

### Phase 1: 最小構成（1日で完成可能）
```javascript
// pages/api/posts.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    // データをJSONファイルに保存
    const { user, text } = req.body;
    const timestamp = new Date();
    
    // data/posts.json に追記
    saveToFile({ user, text, timestamp });
    
    res.status(200).json({ success: true });
  }
}
```

### Phase 2: データベース追加（後から）
- Vercel Postgres（無料枠あり）
- Supabase（無料枠あり）
- MongoDB Atlas（無料枠あり）

## メリット

1. **今すぐ始められる**
   ```bash
   npx create-next-app multas-v3-vercel
   cd multas-v3-vercel
   npm run dev
   ```

2. **デプロイが簡単**
   ```bash
   vercel
   ```

3. **環境変数管理**
   ```
   OPENAI_API_KEY=sk-...
   DATABASE_URL=...
   ```

4. **ローカルテスト**
   - 全機能をローカルで確認
   - 本番と同じ環境

## 移行パス

1. **現在のGitHub Pages版**
   - そのまま残す（バックアップ）

2. **Vercel版を並行開発**
   - 新しいリポジトリで開始
   - 機能を段階的に移植

3. **データ移行**
   - エクスポート/インポート機能
   - 必要に応じて
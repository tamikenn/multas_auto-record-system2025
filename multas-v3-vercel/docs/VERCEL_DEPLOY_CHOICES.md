# Vercelデプロイ時の選択肢ガイド

## コマンド実行
```bash
cd /Users/kentarotamiya/claude_code_workspace/multas-v2-vercel/github-pages/multas-v3-vercel
vercel
```

## 選択肢と推奨回答

### 1. Set up and deploy "./multas-v3-vercel"?
**回答**: `y` (Yes)

### 2. Which scope should contain your project?
**回答**: あなたのアカウント名を選択（例: CySA）

### 3. Link to existing project?
**回答**: `n` (No) ※新規プロジェクトとして作成

### 4. What's the name of your project?
**回答**: `multas-v3` または任意のプロジェクト名

### 5. In which directory is your code located?
**回答**: `./` (Enter押すだけでOK)

### 6. Want to modify these settings?
**回答**: `n` (No)

## デプロイ後の手順

1. **環境変数の設定**
   - Vercelダッシュボード（https://vercel.com/dashboard）にアクセス
   - プロジェクトを選択
   - Settings → Environment Variables
   - 以下を追加：
     - `OPENAI_API_KEY`
     - `GOOGLE_SPREADSHEET_ID`
     - `GOOGLE_CREDENTIALS`

2. **本番環境へのデプロイ**
   ```bash
   vercel --prod
   ```

## 注意事項
- デプロイ中にビルドエラーが発生した場合は、エラーメッセージを確認してください
- 環境変数を設定しないとAPIが動作しません
- デプロイ完了後、提供されるURLでアプリケーションにアクセスできます
# Vercelデプロイ手順

## ステップ1: Vercelにログイン
ターミナルで以下を実行：
```bash
vercel login
```
メールアドレスを入力し、認証メールのリンクをクリックしてください。

## ステップ2: プロジェクトをデプロイ
ログイン後、プロジェクトディレクトリで：
```bash
cd /Users/kentarotamiya/claude_code_workspace/multas-v2-vercel/github-pages/multas-v3-vercel
vercel
```

以下の質問に答えてください：
- Set up and deploy? → Yes
- Which scope? → お使いのアカウントを選択
- Link to existing project? → No（新規の場合）
- Project name? → multas-v3（または任意の名前）
- In which directory is your code located? → ./（デフォルト）

## ステップ3: 環境変数の設定
デプロイ後、Vercelダッシュボード（https://vercel.com/dashboard）で：
1. プロジェクトを選択
2. Settings → Environment Variables
3. 以下を追加：
   - `OPENAI_API_KEY`
   - `GOOGLE_SPREADSHEET_ID`
   - `GOOGLE_CREDENTIALS`

## ステップ4: 再デプロイ
環境変数設定後：
```bash
vercel --prod
```

デプロイ完了後、提供されるURLでアプリケーションにアクセスできます。
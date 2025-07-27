# Vercelデプロイ手順

## 1. Vercel CLIのインストール（未インストールの場合）
```bash
npm i -g vercel
```

## 2. デプロイコマンド
```bash
vercel
```

## 3. 環境変数の設定
Vercelダッシュボードで以下の環境変数を設定：

- `OPENAI_API_KEY`: OpenAI APIキー
- `GOOGLE_SPREADSHEET_ID`: Google SpreadsheetのID
- `GOOGLE_CREDENTIALS`: Google Service Accountの認証情報（JSON形式）

## 4. プロダクションデプロイ
```bash
vercel --prod
```

## 注意事項
- `.env.local`ファイルは`.gitignore`に含めてください
- 環境変数はVercelのダッシュボードから安全に設定してください
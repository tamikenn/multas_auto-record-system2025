# MULTAs v3 Vercel - API検証版

## 目的
OpenAI APIとGoogle Sheets APIが確実に動作することを検証する最小構成

## セットアップ手順

### 1. 環境変数の設定
`.env.example` を `.env.local` にコピーして、以下を設定：

```bash
cp .env.example .env.local
```

#### OpenAI API
1. https://platform.openai.com/api-keys でAPIキーを取得
2. `OPENAI_API_KEY` に設定

#### Google Sheets API
1. Google Cloud Consoleでプロジェクト作成
2. Google Sheets APIを有効化
3. Service Accountを作成
4. JSONキーをダウンロード
5. `GOOGLE_CREDENTIALS` にJSON内容を1行で設定
6. スプレッドシートを作成し、Service AccountのメールアドレスをEditorとして共有
7. `GOOGLE_SPREADSHEET_ID` にスプレッドシートIDを設定

### 2. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

### 3. API動作確認

1. **OpenAI API**: テキストを入力して12時計分類をテスト
2. **Google Sheets API**: データがスプレッドシートに保存されることを確認

## トラブルシューティング

### OpenAI APIエラー
- APIキーが正しいか確認
- APIの使用量制限に達していないか確認

### Google Sheets APIエラー
- Service Accountがスプレッドシートにアクセス権限があるか確認
- JSONフォーマットが正しいか確認（1行にする必要あり）

## 次のステップ

両方のAPIが動作確認できたら：
1. ログイン機能の実装
2. 入力フォームの実装（モバイル対応）
3. データの紐付けと保存
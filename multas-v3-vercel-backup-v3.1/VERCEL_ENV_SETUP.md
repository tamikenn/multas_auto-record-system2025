# Vercel環境変数設定手順

## 1. Vercelダッシュボードにアクセス

1. https://vercel.com にアクセス
2. プロジェクト `multas-v3` を選択
3. Settings タブをクリック
4. Environment Variables をクリック

## 2. 以下の環境変数を追加

### OPENAI_API_KEY
- Key: `OPENAI_API_KEY`
- Value: （.env.localの値をコピー）
- Environment: Production, Preview, Development すべてにチェック

### GOOGLE_SPREADSHEET_ID
- Key: `GOOGLE_SPREADSHEET_ID`
- Value: `1lQ7rOK01BD5pVTusCEsL0wXq8CIbgjXG_o8QHe_hbp0`
- Environment: Production, Preview, Development すべてにチェック

### GOOGLE_CREDENTIALS
- Key: `GOOGLE_CREDENTIALS`
- Value: （.env.localの値をコピー - 1行のJSON文字列）
- Environment: Production, Preview, Development すべてにチェック

## 3. 再デプロイ

環境変数を設定後、再デプロイが必要です：

```bash
vercel --prod
```

または、Vercelダッシュボードから：
1. Deployments タブ
2. 最新のデプロイの「...」メニュー
3. 「Redeploy」をクリック

## 現在のデプロイURL

https://multas-v3.vercel.app

## 注意事項

- 環境変数はVercel側で暗号化されて保存されます
- APIキーは定期的に更新することを推奨します
- Google Sheetsの共有設定を確認してください
# Google Sheets設定確認リスト

## 1. サービスアカウントの権限確認

Google Sheetsを開いて以下を確認：

1. 対象のスプレッドシートを開く
2. 右上の「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（`xxxxx@xxxxx.iam.gserviceaccount.com`）が追加されているか確認
4. 権限が「編集者」になっているか確認

もし追加されていない場合：
1. 「共有」画面でサービスアカウントのメールアドレスを入力
2. 権限を「編集者」に設定
3. 「送信」をクリック

## 2. スプレッドシートIDの確認

スプレッドシートのURLから正しいIDを取得：
```
https://docs.google.com/spreadsheets/d/【ここがスプレッドシートID】/edit
```

## 3. 環境変数の確認

Vercelダッシュボードで：
- `GOOGLE_SPREADSHEET_ID`: スプレッドシートIDのみ（URLではない）
- `GOOGLE_CREDENTIALS`: JSON全体が1行で設定されているか
- `OPENAI_API_KEY`: OpenAIのAPIキー

## 4. Google Cloud Consoleの確認

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. 正しいプロジェクトが選択されているか確認
3. 「APIとサービス」→「有効なAPI」でGoogle Sheets APIが有効になっているか確認

## 5. サービスアカウントの確認

1. 「IAMと管理」→「サービスアカウント」
2. 使用しているサービスアカウントが存在するか確認
3. キーが有効か確認
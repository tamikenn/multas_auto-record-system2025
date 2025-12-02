# サーバー起動ガイド

## 現在の状況

- ✅ LocalLLM実装完了
- ✅ 環境変数設定完了
- ✅ Node.js/npmインストール完了
- ✅ 依存関係インストール完了
- ⏳ サーバー起動確認中

## サーバー起動方法

### 方法1: 新しいPowerShellウィンドウで起動（推奨）

1. **新しいPowerShellウィンドウを開く**

2. **以下のコマンドを実行**：

```powershell
# プロジェクトディレクトリに移動
cd C:\projects\multas_auto-record-system2025\multas-v3-vercel

# 環境変数を再読み込み（必要に応じて）
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 開発サーバーを起動
npm run dev
```

3. **起動メッセージを確認**：
   - `ready - started server on 0.0.0.0:3000` と表示されれば成功
   - エラーメッセージが表示された場合は内容を確認

4. **ブラウザでアクセス**：
   - `http://localhost:3000` にアクセス

### 方法2: 現在のウィンドウで起動

現在のPowerShellウィンドウで：

```powershell
cd C:\projects\multas_auto-record-system2025\multas-v3-vercel
npm run dev
```

## 起動時の確認ポイント

### 正常な起動メッセージ例

```
> multas-v3-vercel@0.1.0 dev
> next dev

  ▲ Next.js 14.2.0
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### エラーが出る場合

#### エラー1: ポート3000が使用中
```
Error: listen EADDRINUSE: address already in use :::3000
```
**解決方法**: 他のプロセスを終了するか、別のポートを使用

#### エラー2: モジュールが見つからない
```
Error: Cannot find module 'xxx'
```
**解決方法**: `npm install` を再実行

#### エラー3: 環境変数の読み込みエラー
```
Error: Environment variable not found
```
**解決方法**: `.env.local` ファイルが正しく配置されているか確認

## 動作確認

サーバーが起動したら：

1. **ブラウザで `http://localhost:3000` にアクセス**
2. **ログイン画面が表示されることを確認**
3. **ログインして実習記録を入力**
4. **分類結果が表示されることを確認**

## トラブルシューティング

### サーバーが起動しない場合

1. **Node.jsのバージョン確認**：
   ```powershell
   node --version
   npm --version
   ```

2. **依存関係の再インストール**：
   ```powershell
   npm install
   ```

3. **ポートの使用状況確認**：
   ```powershell
   netstat -ano | findstr :3000
   ```

4. **Next.jsのキャッシュクリア**：
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

---

**作成日**: 2025年12月2日


# MULTAs v2.3.1 コード構造ドキュメント

## ファイル構成
- `index.html` - 単一ファイルアプリケーション（HTML + CSS + JavaScript）

## コード構造

### 1. HTML構造（1-2012行）
```
<head>
  - メタタグ、ライブラリ読み込み
  - インラインCSS（15-1616行）
</head>
<body>
  - ログインモーダル
  - メインコンテンツ
    - ユーザー情報表示
    - タブナビゲーション
    - 4つのモニター（LOG、LIST、REPORT、みんなの学び）
  - 入力エリア（monitor1-input）
</body>
```

### 2. CSS構造（15-1616行）
- ベーススタイル
- 共通コンポーネント
  - ボタン、カード、フォーム
- 各画面固有のスタイル
- レスポンシブ対応（1255-1615行）

### 3. JavaScript構造（2013-5566行）

#### グローバル状態管理
```javascript
const AppState = {
    records: [],          // 投稿記録
    currentMonitor: '',   // 現在の画面
    currentDay: 1,        // 現在の日付
    userLevel: 1,         // ユーザーレベル
    // ...
};
```

#### 主要モジュール

1. **Storage** - LocalStorage管理（2691-2748行）
   - save() - ゲームデータ保存
   - load() - ゲームデータ読み込み
   - saveUser() - ユーザー情報保存
   - loadUser() - ユーザー情報読み込み

2. **AI統合** 
   - classifyWithAI() - OpenAI APIでの分類（2942-3019行）
   - classifyWithMultipleElements() - 長文の要素分解（2751-2792行）

3. **UI管理**
   - switchMonitor() - タブ切り替え（2341-2409行）
   - updateRecordsList() - LOG画面更新（3052-3122行）
   - updateOrganizedView() - LIST画面更新（3125-3275行）
   - updateRadarChart() - レーダーチャート更新（3395-3509行）

4. **データ処理**
   - submitExperience() - 投稿処理（2189-2328行）
   - generateDailyReport() - デイリーレポート生成（3565-3719行）
   - generateSummaryReport() - 総合レポート生成（3844-3899行）

#### イベントハンドラ
- ログイン処理（4595-4648行）
- キーボードショートカット（4824-4881行）
- タブ切り替え
- 投稿送信

## 主要な機能

### 1. 投稿管理
- テキスト入力→AI分類→記録保存→UI更新

### 2. レベルシステム
- 投稿数に応じてレベルアップ
- 経験値バーの表示

### 3. レポート生成
- 10投稿以上でAIレポート生成可能
- 12時計分類のレーダーチャート

### 4. データ永続化
- LocalStorageで全データを保存
- ページリロード後も継続

## 改善点

### 完了
- ✅ 不要なconsole.log削除
- ✅ LocalStorage操作の統一
- ✅ 定数の整理
- ✅ グローバル変数の構造化

### 今後の課題
- [ ] CSSの共通化（ボタン、カード）
- [ ] 長い関数の分割
- [ ] エラーハンドリングの統一
- [ ] TypeScript化の検討

## デプロイ
- GitHub Pages（静的ホスティング）
- 単一HTMLファイルのため設定不要
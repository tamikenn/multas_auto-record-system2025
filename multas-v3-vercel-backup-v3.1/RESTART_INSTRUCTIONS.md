# Claude Code 再開用指示書

## 🚀 作業再開時のコメント例

### オプション1: 簡潔版
```
MULTAs v3の開発を再開します。
現在の状態: /Users/kentarotamiya/claude_code_workspace/multas-v2-vercel/github-pages/multas-v3-vercel
チェックポイント: CHECKPOINT_20250726.md
次の実装: レベル・経験値システム（V3_MISSING_FEATURES.mdのPhase 1）
```

### オプション2: 詳細版
```
MULTAs v3プロジェクトの続きをお願いします。

現在の状態:
- 作業ディレクトリ: /Users/kentarotamiya/claude_code_workspace/multas-v2-vercel/github-pages/multas-v3-vercel
- Vercel URL: https://multas-v3.vercel.app
- チェックポイント文書: CHECKPOINT_20250726.md を参照
- 未実装機能リスト: docs/V3_MISSING_FEATURES.md を参照

次に実装したい機能:
1. レベル・経験値システム（優先度：高）
2. 日付管理システム（1日目〜5日目）

環境変数は.env.localに設定済みです。
```

### オプション3: 特定機能の実装依頼
```
MULTAs v3にレベル・経験値システムを実装してください。

参考情報:
- プロジェクト: /Users/kentarotamiya/claude_code_workspace/multas-v2-vercel/github-pages/multas-v3-vercel
- メインファイル: pages/mobile-input-tabs.js
- 仕様: docs/V3_MISSING_FEATURES.md の「レベル・経験値システム」セクション

要件:
- 投稿ごとに100/現在レベルのEXP獲得
- レベルアップアニメーション
- LocalStorageでレベル/EXP永続化
```

## 📋 Claude Codeが確認すべきファイル

1. **CHECKPOINT_20250726.md** - 現在の状態と構成
2. **docs/V3_MISSING_FEATURES.md** - 未実装機能の詳細
3. **pages/mobile-input-tabs.js** - メインアプリケーション
4. **lib/storage.js** - データ永続化の参考

## 🔑 重要な情報

- **作業ディレクトリ**: `/Users/kentarotamiya/claude_code_workspace/multas-v2-vercel/github-pages/multas-v3-vercel`
- **Vercel プロジェクト**: multas-v3
- **本番URL**: https://multas-v3.vercel.app
- **開発サーバー**: `npm run dev` (ポート3000)

## 💡 推奨される再開方法

1. 最初にCHECKPOINT_20250726.mdを読んでもらう
2. 実装したい機能を明確に指定
3. 必要に応じてV3_MISSING_FEATURES.mdの該当セクションを参照

## 🛠️ よく使うコマンド

```bash
# 開発サーバー起動
cd /Users/kentarotamiya/claude_code_workspace/multas-v2-vercel/github-pages/multas-v3-vercel
npm run dev

# Vercelデプロイ
vercel --prod

# バックアップから復元
cp -r /Users/kentarotamiya/claude_code_workspace/multas-v3-checkpoint-20250726/* .
```

---

この指示書を使えば、Claude Codeは素早く現在の状態を把握し、
作業を継続できます。
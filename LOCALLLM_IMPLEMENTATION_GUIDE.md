# LocalLLM実装ガイド

## ✅ 実装完了内容

### 1. モデルインストール
- ✅ `qwen2.5:7b` - 分類タスク用（高速・軽量）
- ✅ `qwen2.5:14b` - レポート生成・要素分解用（高品質）

### 2. コード実装
- ✅ `lib/ai-providers.js` - `classifyWithLocal()` メソッド実装
- ✅ `pages/api/classify.js` - LocalLLM対応
- ✅ `pages/api/classify-advanced.js` - LocalLLM対応（要素分解含む）
- ✅ `pages/api/generate-report.js` - LocalLLM対応
- ✅ `pages/api/generate-category-summary.js` - LocalLLM対応

### 3. 環境変数設定ファイル
- ✅ `.env.local.example` 作成

---

## 🚀 セットアップ手順

### Step 1: Ollamaの起動確認

```bash
# Ollamaが起動しているか確認
ollama list

# モデルがインストールされているか確認
# 以下の2つが表示されればOK
# - qwen2.5:7b
# - qwen2.5:14b
```

### Step 2: 環境変数の設定

`multas-v3-vercel` ディレクトリに `.env.local` ファイルを作成：

```bash
cd multas-v3-vercel
copy .env.local.example .env.local
```

`.env.local` を編集：

```bash
# LocalLLMを使用する設定
AI_PROVIDER=local
LOCAL_LLM_API_URL=http://localhost:11434/api/generate
LOCAL_LLM_MODEL_CLASSIFY=qwen2.5:7b
LOCAL_LLM_MODEL_REPORT=qwen2.5:14b
```

### Step 3: 開発サーバーの起動

```bash
cd multas-v3-vercel
npm run dev
```

### Step 4: 動作確認

1. ブラウザで `http://localhost:3000` にアクセス
2. ログインして、実習記録を入力
3. 分類結果が正しく表示されるか確認
4. 長文（200文字以上）を入力して、要素分解が動作するか確認
5. レポート生成機能をテスト

---

## 🔧 トラブルシューティング

### 問題1: Ollamaに接続できない

**症状**: `Ollama API error: 500` などのエラー

**解決方法**:
```bash
# Ollamaが起動しているか確認
# Windowsの場合、Ollamaアプリが起動している必要があります

# 手動でOllamaを起動
# スタートメニューから「Ollama」を起動

# または、コマンドラインから
ollama serve
```

### 問題2: モデルが見つからない

**症状**: `model not found` エラー

**解決方法**:
```bash
# モデルを再インストール
ollama pull qwen2.5:7b
ollama pull qwen2.5:14b
```

### 問題3: 分類結果が不正確

**症状**: 分類カテゴリが期待と異なる

**解決方法**:
- プロンプトを調整する（`lib/ai-providers.js` の `getPrompt()` メソッド）
- より大きなモデルを使用する（`qwen2.5:14b` を分類にも使用）

### 問題4: レスポンスが遅い

**症状**: 分類に時間がかかる

**解決方法**:
- 分類タスクには `qwen2.5:7b` を使用（既に設定済み）
- GPU使用率を確認（タスクマネージャーで確認）
- VRAMが不足している場合は、モデルサイズを小さくする

---

## 📊 パフォーマンス最適化

### モデル選択の推奨

| タスク | 推奨モデル | 理由 |
|--------|-----------|------|
| 分類（短文） | `qwen2.5:7b` | 高速、十分な精度 |
| 分類（長文） | `qwen2.5:7b` | 高速、十分な精度 |
| 要素分解 | `qwen2.5:14b` | より複雑なタスクに対応 |
| レポート生成 | `qwen2.5:14b` | 高品質な文章生成 |

### 環境変数での切り替え

すべてのタスクに同じモデルを使用したい場合：

```bash
# .env.local
LOCAL_LLM_MODEL_CLASSIFY=qwen2.5:14b
LOCAL_LLM_MODEL_REPORT=qwen2.5:14b
```

より高速にしたい場合：

```bash
# .env.local
LOCAL_LLM_MODEL_CLASSIFY=qwen2.5:7b
LOCAL_LLM_MODEL_REPORT=qwen2.5:7b
```

---

## 🔄 OpenAIとの切り替え

### LocalLLMからOpenAIに戻す場合

`.env.local` を編集：

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### OpenAIからLocalLLMに切り替える場合

`.env.local` を編集：

```bash
AI_PROVIDER=local
LOCAL_LLM_API_URL=http://localhost:11434/api/generate
LOCAL_LLM_MODEL_CLASSIFY=qwen2.5:7b
LOCAL_LLM_MODEL_REPORT=qwen2.5:14b
```

---

## 📝 実装の詳細

### APIエンドポイントの動作

1. **`/api/classify.js`**
   - 環境変数 `AI_PROVIDER` を確認
   - `local` の場合は Ollama API を呼び出し
   - `openai` の場合は OpenAI API を呼び出し
   - APIキーが設定されていない場合は自動的にLocalLLMにフォールバック

2. **`/api/classify-advanced.js`**
   - 200文字以上の長文は要素分解
   - 要素分解には `LOCAL_LLM_MODEL_REPORT` を使用（14Bモデル）
   - 各要素の分類には `LOCAL_LLM_MODEL_CLASSIFY` を使用（7Bモデル）

3. **`/api/generate-report.js`**
   - レポート生成には `LOCAL_LLM_MODEL_REPORT` を使用（14Bモデル）
   - 300-400文字の振り返りレポートを生成

---

## 🎯 次のステップ

1. ✅ 実装完了
2. ⏳ 環境変数の設定
3. ⏳ 動作確認
4. ⏳ パフォーマンステスト
5. ⏳ 必要に応じてプロンプトの最適化

---

## 📚 参考情報

- [Ollama公式ドキュメント](https://ollama.ai/docs)
- [Qwen2.5モデル情報](https://huggingface.co/Qwen)
- プロジェクトサマリー: `PROJECT_SUMMARY.md`
- モデル選択ガイド: `LOCALLLM_MODEL_SELECTION.md`


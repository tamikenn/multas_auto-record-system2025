import React, { useState } from 'react';
import Head from 'next/head';

export default function TestAI() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAI = async () => {
    if (!text.trim()) {
      setError('テキストを入力してください');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 1. AI分類をテスト
      const classifyResponse = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      });

      const classifyData = await classifyResponse.json();
      
      // 2. Google Sheetsに保存
      const saveResponse = await fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toLocaleString('ja-JP'),
          username: 'テストユーザー',
          text: text.trim(),
          category: classifyData.category || 0,
          reason: classifyData.reason || 'AI分類失敗'
        })
      });

      const saveData = await saveResponse.json();

      setResult({
        classify: classifyData,
        save: saveData,
        success: saveResponse.ok && classifyResponse.ok
      });

    } catch (err) {
      setError('エラー: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI分類テスト</title>
      </Head>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h1>AI分類テストページ</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h2>1. テキストを入力</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例: 心電図の読み方を学んだ"
            style={{
              width: '100%',
              height: '100px',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <button
          onClick={testAI}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'テスト中...' : 'テスト実行'}
        </button>

        {error && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px'
          }}>
            <h3>エラー</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div style={{ marginTop: '20px' }}>
            <h2>2. AI分類結果</h2>
            <div style={{
              padding: '10px',
              backgroundColor: result.classify.error ? '#ffebee' : '#e8f5e9',
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              <p><strong>カテゴリー:</strong> {result.classify.category}</p>
              <p><strong>理由:</strong> {result.classify.reason}</p>
              {result.classify.error && (
                <p><strong>エラー:</strong> {result.classify.error}</p>
              )}
            </div>

            <h2>3. Google Sheets保存結果</h2>
            <div style={{
              padding: '10px',
              backgroundColor: result.save.error ? '#ffebee' : '#e8f5e9',
              borderRadius: '4px'
            }}>
              <p><strong>ステータス:</strong> {result.save.message || result.save.error}</p>
            </div>

            <h2>4. 全体結果</h2>
            <div style={{
              padding: '10px',
              backgroundColor: result.success ? '#e8f5e9' : '#ffebee',
              borderRadius: '4px'
            }}>
              <p>{result.success ? '✅ 成功' : '❌ 失敗'}</p>
            </div>

            <details style={{ marginTop: '20px' }}>
              <summary>詳細なレスポンス（デバッグ用）</summary>
              <pre style={{
                backgroundColor: '#f5f5f5',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </>
  );
}
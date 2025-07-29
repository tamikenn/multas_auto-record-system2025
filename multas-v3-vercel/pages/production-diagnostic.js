import { useState } from 'react';

export default function ProductionDiagnostic() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAITest = async () => {
    setLoading(true);
    try {
      const testTexts = [
        '今日は患者さんとのコミュニケーションについて学びました。',
        '血圧測定の手技を練習しました。',
        '地域医療について講義を受けました。'
      ];

      const results = [];
      
      for (let i = 0; i < testTexts.length; i++) {
        const text = testTexts[i];
        console.log(`テスト${i + 1}開始:`, text);
        
        try {
          const response = await fetch('/api/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          });
          
          const result = await response.json();
          console.log(`テスト${i + 1}結果:`, result);
          
          results.push({
            testNumber: i + 1,
            text,
            success: response.ok,
            status: response.status,
            result,
            timestamp: new Date().toLocaleString()
          });
          
          // 1秒待機（API制限対策）
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`テスト${i + 1}エラー:`, error);
          results.push({
            testNumber: i + 1,
            text,
            success: false,
            error: error.message,
            timestamp: new Date().toLocaleString()
          });
        }
      }
      
      setTestResult(results);
      
    } catch (error) {
      console.error('診断エラー:', error);
      setTestResult([{ error: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🔍 本番環境 AI API 診断</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAITest}
          disabled={loading}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'AI API テスト実行中...' : '🚀 AI API テストを開始'}
        </button>
        
        <a 
          href="/mobile-input-tabs"
          style={{
            display: 'inline-block',
            marginLeft: '15px',
            padding: '15px 30px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px'
          }}
        >
          ← メインアプリに戻る
        </a>
      </div>

      {loading && (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <p>AI APIをテストしています...</p>
          <p>複数のテキストで分類をテストします。</p>
        </div>
      )}

      {testResult && (
        <div>
          <h2>📊 テスト結果</h2>
          
          {testResult.map((test, index) => (
            <div key={index} style={{ 
              margin: '20px 0', 
              padding: '15px', 
              border: `2px solid ${test.success ? '#4CAF50' : '#F44336'}`,
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <h3 style={{ color: test.success ? '#4CAF50' : '#F44336' }}>
                テスト {test.testNumber} - {test.success ? '成功' : '失敗'}
              </h3>
              
              <p><strong>テキスト:</strong> {test.text}</p>
              <p><strong>時刻:</strong> {test.timestamp}</p>
              
              {test.success ? (
                <div>
                  <p><strong>分類結果:</strong> カテゴリ {test.result.category}</p>
                  <p><strong>理由:</strong> {test.result.reason}</p>
                  <p><strong>ステータス:</strong> {test.status}</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#F44336' }}><strong>エラー:</strong> {test.error || 'API呼び出し失敗'}</p>
                  {test.result && (
                    <p style={{ color: '#F44336' }}><strong>詳細:</strong> {JSON.stringify(test.result)}</p>
                  )}
                </div>
              )}
              
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>詳細情報</summary>
                <pre style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '10px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(test, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: '40px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h3>📝 この診断について</h3>
        <p>本番環境でAI APIの動作を確認します：</p>
        <ul>
          <li>複数のテキストでAI分類をテスト</li>
          <li>API応答時間と成功率を測定</li>
          <li>エラーパターンを特定</li>
          <li>ユーザー間での動作差異を調査</li>
        </ul>
        <p><strong>目的:</strong> なぜ一部のユーザーでAI分類が失敗するかを特定</p>
      </div>
    </div>
  );
}
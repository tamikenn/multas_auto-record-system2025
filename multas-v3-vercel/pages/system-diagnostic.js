import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';

export default function SystemDiagnostic() {
  const [diagnosticResults, setDiagnosticResults] = useState({});
  const [loading, setLoading] = useState(false);

  // システム診断を実行
  const runDiagnostic = async () => {
    setLoading(true);
    const results = {};

    try {
      console.log('=== システム診断開始 ===');
      
      // 1. ローカルストレージの診断
      console.log('ローカルストレージ診断中...');
      results.localStorage = await diagnoseLocalStorage();

      // 2. Google Sheets API の診断
      console.log('Google Sheets API診断中...');
      results.googleSheets = await diagnoseGoogleSheets();

      // 3. OpenAI API の診断
      console.log('OpenAI API診断中...');
      results.openaiAPI = await diagnoseOpenAI();

      // 4. ログイン機能の診断
      console.log('ログイン機能診断中...');
      results.loginSystem = await diagnoseLoginSystem();

      setDiagnosticResults(results);
      console.log('=== 診断完了 ===', results);

    } catch (error) {
      console.error('診断エラー:', error);
      results.error = error.message;
      setDiagnosticResults(results);
    } finally {
      setLoading(false);
    }
  };

  // ローカルストレージの診断
  const diagnoseLocalStorage = async () => {
    const result = {
      status: 'checking',
      details: {},
      issues: [],
      recommendations: []
    };

    try {
      // 現在のユーザー情報を確認
      const currentUser = storage.getCurrentUser();
      result.details.currentUser = currentUser;

      // 全ユーザーのデータを確認
      const allUsers = [];
      const storageKeys = Object.keys(localStorage);
      
      storageKeys.forEach(key => {
        if (key.startsWith('multas_v3_posts_')) {
          const username = key.replace('multas_v3_posts_', '');
          const userData = JSON.parse(localStorage.getItem(key) || '[]');
          allUsers.push({
            username,
            postCount: userData.length,
            lastPost: userData[0]?.timestamp || 'なし',
            dataSize: JSON.stringify(userData).length
          });
        }
      });

      result.details.allUsers = allUsers;
      result.details.totalUsers = allUsers.length;

      // 共通のローカルストレージキーを確認
      const commonKeys = [
        'multas_v3_posts',
        'multas_v3_current_user',
        'multas_v3_shared_posts',
        'multas_v3_liked_posts'
      ];

      result.details.commonStorage = {};
      commonKeys.forEach(key => {
        const data = localStorage.getItem(key);
        result.details.commonStorage[key] = {
          exists: !!data,
          size: data ? data.length : 0,
          content: data ? JSON.parse(data) : null
        };
      });

      // 問題の検出
      if (allUsers.length === 0) {
        result.issues.push('ユーザーデータが見つかりません');
        result.recommendations.push('ユーザーがログインして投稿を作成してください');
      }

      if (!currentUser) {
        result.issues.push('現在ログインしているユーザーがいません');
        result.recommendations.push('ログインしてください');
      }

      result.status = result.issues.length > 0 ? 'warning' : 'ok';

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      result.issues.push(`ローカルストレージアクセスエラー: ${error.message}`);
    }

    return result;
  };

  // Google Sheets API の診断
  const diagnoseGoogleSheets = async () => {
    const result = {
      status: 'checking',
      details: {},
      issues: [],
      recommendations: []
    };

    try {
      // 投稿保存のテスト
      const testPost = {
        text: `診断テスト投稿 - ${new Date().toLocaleString()}`,
        category: 1,
        reason: '診断テスト',
        userName: 'システム診断'
      };

      const saveResponse = await fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPost)
      });

      const saveResult = await saveResponse.json();
      result.details.saveTest = {
        success: saveResult.success,
        response: saveResult,
        status: saveResponse.status
      };

      if (!saveResult.success || saveResult.local) {
        result.issues.push('Google Sheets への保存が失敗しています');
        result.recommendations.push('環境変数とGoogle Sheets APIの設定を確認してください');
      }

      // ログイン追跡のテスト
      const loginResponse = await fetch('/api/track-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: 'システム診断', action: 'login' })
      });

      const loginResult = await loginResponse.json();
      result.details.loginTrackingTest = {
        success: loginResult.success,
        response: loginResult,
        status: loginResponse.status
      };

      if (!loginResult.success) {
        result.issues.push('ログイン追跡が機能していません');
        result.recommendations.push('LoginHistoryシートの設定を確認してください');
      }

      result.status = result.issues.length > 0 ? 'warning' : 'ok';

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      result.issues.push(`Google Sheets API エラー: ${error.message}`);
    }

    return result;
  };

  // OpenAI API の診断
  const diagnoseOpenAI = async () => {
    const result = {
      status: 'checking',
      details: {},
      issues: [],
      recommendations: []
    };

    try {
      // 基本的なAI分類テスト
      const testText = '今日は患者さんとのコミュニケーションについて学びました。';
      
      const classifyResponse = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText })
      });

      const classifyResult = await classifyResponse.json();
      result.details.basicClassifyTest = {
        success: classifyResult.success,
        response: classifyResult,
        status: classifyResponse.status,
        testText: testText
      };

      if (!classifyResult.success) {
        result.issues.push('OpenAI API の基本分類が失敗しています');
        result.recommendations.push('OpenAI APIキーと設定を確認してください');
      }

      result.status = result.issues.length > 0 ? 'error' : 'ok';

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      result.issues.push(`OpenAI API エラー: ${error.message}`);
    }

    return result;
  };

  // ログイン機能の診断
  const diagnoseLoginSystem = async () => {
    const result = {
      status: 'checking',
      details: {},
      issues: [],
      recommendations: []
    };

    try {
      // 現在のログイン状態
      const currentUser = storage.getCurrentUser();
      result.details.currentLoginState = {
        loggedIn: !!currentUser,
        username: currentUser
      };

      // ログイン履歴の確認
      const loginHistoryResponse = await fetch('/api/get-login-status');
      if (loginHistoryResponse.ok) {
        const loginHistory = await loginHistoryResponse.json();
        result.details.loginHistory = loginHistory;
        
        if (loginHistory.success) {
          result.details.activeUsers = loginHistory.loggedInUsers?.length || 0;
          result.details.totalUsers = loginHistory.summary?.totalUsers || 0;
        } else {
          result.issues.push('ログイン履歴の取得に失敗しています');
        }
      }

      if (!currentUser) {
        result.issues.push('現在ログインしているユーザーがいません');
        result.recommendations.push('ログインしてください');
      }

      result.status = result.issues.length > 0 ? 'warning' : 'ok';

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      result.issues.push(`ログインシステムエラー: ${error.message}`);
    }

    return result;
  };

  // 結果の表示用コンポーネント
  const ResultSection = ({ title, result }) => {
    if (!result) return null;

    const getStatusColor = (status) => {
      switch (status) {
        case 'ok': return '#4CAF50';
        case 'warning': return '#FF9800';
        case 'error': return '#F44336';
        default: return '#2196F3';
      }
    };

    return (
      <div style={{ 
        margin: '20px 0', 
        padding: '15px', 
        border: `2px solid ${getStatusColor(result.status)}`,
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ color: getStatusColor(result.status) }}>
          {title} - {result.status.toUpperCase()}
        </h3>
        
        {result.issues.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <h4 style={{ color: '#F44336' }}>問題点:</h4>
            <ul>
              {result.issues.map((issue, index) => (
                <li key={index} style={{ color: '#F44336' }}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {result.recommendations.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <h4 style={{ color: '#FF9800' }}>推奨事項:</h4>
            <ul>
              {result.recommendations.map((rec, index) => (
                <li key={index} style={{ color: '#FF9800' }}>{rec}</li>
              ))}
            </ul>
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
            {JSON.stringify(result.details, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔍 MULTAs v3 システム診断</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runDiagnostic}
          disabled={loading}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '診断実行中...' : '🚀 システム診断を開始'}
        </button>
        
        <a 
          href="/"
          style={{
            display: 'inline-block',
            marginLeft: '15px',
            padding: '15px 30px',
            fontSize: '16px',
            backgroundColor: '#666',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px'
          }}
        >
          ← メインページに戻る
        </a>
      </div>

      {loading && (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <p>システムを診断しています...</p>
          <p>この処理には数分かかる場合があります。</p>
        </div>
      )}

      {Object.keys(diagnosticResults).length > 0 && (
        <div>
          <h2>📊 診断結果</h2>
          
          <ResultSection 
            title="ローカルストレージ" 
            result={diagnosticResults.localStorage} 
          />
          
          <ResultSection 
            title="Google Sheets API" 
            result={diagnosticResults.googleSheets} 
          />
          
          <ResultSection 
            title="OpenAI API" 
            result={diagnosticResults.openaiAPI} 
          />
          
          <ResultSection 
            title="ログインシステム" 
            result={diagnosticResults.loginSystem} 
          />

          {diagnosticResults.error && (
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#ffebee', 
              border: '2px solid #F44336',
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <h3 style={{ color: '#F44336' }}>診断エラー</h3>
              <p style={{ color: '#F44336' }}>{diagnosticResults.error}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: '40px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h3>📝 診断について</h3>
        <p>この診断ツールは以下をチェックします:</p>
        <ul>
          <li>ローカルストレージのデータ保存状況</li>
          <li>Google Sheets APIの接続と保存機能</li>
          <li>OpenAI APIの動作状況</li>
          <li>ログインシステムの動作状況</li>
        </ul>
        <p><strong>注意:</strong> この診断はテストデータを作成する場合があります。</p>
      </div>
    </div>
  );
}
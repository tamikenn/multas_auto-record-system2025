import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState({
    localStorage: {},
    networkStatus: 'checking...',
    apiStatus: {},
    lastError: null
  });

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    // LocalStorageの確認
    const localData = {};
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('multas_')) {
          try {
            localData[key] = JSON.parse(localStorage.getItem(key));
          } catch (e) {
            localData[key] = localStorage.getItem(key);
          }
        }
      }
    }

    // API接続テスト
    const apiTests = {
      savePost: await testAPI('/api/save-post', 'POST', {
        text: 'Debug test',
        category: 'test',
        reason: 'Debug',
        userName: 'DebugUser'
      }),
      getAllPosts: await testAPI('/api/get-all-posts', 'GET'),
      getSharedPosts: await testAPI('/api/get-shared-posts', 'GET')
    };

    setDebugInfo({
      localStorage: localData,
      networkStatus: navigator.onLine ? 'オンライン' : 'オフライン',
      apiStatus: apiTests,
      timestamp: new Date().toLocaleString('ja-JP')
    });
  };

  const testAPI = async (url, method, body = null) => {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const start = Date.now();
      const response = await fetch(url, options);
      const time = Date.now() - start;
      
      return {
        status: response.status,
        ok: response.ok,
        time: `${time}ms`,
        error: response.ok ? null : await response.text()
      };
    } catch (error) {
      return {
        status: 'error',
        ok: false,
        error: error.message
      };
    }
  };

  const checkUnsentPosts = () => {
    const users = Object.keys(debugInfo.localStorage)
      .filter(key => key.includes('posts'))
      .map(key => {
        const data = debugInfo.localStorage[key];
        const posts = Array.isArray(data) ? data : [];
        return {
          user: key.replace('multas_posts_', ''),
          postCount: posts.length,
          latestPost: posts[posts.length - 1]
        };
      });
    return users;
  };

  return (
    <>
      <Head>
        <title>Debug Panel - MULTAs v3.3</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1>デバッグパネル</h1>
          <button onClick={checkSystemStatus} style={styles.refreshButton}>
            🔄 更新
          </button>
        </header>

        <div style={styles.section}>
          <h2>🌐 ネットワーク状態</h2>
          <p>状態: <strong>{debugInfo.networkStatus}</strong></p>
          <p>最終確認: {debugInfo.timestamp}</p>
        </div>

        <div style={styles.section}>
          <h2>🔌 API接続状態</h2>
          {Object.entries(debugInfo.apiStatus).map(([api, status]) => (
            <div key={api} style={styles.apiItem}>
              <span>{api}:</span>
              <span style={{
                color: status.ok ? '#4CAF50' : '#f44336',
                fontWeight: 'bold'
              }}>
                {status.status} ({status.time || 'N/A'})
              </span>
              {status.error && (
                <div style={styles.error}>Error: {status.error}</div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <h2>💾 LocalStorageデータ</h2>
          <div style={styles.localStorageInfo}>
            <h3>ユーザー別投稿状況:</h3>
            {checkUnsentPosts().map(user => (
              <div key={user.user} style={styles.userInfo}>
                <strong>{user.user}</strong>
                <p>投稿数: {user.postCount}</p>
                {user.latestPost && (
                  <p>最新: {user.latestPost.timestamp}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h2>🔧 トラブルシューティング</h2>
          <div style={styles.troubleshoot}>
            <h3>投稿が反映されない場合:</h3>
            <ol>
              <li>ネットワーク接続を確認</li>
              <li>ブラウザの開発者ツールでエラーを確認</li>
              <li>LocalStorageに投稿が保存されているか確認</li>
              <li>APIエンドポイントが正常に応答しているか確認</li>
            </ol>
          </div>
        </div>

        <div style={styles.section}>
          <h2>📋 LocalStorage詳細</h2>
          <pre style={styles.jsonView}>
            {JSON.stringify(debugInfo.localStorage, null, 2)}
          </pre>
        </div>

        <div style={styles.backButton}>
          <a href="/teacher-dashboard" style={styles.link}>
            教員ダッシュボードに戻る
          </a>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  
  header: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },

  apiItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    borderBottom: '1px solid #eee'
  },

  error: {
    color: '#f44336',
    fontSize: '12px',
    marginTop: '4px'
  },

  userInfo: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '8px'
  },

  troubleshoot: {
    backgroundColor: '#fff3cd',
    padding: '16px',
    borderRadius: '4px',
    border: '1px solid #ffeaa7'
  },

  jsonView: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '300px',
    fontSize: '12px'
  },

  backButton: {
    textAlign: 'center',
    marginTop: '40px'
  },
  
  link: {
    color: '#2196F3',
    textDecoration: 'none',
    fontSize: '16px'
  }
};
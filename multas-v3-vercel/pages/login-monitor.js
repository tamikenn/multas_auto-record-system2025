import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export async function getServerSideProps() {
  return {
    props: {},
  };
}

export default function LoginMonitor() {
  const [loginData, setLoginData] = useState({
    loggedInUsers: [],
    recentLogins: [],
    activeFromPosts: [],
    summary: {}
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchLoginStatus = async () => {
    try {
      const response = await fetch('/api/get-login-status');
      const data = await response.json();
      
      if (data.success) {
        setLoginData(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching login status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginStatus();
    // 20秒ごとに自動更新
    const interval = setInterval(fetchLoginStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    return date.toLocaleString('ja-JP');
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return '不明';
    if (userAgent.includes('iPhone')) return '📱 iPhone';
    if (userAgent.includes('Android')) return '📱 Android';
    if (userAgent.includes('iPad')) return '📱 iPad';
    if (userAgent.includes('Mac')) return '💻 Mac';
    if (userAgent.includes('Windows')) return '💻 Windows';
    return '💻 PC';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ログインモニター - MULTAs v3.4</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1>ログインモニター</h1>
          <p style={styles.lastUpdate}>
            最終更新: {lastUpdate?.toLocaleTimeString('ja-JP')}
          </p>
        </header>

        <div style={styles.summaryCards}>
          <div style={{...styles.summaryCard, backgroundColor: '#4CAF50'}}>
            <h3>現在ログイン中</h3>
            <p style={styles.summaryNumber}>{loginData.summary.currentlyLoggedIn || 0}</p>
          </div>
          <div style={styles.summaryCard}>
            <h3>登録ユーザー</h3>
            <p style={styles.summaryNumber}>{loginData.summary.totalUsers || 0}</p>
          </div>
          <div style={{...styles.summaryCard, backgroundColor: '#FF9800'}}>
            <h3>最近アクティブ</h3>
            <p style={styles.summaryNumber}>{loginData.summary.recentlyActive || 0}</p>
            <p style={styles.summaryNote}>（1時間以内）</p>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            🟢 現在ログイン中のユーザー
          </h2>
          {loginData.loggedInUsers.length === 0 ? (
            <p style={styles.noData}>現在ログイン中のユーザーはいません</p>
          ) : (
            <div style={styles.userList}>
              {loginData.loggedInUsers.map((user, index) => (
                <div key={index} style={styles.userCard}>
                  <div style={styles.userInfo}>
                    <span style={styles.userName}>🟢 {user.userName}</span>
                    <span style={styles.deviceInfo}>
                      {getDeviceType(user.userAgent)}
                    </span>
                  </div>
                  <span style={styles.loginTime}>
                    ログイン: {formatTime(user.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            🕐 最近の活動（投稿ベース）
          </h2>
          {loginData.activeFromPosts.length === 0 ? (
            <p style={styles.noData}>最近1時間以内に投稿したユーザーはいません</p>
          ) : (
            <div style={styles.activeList}>
              {loginData.activeFromPosts.map((userName, index) => (
                <span key={index} style={styles.activeUser}>
                  {userName}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📋 ログイン履歴（直近50件）
          </h2>
          <div style={styles.historyList}>
            {loginData.recentLogins.map((log, index) => (
              <div key={index} style={styles.historyItem}>
                <div style={styles.historyMain}>
                  <span style={{
                    ...styles.actionBadge,
                    backgroundColor: log.action === 'login' ? '#4CAF50' : '#f44336'
                  }}>
                    {log.action === 'login' ? 'IN' : 'OUT'}
                  </span>
                  <span style={styles.historyUser}>{log.userName}</span>
                  <span style={styles.historyDevice}>
                    {getDeviceType(log.userAgent)}
                  </span>
                </div>
                <span style={styles.historyTime}>
                  {formatTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.navigationLinks}>
          <a href="/teacher-dashboard" style={styles.link}>
            教員ダッシュボード
          </a>
          <span style={styles.separator}>|</span>
          <a href="/active-users" style={styles.link}>
            アクティブユーザー
          </a>
        </div>
      </div>
    </>
  );
}

const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '18px',
    color: '#666'
  },
  
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
    textAlign: 'center'
  },
  
  lastUpdate: {
    color: '#666',
    fontSize: '14px',
    marginTop: '8px'
  },
  
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  
  summaryCard: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  summaryNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '8px 0 0 0'
  },
  
  summaryNote: {
    fontSize: '12px',
    opacity: 0.8,
    marginTop: '4px'
  },
  
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '16px',
    color: '#333'
  },
  
  noData: {
    color: '#999',
    textAlign: 'center',
    padding: '20px'
  },
  
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  userCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  
  userName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  
  deviceInfo: {
    fontSize: '14px',
    color: '#666'
  },
  
  loginTime: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic'
  },
  
  activeList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  
  activeUser: {
    backgroundColor: '#FF9800',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '14px'
  },
  
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    fontSize: '14px'
  },
  
  historyMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  actionBadge: {
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    minWidth: '35px',
    textAlign: 'center'
  },
  
  historyUser: {
    fontWeight: '600',
    color: '#333'
  },
  
  historyDevice: {
    color: '#666'
  },
  
  historyTime: {
    color: '#999',
    fontSize: '13px'
  },
  
  navigationLinks: {
    textAlign: 'center',
    marginTop: '40px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  
  link: {
    color: '#2196F3',
    textDecoration: 'none',
    fontSize: '16px',
    margin: '0 10px'
  },
  
  separator: {
    color: '#999',
    margin: '0 10px'
  }
};
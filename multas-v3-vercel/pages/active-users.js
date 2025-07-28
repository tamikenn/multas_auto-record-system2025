import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export async function getServerSideProps() {
  return {
    props: {},
  };
}

export default function ActiveUsers() {
  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/get-active-users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.allUsers);
        setActiveUsers(data.activeUsers);
        setSummary(data.summary);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // 30秒ごとに自動更新
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    return date.toLocaleDateString('ja-JP');
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
        <title>アクティブユーザー - MULTAs v3.3</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1>アクティブユーザー状況</h1>
          <p style={styles.lastUpdate}>
            最終更新: {lastUpdate?.toLocaleTimeString('ja-JP')}
          </p>
        </header>

        <div style={styles.summaryCards}>
          <div style={styles.summaryCard}>
            <h3>総ユーザー数</h3>
            <p style={styles.summaryNumber}>{summary.totalUsers || 0}</p>
          </div>
          <div style={{...styles.summaryCard, backgroundColor: '#4CAF50'}}>
            <h3>24時間以内</h3>
            <p style={styles.summaryNumber}>{summary.activeIn24h || 0}</p>
          </div>
          <div style={styles.summaryCard}>
            <h3>総投稿数</h3>
            <p style={styles.summaryNumber}>{summary.totalPosts || 0}</p>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            🟢 現在アクティブ（24時間以内）
          </h2>
          {activeUsers.length === 0 ? (
            <p style={styles.noData}>現在アクティブなユーザーはいません</p>
          ) : (
            <div style={styles.userList}>
              {activeUsers.map((user, index) => (
                <div key={index} style={styles.userCard}>
                  <div style={styles.userInfo}>
                    <span style={styles.userName}>{user.userName}</span>
                    <span style={styles.postCount}>{user.postCount}件の投稿</span>
                  </div>
                  <span style={styles.lastActivity}>
                    {formatTime(user.lastActivity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📊 全ユーザー一覧
          </h2>
          <div style={styles.userList}>
            {users.map((user, index) => {
              const isActive = activeUsers.some(u => u.userName === user.userName);
              return (
                <div 
                  key={index} 
                  style={{
                    ...styles.userCard,
                    opacity: isActive ? 1 : 0.6
                  }}
                >
                  <div style={styles.userInfo}>
                    <span style={styles.userName}>
                      {isActive && '🟢 '}{user.userName}
                    </span>
                    <span style={styles.postCount}>{user.postCount}件の投稿</span>
                  </div>
                  <span style={styles.lastActivity}>
                    最終: {formatTime(user.lastActivity)}
                  </span>
                </div>
              );
            })}
          </div>
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
  
  postCount: {
    fontSize: '14px',
    color: '#666'
  },
  
  lastActivity: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic'
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
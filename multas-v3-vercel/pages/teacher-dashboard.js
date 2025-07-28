import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function TeacherDashboard() {
  const [activeView, setActiveView] = useState('overview');
  const [allPosts, setAllPosts] = useState([]);
  const [studentStats, setStudentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/get-all-posts');
      const data = await response.json();
      
      if (data.success) {
        setAllPosts(data.posts);
        setStudentStats(data.studentStats);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = () => {
    let posts = [...allPosts];
    
    // 学生でフィルター
    if (selectedStudent) {
      posts = posts.filter(post => post.userName === selectedStudent);
    }
    
    // 日付でフィルター
    if (dateRange.start) {
      posts = posts.filter(post => new Date(post.timestamp) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      posts = posts.filter(post => new Date(post.timestamp) <= new Date(dateRange.end));
    }
    
    return posts;
  };

  const exportCSV = () => {
    const posts = filteredPosts();
    const headers = ['タイムスタンプ', 'ユーザー名', '投稿内容', 'カテゴリー', 'AI分類理由'];
    const csvContent = [
      headers.join(','),
      ...posts.map(post => [
        post.timestamp,
        post.userName,
        `"${post.text.replace(/"/g, '""')}"`,
        post.category,
        `"${post.reason.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `multas_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const categoryColors = {
    1: '#FF6B6B', 2: '#4ECDC4', 3: '#45B7D1', 4: '#96CEB4',
    5: '#FECA57', 6: '#48DBFB', 7: '#FF9FF3', 8: '#54A0FF',
    9: '#5F27CD', 10: '#00D2D3', 11: '#EE5A24', 12: '#A29BFE'
  };

  const categoryNames = {
    1: '診察・診断', 2: '治療・手技', 3: '検査・評価', 4: 'カルテ・書類',
    5: 'カンファ', 6: '患者対応', 7: '他職種連携', 8: '知識・学習',
    9: '症例・経験', 10: '振り返り', 11: '感情・成長', 12: 'その他'
  };

  return (
    <>
      <Head>
        <title>教員ダッシュボード - MULTAs v3.3</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>MULTAs v3.3 教員ダッシュボード</h1>
          <button onClick={fetchAllData} className="refresh-btn">
            更新
          </button>
        </header>

        <nav className="dashboard-nav">
          <button 
            className={activeView === 'overview' ? 'active' : ''} 
            onClick={() => setActiveView('overview')}
          >
            スタッツ概要
          </button>
          <button 
            className={activeView === 'all-posts' ? 'active' : ''} 
            onClick={() => setActiveView('all-posts')}
          >
            全投稿一覧
          </button>
          <button 
            className={activeView === 'by-student' ? 'active' : ''} 
            onClick={() => setActiveView('by-student')}
          >
            学生別
          </button>
          <button 
            className={activeView === 'report' ? 'active' : ''} 
            onClick={() => setActiveView('report')}
          >
            レポート
          </button>
        </nav>

        <main className="dashboard-main">
          {loading && <div className="loading">データを読み込み中...</div>}
          {error && <div className="error">{error}</div>}
          
          {!loading && !error && (
            <>
              {activeView === 'overview' && (
                <div className="overview-section">
                  <h2>全学生スタッツ概要</h2>
                  <div className="stats-summary">
                    <div className="stat-card">
                      <h3>総投稿数</h3>
                      <p className="stat-number">{allPosts.length}</p>
                    </div>
                    <div className="stat-card">
                      <h3>参加学生数</h3>
                      <p className="stat-number">{studentStats.length}</p>
                    </div>
                  </div>
                  
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>学生ID</th>
                        <th>記録回数</th>
                        <th>最終記録日時</th>
                        <th>初回記録日時</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.map((student, index) => (
                        <tr key={index}>
                          <td>{student.userName}</td>
                          <td>{student.postCount}</td>
                          <td>{new Date(student.lastPostDate).toLocaleString('ja-JP')}</td>
                          <td>{new Date(student.firstPostDate).toLocaleString('ja-JP')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeView === 'all-posts' && (
                <div className="all-posts-section">
                  <h2>全学生投稿一覧</h2>
                  <div className="filter-controls">
                    <button onClick={exportCSV} className="export-btn">
                      CSVエクスポート
                    </button>
                  </div>
                  
                  <div className="posts-list">
                    {allPosts.map((post, index) => (
                      <div key={index} className="post-card">
                        <div className="post-header">
                          <span className="post-user">{post.userName}</span>
                          <span className="post-time">{post.timestamp}</span>
                        </div>
                        <div className="post-content">{post.text}</div>
                        <div className="post-footer">
                          <span 
                            className="category-badge" 
                            style={{ backgroundColor: categoryColors[post.category] }}
                          >
                            {categoryNames[post.category]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'by-student' && (
                <div className="by-student-section">
                  <h2>学生別LIST</h2>
                  <div className="student-selector">
                    <select 
                      value={selectedStudent || ''} 
                      onChange={(e) => setSelectedStudent(e.target.value || null)}
                    >
                      <option value="">全学生</option>
                      {studentStats.map((student, index) => (
                        <option key={index} value={student.userName}>
                          {student.userName} ({student.postCount}件)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="posts-list">
                    {filteredPosts().map((post, index) => (
                      <div key={index} className="post-card">
                        <div className="post-header">
                          <span className="post-time">{post.timestamp}</span>
                        </div>
                        <div className="post-content">{post.text}</div>
                        <div className="post-footer">
                          <span 
                            className="category-badge" 
                            style={{ backgroundColor: categoryColors[post.category] }}
                          >
                            {categoryNames[post.category]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'report' && (
                <div className="report-section">
                  <h2>期間指定レポート</h2>
                  <div className="date-filters">
                    <label>
                      開始日:
                      <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      />
                    </label>
                    <label>
                      終了日:
                      <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      />
                    </label>
                  </div>
                  
                  <div className="report-summary">
                    <h3>期間内サマリー</h3>
                    <p>投稿数: {filteredPosts().length}件</p>
                    <button onClick={exportCSV} className="export-btn">
                      期間内データをCSVエクスポート
                    </button>
                  </div>
                  
                  <div className="posts-list">
                    {filteredPosts().map((post, index) => (
                      <div key={index} className="post-card">
                        <div className="post-header">
                          <span className="post-user">{post.userName}</span>
                          <span className="post-time">{post.timestamp}</span>
                        </div>
                        <div className="post-content">{post.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background-color: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .dashboard-header {
          background-color: #2196F3;
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dashboard-header h1 {
          font-size: 24px;
          margin: 0;
        }

        .refresh-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid white;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .dashboard-nav {
          background: white;
          padding: 0;
          display: flex;
          border-bottom: 1px solid #e0e0e0;
          overflow-x: auto;
        }

        .dashboard-nav button {
          background: none;
          border: none;
          padding: 16px 24px;
          cursor: pointer;
          font-size: 16px;
          border-bottom: 3px solid transparent;
          white-space: nowrap;
        }

        .dashboard-nav button.active {
          color: #2196F3;
          border-bottom-color: #2196F3;
        }

        .dashboard-main {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
          font-size: 18px;
        }

        .error {
          color: #f44336;
        }

        .overview-section h2 {
          margin-bottom: 20px;
        }

        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
        }

        .stat-number {
          font-size: 36px;
          font-weight: bold;
          color: #2196F3;
          margin: 0;
        }

        .stats-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stats-table th, .stats-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .stats-table th {
          background: #f5f5f5;
          font-weight: 600;
        }

        .filter-controls {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .export-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .export-btn:hover {
          background: #45a049;
        }

        .posts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .post-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
          color: #666;
        }

        .post-user {
          font-weight: 600;
          color: #2196F3;
        }

        .post-content {
          margin-bottom: 12px;
          line-height: 1.6;
        }

        .post-footer {
          display: flex;
          gap: 8px;
        }

        .category-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 16px;
          color: white;
          font-size: 12px;
        }

        .student-selector {
          margin-bottom: 20px;
        }

        .student-selector select {
          width: 100%;
          max-width: 300px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .date-filters {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .date-filters label {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .date-filters input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .report-summary {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .report-summary h3 {
          margin: 0 0 10px 0;
        }

        @media (max-width: 768px) {
          .dashboard-header h1 {
            font-size: 18px;
          }
          
          .dashboard-nav button {
            padding: 12px 16px;
            font-size: 14px;
          }
          
          .dashboard-main {
            padding: 16px;
          }
          
          .stats-table {
            font-size: 14px;
          }
          
          .stats-table th, .stats-table td {
            padding: 8px;
          }
        }
      `}</style>
    </>
  );
}
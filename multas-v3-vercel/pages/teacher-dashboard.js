import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const RadarChart = dynamic(() => import('../components/RadarChart'), { ssr: false });

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPosts, setStudentPosts] = useState([]);
  const [viewMode, setViewMode] = useState('timeline');
  const [postsLoading, setPostsLoading] = useState(false);
  const [mainTab, setMainTab] = useState('students');
  const [sharedPosts, setSharedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loginStatusMap, setLoginStatusMap] = useState({});

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (!data.authenticated) {
        router.replace('/mobile-input-tabs');
        return;
      }
      
      if (data.user.role !== 'teacher' && data.user.role !== 'admin') {
        router.replace('/mobile-input-tabs');
        return;
      }
      
      setUser(data.user);
      await Promise.all([loadStudents(), loadSharedPosts(data.user.username), loadLoginStatus()]);
    } catch (error) {
      console.error('Session check failed:', error);
      router.replace('/mobile-input-tabs');
    } finally {
      setLoading(false);
    }
  };

  const loadLoginStatus = async () => {
    try {
      const response = await fetch('/api/get-login-status');
      const data = await response.json();
      if (data.success && data.lastLoginByUser) {
        setLoginStatusMap(data.lastLoginByUser);
        return data.lastLoginByUser;
      }
    } catch (error) {
      console.error('Failed to load login status:', error);
    }
    return {};
  };

  const loadStudents = async () => {
    try {
      const [studentsRes, postsRes, loginRes] = await Promise.all([
        fetch('/api/get-students'),
        fetch('/api/get-all-posts'),
        fetch('/api/get-login-status'),
      ]);
      const studentsData = await studentsRes.json();
      const postsData = await postsRes.json();
      const loginData = await loginRes.json();

      const loginMap = (loginData.success && loginData.lastLoginByUser) ? loginData.lastLoginByUser : {};
      setLoginStatusMap(loginMap);
      
      if (studentsData.success) {
        const statsMap = new Map();
        if (postsData.success && postsData.studentStats) {
          postsData.studentStats.forEach(stat => {
            statsMap.set(stat.userName, stat);
          });
        }
        
        const enrichedStudents = studentsData.students.map(student => {
          const stats = statsMap.get(student.username) || {
            postCount: 0,
            lastPostDate: null,
            firstPostDate: null
          };
          
          return {
            userName: student.username,
            postCount: stats.postCount || 0,
            lastPostDate: stats.lastPostDate || null,
            firstPostDate: stats.firstPostDate || null,
            lastLoginDate: loginMap[student.username] || null,
            scheduleStartDate: student.scheduleStartDate,
            primaryFacility: student.primaryFacility,
            status: getActivityStatus(stats.lastPostDate, loginMap[student.username]),
          };
        });
        
        setStudents(enrichedStudents);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const loadSharedPosts = async (username) => {
    try {
      const response = await fetch('/api/get-shared-posts');
      const data = await response.json();
      
      if (data.success) {
        setSharedPosts(data.posts || []);
        if (username) {
          const alreadyLiked = (data.posts || [])
            .filter(post => post.likes && post.likes[username] === true)
            .map(post => post.id);
          setLikedPosts(alreadyLiked);
        }
      }
    } catch (error) {
      console.error('Failed to load shared posts:', error);
    }
  };

  const handleLike = async (postId) => {
    if (!user) return;
    
    const isLiked = likedPosts.includes(postId);
    const action = isLiked ? 'unlike' : 'like';
    
    try {
      const response = await fetch('/api/toggle-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.username, action })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (isLiked) {
          setLikedPosts(likedPosts.filter(id => id !== postId));
        } else {
          setLikedPosts([...likedPosts, postId]);
        }
        
        setSharedPosts(sharedPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likeCount: data.likeCount
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const getActivityStatus = (lastPostDate, lastLoginDate) => {
    const candidates = [lastPostDate, lastLoginDate].filter(Boolean).map(d => new Date(d));
    if (candidates.length === 0) return { color: '#9CA3AF', label: 'アクションなし', level: 0 };

    const lastAction = new Date(Math.max(...candidates));
    const diffHours = (new Date() - lastAction) / (1000 * 60 * 60);

    if (diffHours <= 1) return { color: '#3B82F6', label: '1時間以内', level: 4 };
    if (diffHours <= 3) return { color: '#10B981', label: '3時間以内', level: 3 };
    if (diffHours <= 6) return { color: '#F59E0B', label: '6時間以内', level: 2 };
    if (diffHours <= 24) return { color: '#F97316', label: '24時間以内', level: 1 };
    return { color: '#9CA3AF', label: '1日以上', level: 0 };
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setViewMode('timeline');
    setPostsLoading(true);
    
    try {
      const response = await fetch(`/api/get-all-posts?userName=${encodeURIComponent(student.userName)}`);
      const data = await response.json();
      
      if (data.success) {
        setStudentPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to load student posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFacilityName = (facilityId) => {
    const names = {
      'Rishiri': '利尻',
      'Rebun': '礼文',
      'Nayoro': '名寄',
      'Shimizu': '清水',
      'Sarabetsu': '更別'
    };
    return names[facilityId] || facilityId || '未設定';
  };

  const getCategoryLabel = (category) => {
    // 番号の場合（1-12）
    const numberLabels = {
      1: '医療倫理',
      2: '地域医療',
      3: '医学的知識',
      4: '診察・手技',
      5: '問題解決能力',
      6: '統合的臨床能力',
      7: '多職種連携',
      8: 'コミュニケーション',
      9: '一般教養',
      10: '保健・福祉',
      11: '行政',
      12: '社会医学'
    };
    
    // 番号の場合
    if (typeof category === 'number' || !isNaN(parseInt(category))) {
      return numberLabels[parseInt(category)] || '未分類';
    }
    
    // 英語キーの場合（旧形式互換）
    const stringLabels = {
      'anatomy': '解剖・構造',
      'function': '機能・生理',
      'assessment': '評価・検査',
      'treatment': '治療・介入',
      'communication': 'コミュニケーション',
      'teamwork': '多職種連携',
      'motivation': 'モチベーション',
      'difficulty': '困難・課題',
      'discovery': '発見・気づき',
      'ethics': '倫理・態度',
      'safety': '安全管理',
      'reflection': '自己省察'
    };
    return stringLabels[category] || category || '未分類';
  };

  const getPostsByCategory = () => {
    const grouped = {};
    studentPosts.forEach(post => {
      const cat = post.category || 'uncategorized';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(post);
    });
    return grouped;
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
        <title>教員ダッシュボード - MULTAs</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>教員ダッシュボード</h1>
          <div style={styles.headerRight}>
            <span style={styles.userName}>{user?.username}</span>
            <button onClick={handleLogout} style={styles.logoutButton}>ログアウト</button>
          </div>
        </header>

        <main style={styles.main}>
          {!selectedStudent ? (
            <>
              {/* メインタブ切替 */}
              <div style={styles.mainTabContainer}>
                <button
                  onClick={() => setMainTab('students')}
                  style={{
                    ...styles.mainTabButton,
                    ...(mainTab === 'students' ? styles.mainTabActive : {})
                  }}
                >
                  学生一覧
                </button>
                <button
                  onClick={() => setMainTab('shared')}
                  style={{
                    ...styles.mainTabButton,
                    ...(mainTab === 'shared' ? styles.mainTabActive : {})
                  }}
                >
                  みんなの学び
                  {sharedPosts.length > 0 && (
                    <span style={styles.tabBadge}>{sharedPosts.length}</span>
                  )}
                </button>
              </div>

              {mainTab === 'shared' ? (
                <div style={styles.sharedSection}>
                  <h2 style={styles.sectionTitle}>みんなの学び ({sharedPosts.length}件)</h2>
                  
                  {sharedPosts.length === 0 ? (
                    <p style={styles.noData}>共有された投稿はまだありません</p>
                  ) : (
                    <div style={styles.sharedList}>
                      {sharedPosts.map((post, index) => (
                        <div key={post.id || index} style={styles.sharedCard}>
                          <div style={styles.sharedHeader}>
                            <span style={styles.sharedUser}>{post.userName}</span>
                            <span style={styles.sharedDate}>{formatDate(post.sharedAt || post.timestamp)}</span>
                          </div>
                          <p style={styles.sharedText}>{post.text}</p>
                          {post.category && (
                            <span style={styles.categoryBadge}>
                              {getCategoryLabel(post.category)}
                            </span>
                          )}
                          <div style={styles.likeSection}>
                            {post.sharedBy === user?.username || post.userName === user?.username ? (
                              <span style={styles.likeCount}>❤️ {post.likeCount || 0}</span>
                            ) : (
                              <button
                                onClick={() => handleLike(post.id)}
                                style={{
                                  ...styles.likeButton,
                                  ...(likedPosts.includes(post.id) ? styles.likedButton : {})
                                }}
                              >
                                {likedPosts.includes(post.id) ? '❤️' : '🤍'} {post.likeCount || 0}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.studentList}>
                  <h2 style={styles.sectionTitle}>学生一覧 ({students.length}名)</h2>
                  
                  <div style={styles.statusLegend}>
                    <span style={{...styles.legendItem, color: '#3B82F6'}}>● 1h以内</span>
                    <span style={{...styles.legendItem, color: '#10B981'}}>● 3h以内</span>
                    <span style={{...styles.legendItem, color: '#F59E0B'}}>● 6h以内</span>
                    <span style={{...styles.legendItem, color: '#F97316'}}>● 24h以内</span>
                    <span style={{...styles.legendItem, color: '#9CA3AF'}}>● 1日以上</span>
                  </div>

                  {students.length === 0 ? (
                    <p style={styles.noData}>登録された学生がいません</p>
                  ) : (
                    <div style={styles.studentGrid}>
                      {students.map((student, index) => (
                        <div
                          key={index}
                          style={styles.studentCard}
                          onClick={() => selectStudent(student)}
                        >
                          <div style={styles.studentHeader}>
                            <span 
                              style={{
                                ...styles.statusDot,
                                backgroundColor: student.status.color
                              }}
                            />
                            <span style={styles.studentName}>{student.userName}</span>
                          </div>
                      <div style={styles.studentFacility}>
                        {getFacilityName(student.primaryFacility)}
                      </div>
                      <div style={styles.studentInfo}>
                        <span style={styles.postCount}>投稿: {student.postCount}件</span>
                      </div>
                      <div style={styles.studentTimestamps}>
                        <span style={styles.timestampItem}>
                          最終ログイン: {formatDate(student.lastLoginDate)}
                        </span>
                        <span style={styles.timestampItem}>
                          最終投稿: {formatDate(student.lastPostDate)}
                        </span>
                      </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={styles.studentDetail}>
              <button 
                onClick={() => setSelectedStudent(null)} 
                style={styles.backButton}
              >
                ← 学生一覧に戻る
              </button>

              <div style={styles.detailHeader}>
                <h2 style={styles.studentDetailName}>
                  <span 
                    style={{
                      ...styles.statusDot,
                      backgroundColor: selectedStudent.status.color
                    }}
                  />
                  {selectedStudent.userName}
                </h2>
                <p style={styles.detailStats}>
                  投稿数: {selectedStudent.postCount}件 | 
                  最終投稿: {formatDate(selectedStudent.lastPostDate)}
                </p>
              </div>

              <div style={styles.viewToggle}>
                <button
                  onClick={() => setViewMode('timeline')}
                  style={{
                    ...styles.toggleButton,
                    ...(viewMode === 'timeline' ? styles.toggleActive : {})
                  }}
                >
                  タイムライン
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    ...styles.toggleButton,
                    ...(viewMode === 'list' ? styles.toggleActive : {})
                  }}
                >
                  リスト
                </button>
                <button
                  onClick={() => setViewMode('report')}
                  style={{
                    ...styles.toggleButton,
                    ...(viewMode === 'report' ? styles.toggleActive : {})
                  }}
                >
                  レポート
                </button>
              </div>

              {postsLoading ? (
                <p style={styles.loading}>投稿を読み込み中...</p>
              ) : viewMode === 'timeline' ? (
                <div style={styles.timeline}>
                  {studentPosts.length === 0 ? (
                    <p style={styles.noData}>投稿がありません</p>
                  ) : (
                    studentPosts.map((post, index) => (
                      <div key={index} style={styles.postCard}>
                        <div style={styles.postHeader}>
                          <span style={styles.postDate}>
                            {formatDate(post.timestamp)}
                          </span>
                          {post.category && (
                            <span style={styles.categoryBadge}>
                              {getCategoryLabel(post.category)}
                            </span>
                          )}
                        </div>
                        <p style={styles.postText}>{post.text}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : viewMode === 'list' ? (
                <div style={styles.listView}>
                  {studentPosts.length === 0 ? (
                    <p style={styles.noData}>投稿がありません</p>
                  ) : (
                    Object.entries(getPostsByCategory()).map(([category, posts]) => (
                      <div key={category} style={styles.categorySection}>
                        <h3 style={styles.categoryTitle}>
                          {getCategoryLabel(category)} ({posts.length})
                        </h3>
                        <div style={styles.categoryPosts}>
                          {posts.map((post, index) => (
                            <div key={index} style={styles.listPostCard}>
                              <span style={styles.listPostDate}>{formatDate(post.timestamp)}</span>
                              <p style={styles.listPostText}>{post.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div style={styles.report}>
                  {studentPosts.length > 0 ? (
                    <>
                      <RadarChart posts={studentPosts} />
                      <div style={styles.reportStats}>
                        <div style={styles.statCard}>
                          <h3>総記録数</h3>
                          <p style={styles.statNumber}>{studentPosts.length}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p style={styles.noData}>レポートを表示するには投稿が必要です</p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F3F4F6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '16px',
    color: '#666',
  },
  header: {
    backgroundColor: '#1E40AF',
    color: 'white',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontSize: '14px',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  main: {
    padding: '16px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  mainTabContainer: {
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  mainTabButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6B7280',
    transition: 'all 0.2s',
  },
  mainTabActive: {
    backgroundColor: '#1E40AF',
    color: 'white',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    color: 'white',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '10px',
    marginLeft: '6px',
  },
  sharedSection: {},
  sharedList: {
    display: 'grid',
    gap: '12px',
  },
  sharedCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sharedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  sharedUser: {
    fontWeight: '600',
    color: '#1E40AF',
    fontSize: '14px',
  },
  sharedDate: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  sharedText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#374151',
    margin: '0 0 10px 0',
    whiteSpace: 'pre-wrap',
  },
  likeSection: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '8px',
  },
  likeButton: {
    backgroundColor: '#F3F4F6',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  likedButton: {
    backgroundColor: '#FEE2E2',
  },
  likeCount: {
    fontSize: '14px',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  studentList: {},
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#374151',
  },
  statusLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px',
    fontSize: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
  },
  studentGrid: {
    display: 'grid',
    gap: '12px',
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
  },
  studentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  studentName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
  },
  studentFacility: {
    fontSize: '12px',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    padding: '2px 8px',
    borderRadius: '4px',
    marginBottom: '6px',
    display: 'inline-block',
  },
  studentInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#6B7280',
  },
  postCount: {},
  lastPost: {},
  studentTimestamps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginTop: '4px',
  },
  timestampItem: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  noData: {
    textAlign: 'center',
    color: '#9CA3AF',
    padding: '40px 20px',
  },
  studentDetail: {},
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#1E40AF',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '12px',
  },
  detailHeader: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  studentDetailName: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1F2937',
  },
  detailStats: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
  viewToggle: {
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  toggleButton: {
    flex: 1,
    padding: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280',
    transition: 'all 0.2s',
  },
  toggleActive: {
    backgroundColor: '#1E40AF',
    color: 'white',
  },
  loading: {
    textAlign: 'center',
    color: '#6B7280',
    padding: '20px',
  },
  timeline: {
    display: 'grid',
    gap: '12px',
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  postDate: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  categoryBadge: {
    fontSize: '11px',
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  postText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#374151',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  listView: {
    display: 'grid',
    gap: '16px',
  },
  categorySection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  categoryTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '2px solid #E0E7FF',
  },
  categoryPosts: {
    display: 'grid',
    gap: '8px',
  },
  listPostCard: {
    backgroundColor: '#F9FAFB',
    padding: '10px 12px',
    borderRadius: '6px',
    borderLeft: '3px solid #1E40AF',
  },
  listPostDate: {
    fontSize: '11px',
    color: '#9CA3AF',
    display: 'block',
    marginBottom: '4px',
  },
  listPostText: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#374151',
    margin: 0,
  },
  report: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  reportStats: {
    marginTop: '16px',
  },
  statCard: {
    textAlign: 'center',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1E40AF',
    margin: '8px 0 0 0',
  },
};

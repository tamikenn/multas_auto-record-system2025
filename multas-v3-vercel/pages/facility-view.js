import { useState, useEffect } from 'react';
import Head from 'next/head';
import { getCategoryName } from '../lib/categories';

const FACILITIES = {
  Rishiri: { id: 'Rishiri', name: '利尻島国保中央病院' },
  Rebun: { id: 'Rebun', name: '礼文町国民健康保険 船泊診療所' },
  Nayoro: { id: 'Nayoro', name: '名寄市立病院' },
  Shimizu: { id: 'Shimizu', name: '清水赤十字病院' },
  Sarabetsu: { id: 'Sarabetsu', name: '更別村国民健康保険診療所' }
};

export default function FacilityView() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [posts, setPosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSchedules, setStudentSchedules] = useState({});
  const [postsByStudent, setPostsByStudent] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [viewMode, setViewMode] = useState('date'); // 'date' or 'student'
  const [error, setError] = useState('');

  function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  useEffect(() => {
    checkSessionAndLoadData();
  }, []);

  const checkSessionAndLoadData = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();

      if (!sessionData.authenticated || sessionData.user?.role !== 'facility') {
        setError('このページは協力施設ユーザー専用です');
        setLoading(false);
        return;
      }

      setSession(sessionData.user);

      const postsRes = await fetch('/api/get-facility-posts');
      const postsData = await postsRes.json();

      if (postsData.success) {
        setPosts(postsData.posts || []);
        setStudents(postsData.students || []);
        setStudentSchedules(postsData.studentSchedules || {});
        setPostsByStudent(postsData.postsByStudent || {});
        setFacilities(postsData.facilities || []);
      } else {
        setError(postsData.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('サーバーに接続できません');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  // 特定の日付に実習している学生を取得
  const getStudentsOnDate = (dateStr) => {
    return students.filter(student => {
      const schedule = studentSchedules[student];
      if (!schedule || !schedule.startDate || !schedule.schedule) return false;
      
      const startDate = new Date(schedule.startDate);
      const targetDate = new Date(dateStr);
      
      // 実習週の範囲内かチェック
      const dayDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
      if (dayDiff < 0 || dayDiff > 4) return false;
      
      // その日の施設が自施設かチェック
      const dayKey = `day${dayDiff + 1}`;
      const facilityOnDay = schedule.schedule[dayKey];
      
      return facilities.includes(facilityOnDay);
    });
  };

  // 学生のスケジュールから、特定日付が何日目かを取得
  const getDayInfo = (student, dateStr) => {
    const schedule = studentSchedules[student];
    if (!schedule || !schedule.startDate) return null;
    
    const startDate = new Date(schedule.startDate);
    const targetDate = new Date(dateStr);
    const dayDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
    
    if (dayDiff < 0 || dayDiff > 4) return null;
    
    const dayKey = `day${dayDiff + 1}`;
    return {
      dayNum: dayDiff + 1,
      facility: schedule.schedule[dayKey],
      facilityName: FACILITIES[schedule.schedule[dayKey]]?.name || schedule.schedule[dayKey]
    };
  };

  // 日付でフィルターされた投稿を取得
  const getPostsForDate = (dateStr) => {
    const studentsOnDate = getStudentsOnDate(dateStr);
    return posts.filter(post => {
      if (!studentsOnDate.includes(post.userName)) return false;
      // 投稿日付も確認（timestampから日付部分を抽出）
      const postDate = post.timestamp?.split(' ')[0];
      return postDate === dateStr;
    });
  };

  // 週間カレンダーの日付を生成
  const getWeekDates = () => {
    const today = new Date(selectedDate);
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push({
        dateStr: date.toISOString().split('T')[0],
        dayName: ['月', '火', '水', '木', '金'][i],
        date: date.getDate(),
        month: date.getMonth() + 1,
        isToday: date.toISOString().split('T')[0] === getTodayString(),
        isSelected: date.toISOString().split('T')[0] === selectedDate
      });
    }
    return dates;
  };

  // 統計情報
  const todayStudents = getStudentsOnDate(getTodayString());
  const selectedDateStudents = getStudentsOnDate(selectedDate);
  const selectedDatePosts = viewMode === 'date' ? getPostsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div style={styles.container}>
        <Head><title>施設ダッシュボード - MULTAs v3.4</title></Head>
        <p style={styles.loading}>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Head><title>施設ダッシュボード - MULTAs v3.4</title></Head>
        <div style={styles.error}>
          <h2>エラー</h2>
          <p>{error}</p>
          <a href="/" style={styles.link}>ホームに戻る</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Head><title>施設ダッシュボード - MULTAs v3.4</title></Head>

      {/* ヘッダー */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🏥 施設ダッシュボード</h1>
          <p style={styles.subtitle}>
            {facilities.map(f => FACILITIES[f]?.name || f).join(', ')}
          </p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.username}>{session?.username}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>ログアウト</button>
        </div>
      </header>

      {/* 今日のサマリー */}
      <section style={styles.summarySection}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>📅</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>本日の実習生</div>
            <div style={styles.summaryValue}>{todayStudents.length}名</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>📝</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>総投稿数</div>
            <div style={styles.summaryValue}>{posts.length}件</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>👥</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>登録学生</div>
            <div style={styles.summaryValue}>{students.length}名</div>
          </div>
        </div>
      </section>

      {/* 表示モード切替 */}
      <div style={styles.viewToggle}>
        <button
          onClick={() => setViewMode('date')}
          style={viewMode === 'date' ? styles.activeToggle : styles.inactiveToggle}
        >
          📅 日付で見る
        </button>
        <button
          onClick={() => setViewMode('student')}
          style={viewMode === 'student' ? styles.activeToggle : styles.inactiveToggle}
        >
          👤 学生で見る
        </button>
      </div>

      {/* 日付ビュー */}
      {viewMode === 'date' && (
        <>
          {/* 週間カレンダー */}
          <section style={styles.calendarSection}>
            <div style={styles.weekNav}>
              <button 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 7);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                style={styles.navButton}
              >
                ◀ 前週
              </button>
              <button 
                onClick={() => setSelectedDate(getTodayString())}
                style={styles.todayButton}
              >
                今日
              </button>
              <button 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 7);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                style={styles.navButton}
              >
                翌週 ▶
              </button>
            </div>
            
            <div style={styles.weekCalendar}>
              {getWeekDates().map(day => {
                const studentsCount = getStudentsOnDate(day.dateStr).length;
                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    style={{
                      ...styles.dayCard,
                      ...(day.isSelected ? styles.selectedDay : {}),
                      ...(day.isToday ? styles.todayCard : {})
                    }}
                  >
                    <div style={styles.dayName}>{day.dayName}</div>
                    <div style={styles.dayDate}>{day.month}/{day.date}</div>
                    <div style={styles.dayCount}>
                      {studentsCount > 0 ? `${studentsCount}名` : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 選択日の詳細 */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              📋 {new Date(selectedDate).toLocaleDateString('ja-JP', { 
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' 
              })}の実習生
            </h2>
            
            {selectedDateStudents.length === 0 ? (
              <p style={styles.emptyMessage}>この日に実習予定の学生はいません</p>
            ) : (
              <div style={styles.studentGrid}>
                {selectedDateStudents.map(student => {
                  const dayInfo = getDayInfo(student, selectedDate);
                  const studentPosts = (postsByStudent[student] || [])
                    .filter(p => p.timestamp?.startsWith(selectedDate));
                  
                  return (
                    <div key={student} style={styles.studentDetailCard}>
                      <div style={styles.studentHeader}>
                        <span style={styles.studentName}>{student}</span>
                        <span style={styles.dayBadge}>
                          {dayInfo?.dayNum}日目
                        </span>
                      </div>
                      <div style={styles.studentMeta}>
                        実習先: {dayInfo?.facilityName}
                      </div>
                      <div style={styles.studentPostCount}>
                        本日の投稿: {studentPosts.length}件
                      </div>
                      {studentPosts.length > 0 && (
                        <div style={styles.recentPosts}>
                          {studentPosts.slice(0, 2).map((post, i) => (
                            <div key={i} style={styles.miniPost}>
                              <span style={styles.miniCategory}>
                                {getCategoryName(post.category)}
                              </span>
                              <span style={styles.miniText}>
                                {post.text?.slice(0, 30)}...
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 選択日の全投稿 */}
          {selectedDateStudents.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📝 この日の投稿一覧</h2>
              {(() => {
                const dayPosts = [];
                selectedDateStudents.forEach(student => {
                  const sp = (postsByStudent[student] || [])
                    .filter(p => p.timestamp?.startsWith(selectedDate));
                  dayPosts.push(...sp);
                });
                
                if (dayPosts.length === 0) {
                  return <p style={styles.emptyMessage}>この日の投稿はまだありません</p>;
                }
                
                return (
                  <div style={styles.postList}>
                    {dayPosts.map((post, index) => (
                      <div key={post.id || index} style={styles.postCard}>
                        <div style={styles.postHeader}>
                          <span style={styles.postUser}>{post.userName}</span>
                          <span style={styles.postTime}>
                            {post.timestamp?.split(' ')[1] || ''}
                          </span>
                        </div>
                        <div style={styles.postText}>{post.text}</div>
                        <div style={styles.postFooter}>
                          <span style={styles.categoryTag}>
                            {getCategoryName(post.category)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>
          )}
        </>
      )}

      {/* 学生ビュー */}
      {viewMode === 'student' && (
        <>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>👥 学生一覧（{students.length}名）</h2>
            <div style={styles.studentGrid}>
              {students.map(student => {
                const schedule = studentSchedules[student];
                const stats = {
                  total: (postsByStudent[student] || []).length
                };
                
                return (
                  <div 
                    key={student} 
                    style={{
                      ...styles.studentCard,
                      ...(selectedStudent === student ? styles.selectedCard : {})
                    }}
                    onClick={() => setSelectedStudent(selectedStudent === student ? 'all' : student)}
                  >
                    <div style={styles.studentName}>{student}</div>
                    {schedule?.startDate && (
                      <div style={styles.scheduleInfo}>
                        実習期間: {new Date(schedule.startDate).toLocaleDateString('ja-JP')}〜
                      </div>
                    )}
                    <div style={styles.studentStats}>
                      投稿数: {stats.total}件
                    </div>
                    {schedule?.schedule && (
                      <div style={styles.scheduleDetail}>
                        {Object.entries(schedule.schedule)
                          .filter(([_, fac]) => facilities.includes(fac))
                          .map(([day, fac]) => (
                            <span key={day} style={styles.scheduleBadge}>
                              {day.replace('day', '')}日目
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 選択学生の投稿 */}
          {selectedStudent !== 'all' && (
            <section style={styles.section}>
              <div style={styles.filterHeader}>
                <h2 style={styles.sectionTitle}>
                  {selectedStudent}の投稿（{(postsByStudent[selectedStudent] || []).length}件）
                </h2>
                <button 
                  onClick={() => setSelectedStudent('all')}
                  style={styles.clearFilter}
                >
                  ✕ 閉じる
                </button>
              </div>

              {(postsByStudent[selectedStudent] || []).length === 0 ? (
                <p style={styles.emptyMessage}>投稿がありません</p>
              ) : (
                <div style={styles.postList}>
                  {(postsByStudent[selectedStudent] || []).map((post, index) => (
                    <div key={post.id || index} style={styles.postCard}>
                      <div style={styles.postHeader}>
                        <span style={styles.postUser}>{post.userName}</span>
                        <span style={styles.postTime}>{post.timestamp}</span>
                      </div>
                      <div style={styles.postText}>{post.text}</div>
                      <div style={styles.postFooter}>
                        <span style={styles.categoryTag}>
                          {getCategoryName(post.category)}
                        </span>
                        {post.reason && (
                          <span style={styles.reason}>理由: {post.reason}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px' },
  error: { textAlign: 'center', padding: '50px' },
  link: { color: '#2196F3', textDecoration: 'none' },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  title: { margin: 0, fontSize: '24px', color: '#1976D2' },
  subtitle: { margin: '5px 0 0', color: '#666', fontSize: '14px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  username: { fontWeight: 'bold', color: '#333' },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  summarySection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '25px'
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  summaryIcon: { fontSize: '32px', marginRight: '15px' },
  summaryContent: {},
  summaryLabel: { fontSize: '14px', color: '#666' },
  summaryValue: { fontSize: '28px', fontWeight: 'bold', color: '#1976D2' },

  viewToggle: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  activeToggle: {
    padding: '12px 24px',
    backgroundColor: '#1976D2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '15px'
  },
  inactiveToggle: {
    padding: '12px 24px',
    backgroundColor: '#e0e0e0',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px'
  },

  calendarSection: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  weekNav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '15px'
  },
  navButton: {
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  todayButton: {
    padding: '8px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  weekCalendar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px'
  },
  dayCard: {
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent'
  },
  selectedDay: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976D2'
  },
  todayCard: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800'
  },
  dayName: { fontSize: '14px', color: '#666', marginBottom: '5px' },
  dayDate: { fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' },
  dayCount: { fontSize: '14px', color: '#1976D2', fontWeight: 'bold' },

  section: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  sectionTitle: { margin: '0 0 15px', fontSize: '18px', color: '#333' },

  studentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '15px'
  },
  studentCard: {
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent'
  },
  selectedCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976D2'
  },
  studentDetailCard: {
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    border: '1px solid #e0e0e0'
  },
  studentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  studentName: { fontWeight: 'bold', fontSize: '16px', color: '#333' },
  dayBadge: {
    padding: '4px 10px',
    backgroundColor: '#1976D2',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  studentMeta: { fontSize: '13px', color: '#666', marginBottom: '5px' },
  studentPostCount: { fontSize: '14px', color: '#1976D2', fontWeight: 'bold' },
  studentStats: { fontSize: '14px', color: '#666', marginTop: '5px' },
  scheduleInfo: { fontSize: '12px', color: '#999', marginBottom: '5px' },
  scheduleDetail: { display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' },
  scheduleBadge: {
    padding: '3px 8px',
    backgroundColor: '#e3f2fd',
    color: '#1976D2',
    borderRadius: '10px',
    fontSize: '11px'
  },
  recentPosts: { marginTop: '10px', borderTop: '1px solid #e0e0e0', paddingTop: '10px' },
  miniPost: { fontSize: '12px', marginBottom: '5px' },
  miniCategory: {
    padding: '2px 6px',
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    borderRadius: '4px',
    marginRight: '5px',
    fontSize: '10px'
  },
  miniText: { color: '#666' },

  filterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  clearFilter: {
    padding: '8px 16px',
    backgroundColor: '#999',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  emptyMessage: { textAlign: 'center', padding: '30px', color: '#666' },

  postList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  postCard: {
    padding: '15px',
    backgroundColor: '#fafafa',
    border: '1px solid #eee',
    borderRadius: '10px'
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  postUser: { fontWeight: 'bold', color: '#1976D2' },
  postTime: { fontSize: '12px', color: '#999' },
  postText: { fontSize: '15px', lineHeight: '1.6', marginBottom: '10px', color: '#333' },
  postFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryTag: {
    padding: '4px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976D2',
    borderRadius: '15px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  reason: { fontSize: '12px', color: '#666' }
};

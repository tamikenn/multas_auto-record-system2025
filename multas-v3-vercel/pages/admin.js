import { useState, useEffect } from 'react';
import Head from 'next/head';

const FACILITIES = {
  Rishiri: { id: 'Rishiri', name: '利尻島国保中央病院' },
  Rebun: { id: 'Rebun', name: '礼文町国民健康保険 船泊診療所' },
  Nayoro: { id: 'Nayoro', name: '名寄市立病院' },
  Shimizu: { id: 'Shimizu', name: '清水赤十字病院' },
  Sarabetsu: { id: 'Sarabetsu', name: '更別村国民健康保険診療所' }
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [newFacilities, setNewFacilities] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [newPasswordForEdit, setNewPasswordForEdit] = useState('');

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.authenticated && data.user?.role === 'admin') {
        setIsAdmin(true);
        await loadUsers();
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const [usersRes, loginRes, postsRes] = await Promise.all([
        fetch('/api/auth/users'),
        fetch('/api/get-login-status'),
        fetch('/api/get-all-posts'),
      ]);
      const usersData = await usersRes.json();
      const loginData = await loginRes.json();
      const postsData = await postsRes.json();

      if (usersData.success) {
        const loginMap = (loginData.success && loginData.lastLoginByUser) ? loginData.lastLoginByUser : {};
        const statsMap = {};
        if (postsData.success && postsData.studentStats) {
          postsData.studentStats.forEach(stat => {
            statsMap[stat.userName] = stat;
          });
        }

        const enrichedUsers = usersData.users.map(user => ({
          ...user,
          lastLoginDate: loginMap[user.username] || null,
          lastPostDate: statsMap[user.username]?.lastPostDate || null,
          postCount: statsMap[user.username]?.postCount || 0,
        }));
        setUsers(enrichedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('ユーザー名とパスワードを入力してください');
      return;
    }

    // 施設ユーザーで施設未選択の場合のチェック
    if (newRole === 'facility' && newFacilities.length === 0) {
      setError('協力施設ユーザーには施設の選択が必要です');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim(),
          role: newRole,
          facilities: newFacilities
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`ユーザー「${newUsername}」を登録しました`);
        setNewUsername('');
        setNewPassword('');
        setNewRole('student');
        setNewFacilities([]);
        await loadUsers();
      } else {
        setError(data.error || '登録に失敗しました');
      }
    } catch (error) {
      setError('サーバーに接続できません');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`ユーザー「${username}」を削除しますか？`)) {
      return;
    }

    try {
      const response = await fetch('/api/auth/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`ユーザー「${username}」を削除しました`);
        await loadUsers();
      } else {
        setError(data.error || '削除に失敗しました');
      }
    } catch (error) {
      setError('サーバーに接続できません');
    }
  };

  const handleToggleTest = async (userId, username) => {
    try {
      const response = await fetch('/api/auth/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'toggleTest' })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`「${username}」を${data.isTest ? 'テストユーザーに設定' : 'テスト解除'}しました`);
        await loadUsers();
      } else {
        setError(data.error || '変更に失敗しました');
      }
    } catch (error) {
      setError('サーバーに接続できません');
    }
  };

  const handleChangePassword = async (userId) => {
    if (!newPasswordForEdit.trim() || newPasswordForEdit.length < 4) {
      setError('パスワードは4文字以上で入力してください');
      return;
    }

    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPasswordForEdit })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('パスワードを変更しました');
        setEditingUser(null);
        setNewPasswordForEdit('');
      } else {
        setError(data.error || '変更に失敗しました');
      }
    } catch (error) {
      setError('サーバーに接続できません');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Head>
          <title>管理者ページ - MULTAs v3.4</title>
        </Head>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <Head>
          <title>管理者ページ - MULTAs v3.4</title>
        </Head>
        <div style={styles.accessDenied}>
          <h1>アクセス拒否</h1>
          <p>このページは管理者のみアクセスできます。</p>
          <a href="/" style={styles.link}>ホームに戻る</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>管理者ページ - MULTAs v3.4</title>
      </Head>

      <header style={styles.header}>
        <h1>管理者ページ</h1>
        <a href="/" style={styles.backLink}>← アプリに戻る</a>
      </header>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <section style={styles.section}>
        <h2>ユーザー登録</h2>
        <form onSubmit={handleAddUser} style={styles.form}>
          <div style={styles.formGroup}>
            <label>ユーザー名</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="例: 山田太郎"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label>パスワード</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="4文字以上"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label>権限</label>
            <select
              value={newRole}
              onChange={(e) => {
                setNewRole(e.target.value);
                if (e.target.value === 'admin' || e.target.value === 'teacher') {
                  setNewFacilities([]);
                }
              }}
              style={styles.select}
            >
              <option value="student">学生</option>
              <option value="teacher">教員（閲覧のみ）</option>
              <option value="facility">協力施設（自施設学生のみ閲覧）</option>
              <option value="admin">管理者</option>
            </select>
          </div>
          
          {newRole === 'facility' && (
            <div style={styles.formGroup}>
              <label>担当施設（複数選択可）</label>
              <div style={styles.checkboxGroup}>
                {Object.values(FACILITIES).map(facility => (
                  <label key={facility.id} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newFacilities.includes(facility.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewFacilities([...newFacilities, facility.id]);
                        } else {
                          setNewFacilities(newFacilities.filter(f => f !== facility.id));
                        }
                      }}
                    />
                    {facility.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <button type="submit" style={styles.button}>登録</button>
        </form>
      </section>

      <section style={styles.section}>
        <h2>ユーザー一覧 ({users.length}人)</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ユーザー名</th>
              <th style={styles.th}>権限</th>
              <th style={styles.th}>施設/スケジュール</th>
              <th style={styles.th}>最終ログイン</th>
              <th style={styles.th}>最終投稿</th>
              <th style={styles.th}>投稿数</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={styles.td}>
                  {user.username}
                  {user.isTest && <span style={styles.testBadge}>テスト</span>}
                </td>
                <td style={styles.td}>
                  <span style={
                    user.role === 'admin' ? styles.adminBadge : 
                    user.role === 'teacher' ? styles.teacherBadge : 
                    user.role === 'facility' ? styles.facilityBadge :
                    styles.studentBadge
                  }>
                    {user.role === 'admin' ? '管理者' : 
                     user.role === 'teacher' ? '教員' : 
                     user.role === 'facility' ? '施設' :
                     '学生'}
                  </span>
                </td>
                <td style={styles.td}>
                  {user.role === 'student' && user.schedule ? (
                    <div style={{ fontSize: '12px' }}>
                      {user.scheduleStartDate && (
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1976d2' }}>
                          開始: {new Date(user.scheduleStartDate).toLocaleDateString('ja-JP')}〜
                        </div>
                      )}
                      {Object.entries(user.schedule)
                        .filter(([_, fac]) => fac)
                        .map(([day, fac]) => (
                          <div key={day}>
                            {day.replace('day', '')}日目: {FACILITIES[fac]?.name || fac}
                          </div>
                        ))}
                    </div>
                  ) : user.role === 'facility' && user.facilities?.length > 0 ? (
                    user.facilities.map(f => FACILITIES[f]?.name || f).join(', ')
                  ) : user.role === 'student' ? (
                    <span style={{ color: '#999' }}>未設定</span>
                  ) : '-'}
                </td>
                <td style={styles.td}>
                  <span style={styles.dateText}>
                    {user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.dateText}>
                    {user.lastPostDate ? new Date(user.lastPostDate).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </span>
                </td>
                <td style={styles.td}>
                  {user.postCount > 0 ? user.postCount : '-'}
                </td>
                <td style={styles.td}>
                  {editingUser === user.id ? (
                    <div style={styles.editForm}>
                      <input
                        type="text"
                        value={newPasswordForEdit}
                        onChange={(e) => setNewPasswordForEdit(e.target.value)}
                        placeholder="新しいパスワード"
                        style={styles.smallInput}
                      />
                      <button 
                        onClick={() => handleChangePassword(user.id)}
                        style={styles.smallButton}
                      >
                        保存
                      </button>
                      <button 
                        onClick={() => { setEditingUser(null); setNewPasswordForEdit(''); }}
                        style={styles.cancelButton}
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <div style={styles.actions}>
                      <button 
                        onClick={() => setEditingUser(user.id)}
                        style={styles.editButton}
                      >
                        PW変更
                      </button>
                      {user.role === 'student' && (
                        <button
                          onClick={() => handleToggleTest(user.id, user.username)}
                          style={user.isTest ? styles.testOnButton : styles.testOffButton}
                        >
                          {user.isTest ? 'テスト解除' : 'テスト指定'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        style={styles.deleteButton}
                      >
                        削除
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={styles.section}>
        <h2>初期アカウント情報</h2>
        <div style={styles.info}>
          <p><strong>ユーザー名:</strong> admin</p>
          <p><strong>パスワード:</strong> admin123</p>
          <p style={styles.warning}>※ 初回ログイン後、パスワードを変更してください</p>
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #eee'
  },
  backLink: {
    color: '#2196F3',
    textDecoration: 'none'
  },
  accessDenied: {
    textAlign: 'center',
    padding: '50px'
  },
  link: {
    color: '#2196F3',
    textDecoration: 'none'
  },
  section: {
    marginBottom: '40px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  form: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    alignItems: 'flex-end'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    maxHeight: '150px',
    overflowY: 'auto'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '200px'
  },
  smallInput: {
    padding: '6px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '120px'
  },
  select: {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  smallButton: {
    padding: '6px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '6px 12px',
    backgroundColor: '#999',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    marginRight: '8px'
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#333',
    color: 'white'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ddd'
  },
  adminBadge: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  teacherBadge: {
    backgroundColor: '#9C27B0',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  facilityBadge: {
    backgroundColor: '#FF9800',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  studentBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  editForm: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  info: {
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '4px'
  },
  warning: {
    color: '#f44336',
    marginTop: '10px'
  },
  dateText: {
    fontSize: '12px',
    color: '#666',
    whiteSpace: 'nowrap',
  },
  testBadge: {
    backgroundColor: '#FF9800',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    marginLeft: '6px',
    verticalAlign: 'middle',
  },
  testOnButton: {
    padding: '6px 12px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  testOffButton: {
    padding: '6px 12px',
    backgroundColor: '#9E9E9E',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  }
};

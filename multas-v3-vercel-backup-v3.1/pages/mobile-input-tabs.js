import { useState, useEffect, useRef } from 'react';
import { storage } from '../lib/storage';
import { getCategoryName } from '../lib/categories';
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// 動的インポート（SSR回避）
const RadarChart = dynamic(() => import('../components/RadarChart'), { ssr: false });
const SharedLearning = dynamic(() => import('../components/SharedLearning'), { ssr: false });

export default function MobileInputTabs() {
  const [text, setText] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('LOG');
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [gameData, setGameData] = useState({ level: 1, exp: 0, totalExp: 0, totalPosts: 0, expToNextLevel: 100 });
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);
  const [expGainAnimation, setExpGainAnimation] = useState({ show: false, amount: 0 });
  const [currentDay, setCurrentDay] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const mainRef = useRef(null);
  
  const tabs = ['LOG', 'LIST', 'REPORT', 'SHARE'];

  // 初回読み込み時にローカルストレージからデータを復元
  useEffect(() => {
    setIsClient(true);
    const savedPosts = storage.loadPosts();
    if (savedPosts.length > 0) {
      setPosts(savedPosts);
    }
    // ゲームデータを読み込み
    const savedGameData = storage.loadGameData();
    setGameData(savedGameData);
    // 現在の日付を読み込み
    const savedDay = storage.getCurrentDay();
    setCurrentDay(savedDay);
    
    // ユーザー情報を読み込み
    const savedUser = storage.getCurrentUser();
    if (!savedUser) {
      setShowLogin(true);
    } else {
      setCurrentUser(savedUser);
    }
  }, []);
  
  // ログイン処理
  const handleLogin = () => {
    if (!loginName.trim()) return;
    
    const userData = storage.setCurrentUser(loginName.trim());
    setCurrentUser(userData);
    setShowLogin(false);
    setLoginName('');
    
    // ユーザー切り替え時にゲームデータを再読み込み
    const newGameData = storage.loadGameData();
    setGameData(newGameData);
  };
  
  // ログアウト処理
  const handleLogout = () => {
    storage.clearCurrentUser();
    setCurrentUser(null);
    setShowLogin(true);
    setShowAllUsers(false);
  };
  
  // 日付変更ハンドラ
  const handleDayChange = (newDay) => {
    setCurrentDay(newDay);
    storage.setCurrentDay(newDay);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    
    try {
      // 1. OpenAI APIで分類（長文対応）
      const classifyResponse = await fetch('/api/classify-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const classifyData = await classifyResponse.json();
      
      // 2. 複数要素の場合の処理
      let postsToAdd = [];
      
      if (classifyData.isMultiple) {
        // 複数要素がある場合
        
        // まず、オリジナルのテキストを保存（LOG表示用）
        postsToAdd.push({
          id: Date.now(),
          text: text,
          category: classifyData.elements[0].category, // 最初の要素のカテゴリを使用
          reason: '複数要素を含む',
          timestamp: new Date().toLocaleString('ja-JP'),
          isOriginal: true,
          hasElements: true,
          day: currentDay,
          username: currentUser?.username
        });
        
        // 次に、分解された要素を保存（LIST/REPORT用）
        for (const element of classifyData.elements) {
          // Google Sheetsに各要素を保存
          await fetch('/api/save-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: element.text,
              category: element.category,
              reason: element.reason
            })
          });
          
          postsToAdd.push({
            id: Date.now() + Math.random(),
            text: element.text,
            category: element.category,
            reason: element.reason,
            timestamp: new Date().toLocaleString('ja-JP'),
            isElement: true,
            originalId: Date.now(),
            day: currentDay,
            username: currentUser?.username
          });
        }
      } else {
        // 単一要素の場合（従来の処理）
        await fetch('/api/save-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text,
            category: classifyData.category,
            reason: classifyData.reason
          })
        });
        
        postsToAdd.push({
          id: Date.now(),
          text,
          category: classifyData.category,
          reason: classifyData.reason,
          timestamp: new Date().toLocaleString('ja-JP'),
          day: currentDay,
          username: currentUser?.username
        });
      }
      
      // ローカルストレージに保存
      let updatedPosts = [...posts];
      for (const post of postsToAdd) {
        updatedPosts = storage.addPost(post);
      }
      setPosts(updatedPosts);
      setText('');
      
      // 経験値を追加（練習モードの場合はEXPなし）
      const elementCount = classifyData.isMultiple ? classifyData.elements.length : 1;
      const isPracticeMode = currentDay === 'practice';
      const expResult = storage.addExpAndSave(elementCount, isPracticeMode);
      
      // アニメーション表示
      setExpGainAnimation({ show: true, amount: expResult.expGained });
      setTimeout(() => setExpGainAnimation({ show: false, amount: 0 }), 2000);
      
      // ゲームデータを更新
      const newGameData = storage.loadGameData();
      setGameData(newGameData);
      
      // レベルアップ演出
      if (expResult.leveledUp) {
        setLevelUpAnimation(true);
        setTimeout(() => setLevelUpAnimation(false), 3000);
      }
      
      // 最新の投稿が見えるように一番上にスクロール
      setTimeout(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = 0;
          window.scrollTo(0, 0);
        }
      }, 300);
      
    } catch (error) {
      console.error('投稿エラー:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 投稿を削除
  const handleDelete = async (postId) => {
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) return;
    
    // オリジナルポストの場合、関連する要素も削除
    const postsToRemove = [postId];
    if (postToDelete.hasElements) {
      const relatedElements = posts.filter(p => p.originalId === postId);
      postsToRemove.push(...relatedElements.map(p => p.id));
    }
    
    // ローカルストレージから削除
    postsToRemove.forEach(id => storage.removePost(id));
    const updatedPosts = posts.filter(p => !postsToRemove.includes(p.id));
    setPosts(updatedPosts);
    setDeleteConfirmId(null);
  };

  // 投稿を編集
  const handleEdit = async (postId) => {
    if (!editText.trim()) return;
    
    const postToEdit = posts.find(p => p.id === postId);
    if (!postToEdit) return;
    
    setLoading(true);
    
    try {
      // 1. 編集したテキストを再分類
      const classifyResponse = await fetch('/api/classify-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText })
      });
      const classifyData = await classifyResponse.json();
      
      // 2. 既存の関連要素を削除
      let updatedPosts = [...posts];
      if (postToEdit.hasElements) {
        const relatedElements = posts.filter(p => p.originalId === postId);
        const idsToRemove = relatedElements.map(p => p.id);
        idsToRemove.forEach(id => storage.removePost(id));
        updatedPosts = updatedPosts.filter(p => !idsToRemove.includes(p.id));
      }
      
      // 3. 新しいデータで更新
      const updatedPost = {
        ...postToEdit,
        text: editText,
        category: classifyData.isMultiple ? classifyData.elements[0].category : classifyData.category,
        reason: classifyData.isMultiple ? '複数要素を含む' : classifyData.reason,
        hasElements: classifyData.isMultiple,
        edited: true,
        editedAt: new Date().toLocaleString('ja-JP'),
        day: currentDay,
        username: currentUser?.username
      };
      
      // 4. 複数要素の場合は新しい要素を追加
      if (classifyData.isMultiple) {
        for (const element of classifyData.elements) {
          const elementPost = {
            id: Date.now() + Math.random(),
            text: element.text,
            category: element.category,
            reason: element.reason,
            timestamp: new Date().toLocaleString('ja-JP'),
            isElement: true,
            originalId: postId,
            day: currentDay,
            username: currentUser?.username
          };
          updatedPosts.push(elementPost);
          storage.addPost(elementPost);
          
          // Google Sheetsに保存
          await fetch('/api/save-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: element.text,
              category: element.category,
              reason: element.reason
            })
          });
        }
      } else {
        // Google Sheetsに更新を送信
        await fetch('/api/save-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: editText,
            category: updatedPost.category,
            reason: updatedPost.reason
          })
        });
      }
      
      // 5. 元の投稿を更新
      updatedPosts = updatedPosts.map(p => p.id === postId ? updatedPost : p);
      storage.updatePost(updatedPost);
      setPosts(updatedPosts);
      
      setEditingPost(null);
      setEditText('');
      
    } catch (error) {
      console.error('編集エラー:', error);
      alert('編集に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // カテゴリ別にグループ化（LIST/REPORT用）
  // 要素分解されたものを優先、オリジナルで要素分解されたものは除外
  // 現在の日付とユーザーでフィルタリング
  let filteredPosts = storage.getPostsByDay(posts, currentDay);
  if (!showAllUsers && currentUser) {
    filteredPosts = storage.getPostsByUser(filteredPosts, currentUser.username);
  }
  const displayPosts = filteredPosts.filter(post => {
    // 要素分解されたものは含める
    if (post.isElement) return true;
    // オリジナルで要素分解されていないものは含める
    if (!post.hasElements) return true;
    // オリジナルで要素分解されたものは除嚖
    return false;
  });
  
  const groupedPosts = displayPosts.reduce((acc, post) => {
    const category = post.category || '未分類';
    if (!acc[category]) acc[category] = [];
    acc[category].push(post);
    return acc;
  }, {});

  // カテゴリ別カウント（REPORT用）
  const categoryCounts = {};
  for (let i = 1; i <= 12; i++) {
    categoryCounts[i] = displayPosts.filter(p => p.category === i).length;
  }
  
  // レポート生成関数
  const generateReport = async () => {
    setReportLoading(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: displayPosts })
      });
      const data = await response.json();
      if (data.report) {
        setReport(data.report);
      }
    } catch (error) {
      console.error('レポート生成エラー:', error);
      alert('レポート生成に失敗しました');
    } finally {
      setReportLoading(false);
    }
  };
  
  // PDF生成関数
  const generatePDF = async () => {
    try {
      // PDFに含めるコンテンツを作成
      const pdfContent = document.createElement('div');
      pdfContent.style.padding = '20px';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
      
      // タイトル
      const title = document.createElement('h1');
      title.textContent = `MULTAs 実習レポート - ${currentDay === 'practice' ? '練習' : currentDay + '日目'}`;
      title.style.textAlign = 'center';
      title.style.marginBottom = '20px';
      pdfContent.appendChild(title);
      
      // 基本情報
      const info = document.createElement('div');
      info.innerHTML = `
        <p><strong>生成日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
        <p><strong>総記録数:</strong> ${displayPosts.length}件</p>
        <p><strong>レベル:</strong> Lv.${gameData.level} (${gameData.totalExp} EXP)</p>
        <hr style="margin: 20px 0;">
      `;
      pdfContent.appendChild(info);
      
      // レーダーチャートをキャプチャ
      const radarChartElement = document.querySelector('canvas');
      if (radarChartElement) {
        const chartImage = document.createElement('img');
        chartImage.src = radarChartElement.toDataURL();
        chartImage.style.width = '100%';
        chartImage.style.maxWidth = '400px';
        chartImage.style.margin = '0 auto';
        chartImage.style.display = 'block';
        pdfContent.appendChild(chartImage);
      }
      
      // カテゴリ別集計
      const categorySection = document.createElement('div');
      categorySection.innerHTML = '<h2>カテゴリ別集計</h2>';
      const categoryList = document.createElement('ul');
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        if (count > 0) {
          const li = document.createElement('li');
          li.textContent = `${getCategoryName(cat)}: ${count}件`;
          categoryList.appendChild(li);
        }
      });
      categorySection.appendChild(categoryList);
      pdfContent.appendChild(categorySection);
      
      // AIレポート
      if (report) {
        const reportSection = document.createElement('div');
        reportSection.innerHTML = `
          <h2>AI分析レポート</h2>
          <div style="white-space: pre-wrap; line-height: 1.8;">${report}</div>
        `;
        pdfContent.appendChild(reportSection);
      }
      
      // 記録一覧
      const recordsSection = document.createElement('div');
      recordsSection.innerHTML = '<h2 style="page-break-before: always;">記録一覧</h2>';
      displayPosts.forEach((post, index) => {
        const postDiv = document.createElement('div');
        postDiv.style.marginBottom = '15px';
        postDiv.style.padding = '10px';
        postDiv.style.border = '1px solid #ddd';
        postDiv.style.borderRadius = '5px';
        postDiv.innerHTML = `
          <p><strong>${index + 1}. ${getCategoryName(post.category)}</strong></p>
          <p>${post.text}</p>
          <p style="font-size: 12px; color: #666;">${post.timestamp}</p>
        `;
        recordsSection.appendChild(postDiv);
      });
      pdfContent.appendChild(recordsSection);
      
      // DOMに一時的に追加
      document.body.appendChild(pdfContent);
      
      // html2canvasでキャプチャ
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      // jsPDFでPDF生成
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4幅
      const pageHeight = 297; // A4高さ
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // 最初のページ
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // 複数ページの場合
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // PDFダウンロード
      const fileName = `MULTAs_レポート_${currentDay === 'practice' ? '練習' : currentDay + '日目'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      // 一時的な要素を削除
      document.body.removeChild(pdfContent);
      
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDFの生成に失敗しました');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'LOG':
        return (
          <>
            {/* 投稿リスト */}
            <main style={styles.main} ref={mainRef}>
              {!isClient ? (
                <div style={styles.emptyState}>
                  <p>読み込み中...</p>
                </div>
              ) : filteredPosts.filter(p => !p.isElement).length === 0 ? (
                <div style={styles.emptyState}>
                  <p>📝</p>
                  <p>まだ記録がありません</p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    実習で体験したことを記録しましょう
                  </p>
                </div>
              ) : (
                <div style={styles.postList}>
                  {filteredPosts.filter(post => !post.isElement).map(post => (
                    <div key={post.id} style={styles.post}>
                      {editingPost === post.id ? (
                        // 編集モード
                        <div style={styles.editContainer}>
                          <textarea
                            style={styles.editTextarea}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            autoFocus
                          />
                          <div style={styles.editButtons}>
                            <button
                              style={styles.saveButton}
                              onClick={() => handleEdit(post.id)}
                              disabled={loading || !editText.trim()}
                            >
                              保存
                            </button>
                            <button
                              style={styles.cancelButton}
                              onClick={() => {
                                setEditingPost(null);
                                setEditText('');
                              }}
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 表示モード
                        <>
                          <div style={styles.postHeader}>
                            <div style={styles.postText}>
                              {post.text}
                            </div>
                            <div style={styles.postActions}>
                              <button
                                style={styles.iconButton}
                                onClick={() => {
                                  setEditingPost(post.id);
                                  setEditText(post.text);
                                }}
                                title="編集"
                              >
                                ✏️
                              </button>
                              <button
                                style={styles.iconButton}
                                onClick={() => setDeleteConfirmId(post.id)}
                                title="削除"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div style={styles.postFooter}>
                            <span style={styles.timestamp}>
                              {post.timestamp}
                              {post.edited && ` (編集済: ${post.editedAt})`}
                              {post.username && ` - ${post.username}`}
                            </span>
                            <span style={styles.categoryTag}>
                              {getCategoryName(post.category)}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {/* 削除確認ダイアログ */}
                      {deleteConfirmId === post.id && (
                        <div style={styles.deleteConfirm}>
                          <p>本当に削除しますか？</p>
                          <div style={styles.confirmButtons}>
                            <button
                              style={styles.deleteButton}
                              onClick={() => handleDelete(post.id)}
                            >
                              削除
                            </button>
                            <button
                              style={styles.cancelButton}
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </main>

            {/* 入力フォーム（LOG画面のみ） */}
            <div style={styles.inputContainer}>
              <textarea
                style={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="実習で体験したことを入力..."
                disabled={loading}
              />
              <button
                style={{
                  ...styles.button,
                  opacity: loading || !text.trim() ? 0.5 : 1
                }}
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
              >
                {loading ? '送信中...' : '送信'}
              </button>
            </div>
          </>
        );

      case 'LIST':
        return (
          <main style={styles.mainWithoutInput}>
            <h2 style={styles.sectionTitle}>分類別リスト</h2>
            {Object.keys(groupedPosts).length === 0 ? (
              <div style={styles.emptyState}>
                <p>まだ記録がありません</p>
              </div>
            ) : (
              <div style={styles.categoryList}>
                {Object.entries(groupedPosts).sort((a, b) => a[0] - b[0]).map(([category, posts]) => (
                  <div key={category} style={styles.categoryGroup}>
                    <h3 style={styles.categoryTitle}>
                      {getCategoryName(category)} ({posts.length}件)
                    </h3>
                    {posts.map(post => (
                      <div key={post.id} style={styles.listItem}>
                        <div style={styles.listItemText}>{post.text}</div>
                        {/* AI分類理由は非表示
                        <div style={styles.listItemReason}>{post.reason}</div>
                        */}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </main>
        );

      case 'REPORT':
        return (
          <main style={styles.mainWithoutInput}>
            <div style={styles.statsContainer}>
              {displayPosts.length > 0 && (
                <RadarChart posts={displayPosts} />
              )}
              
              <div style={styles.statCard}>
                <h3>総記録数</h3>
                <p style={styles.statNumber}>{displayPosts.length}</p>
              </div>
              
              <div style={styles.categoryStats}>
                <h3>カテゴリ別集計</h3>
                <div style={styles.categoryGrid}>
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <div key={cat} style={styles.categoryStat}>
                      <span>{getCategoryName(cat)}:</span>
                      <span>{count}件</span>
                    </div>
                  ))}
                </div>
              </div>

              {displayPosts.length >= 10 && (
                <div style={styles.reportSection}>
                  <button 
                    style={{
                      ...styles.reportButton,
                      opacity: reportLoading ? 0.7 : 1
                    }}
                    onClick={generateReport}
                    disabled={reportLoading}
                  >
                    {reportLoading ? 'AIレポート生成中...' : 'AIレポートを生成'}
                  </button>
                  <p style={styles.reportNote}>
                    ※10件以上の記録でレポート生成が可能です
                  </p>
                </div>
              )}
              
              {report && (
                <div style={styles.generatedReport} id="pdf-report-content">
                  <h3>AI生成レポート</h3>
                  <div style={styles.reportContent}>
                    {report}
                  </div>
                  <p style={styles.reportTimestamp}>
                    生成日時: {new Date().toLocaleString('ja-JP')}
                  </p>
                </div>
              )}
              
              {/* PDF出力ボタン */}
              {(report || displayPosts.length > 0) && (
                <div style={styles.pdfSection}>
                  <button
                    style={styles.pdfButton}
                    onClick={generatePDF}
                  >
                    📥 PDFでダウンロード
                  </button>
                  <p style={styles.pdfNote}>
                    ※現在表示中のレポートをPDF化します
                  </p>
                </div>
              )}
            </div>
          </main>
        );
        
      case 'SHARE':
        return (
          <main style={styles.mainWithoutInput}>
            <SharedLearning />
          </main>
        );
    }
  };

  // ログイン画面
  if (showLogin) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>MULTAs v3</h1>
          <p style={styles.loginSubtitle}>医学部実習記録システム</p>
          
          <div style={styles.loginForm}>
            <label style={styles.loginLabel}>お名前を入力してください</label>
            <input
              type="text"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="例: 山田太郎"
              style={styles.loginInput}
              autoFocus
            />
            <button
              onClick={handleLogin}
              disabled={!loginName.trim()}
              style={{
                ...styles.loginButton,
                opacity: !loginName.trim() ? 0.5 : 1
              }}
            >
              始める
            </button>
          </div>
          
          <p style={styles.loginNote}>
            ※名前は他の学生と重複しないようにしてください
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.headerContent}>
            <div>
              <h1 style={styles.title}>MULTAs v3</h1>
              <div style={styles.subtitle}>医学部実習記録システム</div>
            </div>
            <div style={styles.levelDisplay}>
              <div style={styles.levelBadge}>Lv.{gameData.level}</div>
              <div style={styles.expBar}>
                <div style={styles.expBarInner} 
                     style={{ 
                       ...styles.expBarInner, 
                       width: `${(gameData.exp / gameData.expToNextLevel) * 100}%` 
                     }} 
                />
                <div style={styles.expText}>
                  {gameData.exp}/{gameData.expToNextLevel} EXP
                </div>
              </div>
            </div>
            <div style={styles.userInfo}>
              <span style={styles.username}>👤 {currentUser?.username}</span>
              <button 
                style={styles.logoutButton} 
                onClick={handleLogout}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
        <div style={styles.daySelector}>
          <select 
            style={styles.dayDropdown} 
            value={currentDay} 
            onChange={(e) => handleDayChange(e.target.value === 'practice' ? 'practice' : parseInt(e.target.value))}
          >
            <option value={1}>1日目</option>
            <option value={2}>2日目</option>
            <option value={3}>3日目</option>
            <option value={4}>4日目</option>
            <option value={5}>5日目</option>
            <option value="practice">練習用</option>
          </select>
          {currentDay === 'practice' && (
            <span style={styles.practiceMode}>※練習モード（EXPなし）</span>
          )}
          <label style={styles.filterToggle}>
            <input
              type="checkbox"
              checked={showAllUsers}
              onChange={(e) => setShowAllUsers(e.target.checked)}
            />
            全ユーザー表示
          </label>
        </div>
      </header>
      
      {/* 経験値獲得アニメーション */}
      {expGainAnimation.show && (
        <div style={styles.expGainFloat}>+{expGainAnimation.amount} EXP</div>
      )}
      
      {/* レベルアップアニメーション */}
      {levelUpAnimation && (
        <div style={styles.levelUpOverlay}>
          <div style={styles.levelUpText}>LEVEL UP!</div>
          <div style={styles.levelUpNewLevel}>Lv.{gameData.level}</div>
        </div>
      )}

      {/* タブナビゲーション */}
      <nav style={styles.tabNav}>
        {tabs.map(tab => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* タブコンテンツ */}
      {renderTabContent()}

      {/* Safari対策の白いスペーサー（LOG画面のみ） */}
      {activeTab === 'LOG' && <div style={styles.safariSpacer} />}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
  },
  
  header: {
    backgroundColor: '#2196F3',
    color: 'white',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  headerTop: {
    padding: '15px 20px'
  },
  
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '800px',
    margin: '0 auto'
  },
  
  daySelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)'
  },
  
  dayDropdown: {
    padding: '6px 12px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
    fontWeight: 'bold'
  },
  
  practiceMode: {
    fontSize: '14px',
    color: '#FFE082',
    fontWeight: 'bold'
  },
  
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold'
  },
  
  subtitle: {
    fontSize: '14px',
    opacity: 0.9,
    marginTop: '4px'
  },

  tabNav: {
    display: 'flex',
    backgroundColor: 'white',
    borderBottom: '1px solid #ddd',
    position: 'fixed',
    top: '180px', // ユーザー情報と日付選択を含むヘッダーの高さ
    left: 0,
    right: 0,
    zIndex: 90
  },

  tab: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#666',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s'
  },

  activeTab: {
    color: '#2196F3',
    borderBottomColor: '#2196F3'
  },
  
  main: {
    flex: 1,
    marginTop: '240px', // ヘッダー + タブ分
    marginBottom: '140px',
    padding: '20px',
    paddingTop: '10px',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch'
  },

  mainWithoutInput: {
    flex: 1,
    marginTop: '140px',
    marginBottom: '20px',
    padding: '20px',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch'
  },

  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333'
  },
  
  emptyState: {
    textAlign: 'center',
    color: '#666',
    marginTop: '60px',
    fontSize: '16px'
  },
  
  postList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  post: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  postFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    fontSize: '12px'
  },
  
  categoryTag: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  
  timestamp: {
    color: '#999'
  },
  
  postText: {
    fontSize: '16px',
    lineHeight: '1.5'
  },
  
  postReason: {
    fontSize: '14px',
    color: '#666',
    borderTop: '1px solid #eee',
    paddingTop: '8px',
    marginTop: '8px'
  },

  // LIST画面用スタイル
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  categoryGroup: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },

  categoryTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: '12px'
  },

  listItem: {
    borderBottom: '1px solid #eee',
    paddingBottom: '12px',
    marginBottom: '12px'
  },

  listItemText: {
    fontSize: '15px',
    lineHeight: '1.5',
    marginBottom: '6px'
  },

  listItemReason: {
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic'
  },

  // REPORT画面用スタイル
  statsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },

  statNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#2196F3',
    margin: '10px 0'
  },

  categoryStats: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },

  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginTop: '10px'
  },

  categoryStat: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '14px'
  },

  reportSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },

  reportButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  reportNote: {
    fontSize: '14px',
    color: '#666',
    marginTop: '10px'
  },
  
  inputContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTop: '1px solid #ddd',
    padding: '12px',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
    zIndex: 200
  },
  
  textarea: {
    flex: 1,
    minHeight: '60px',
    maxHeight: '120px',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  
  button: {
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  
  safariSpacer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '120px',
    backgroundColor: 'white',
    zIndex: 150
  },
  
  elementBadge: {
    backgroundColor: '#FF9800',
    color: 'white',
    fontSize: '12px',
    padding: '2px 6px',
    borderRadius: '4px',
    marginRight: '8px',
    fontWeight: 'bold'
  },
  
  generatedReport: {
    backgroundColor: '#E8F5E9',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  reportContent: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#333',
    marginTop: '10px',
    whiteSpace: 'pre-wrap'
  },
  
  reportTimestamp: {
    fontSize: '12px',
    color: '#666',
    marginTop: '10px',
    textAlign: 'right'
  },
  
  // 編集・削除機能のスタイル
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px'
  },
  
  postActions: {
    display: 'flex',
    gap: '4px',
    flexShrink: 0
  },
  
  iconButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background 0.2s'
  },
  
  editContainer: {
    width: '100%'
  },
  
  editTextarea: {
    width: '100%',
    minHeight: '80px',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #2196F3',
    borderRadius: '8px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  
  editButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    justifyContent: 'flex-end'
  },
  
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#ccc',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  
  deleteConfirm: {
    backgroundColor: '#FFF3E0',
    padding: '12px',
    borderRadius: '4px',
    marginTop: '8px',
    fontSize: '14px'
  },
  
  confirmButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  },
  
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  
  // レベル・経験値表示用スタイル
  levelDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '5px'
  },
  
  levelBadge: {
    backgroundColor: '#FFD700',
    color: '#333',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  
  expBar: {
    width: '120px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    position: 'relative',
    overflow: 'hidden'
  },
  
  expBarInner: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: '10px',
    transition: 'width 0.5s ease'
  },
  
  expText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
  },
  
  expGainFloat: {
    position: 'fixed',
    top: '120px',
    right: '20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 1000,
    animation: 'floatUp 2s ease-out forwards',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
  },
  
  levelUpOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.5s ease-out'
  },
  
  levelUpText: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#FFD700',
    textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
    animation: 'pulse 1s ease-in-out infinite'
  },
  
  levelUpNewLevel: {
    fontSize: '36px',
    color: 'white',
    marginTop: '20px',
    fontWeight: 'bold'
  },
  
  // SHARE画面用スタイル
  shareDescription: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#E3F2FD',
    borderRadius: '8px'
  },
  
  sharedLearnings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  
  comingSoon: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    color: '#999'
  },
  
  // PDF出力用スタイル
  pdfSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '20px'
  },
  
  pdfButton: {
    padding: '12px 24px',
    backgroundColor: '#FF5722',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  
  pdfNote: {
    fontSize: '14px',
    color: '#666',
    marginTop: '10px'
  },
  
  // ログイン画面用スタイル
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  
  loginBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center'
  },
  
  loginTitle: {
    fontSize: '32px',
    color: '#2196F3',
    marginBottom: '8px'
  },
  
  loginSubtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px'
  },
  
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  
  loginLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'left'
  },
  
  loginInput: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  
  loginButton: {
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px'
  },
  
  loginNote: {
    fontSize: '14px',
    color: '#999',
    marginTop: '20px'
  },
  
  // ユーザー情報表示
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  
  username: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white'
  },
  
  logoutButton: {
    padding: '4px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  
  filterToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: 'white',
    marginLeft: 'auto',
    cursor: 'pointer'
  }
};